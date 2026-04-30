# Authentication Integration Guide

**Provider:** AWS Cognito User Pool  
**Auth Method:** Email/Password with JWT

---

## Overview

Authentication flow:

1. User signs up/logs in via frontend
2. Cognito issues JWT access token + refresh token
3. Frontend stores tokens, includes access token in API requests
4. API Gateway validates JWT automatically
5. Lambda extracts user ID from JWT claims

---

## Cognito User Pool Setup

### Manual Setup (AWS Console)

1. **Create User Pool**
   - Go to AWS Console → Cognito → Create User Pool
   - Sign-in options: Email
   - Password policy: Minimum 8 characters, require numbers, special characters
   - MFA: Optional (can add later)
   - Self-service sign-up: Enabled
   - Email verification: Required

2. **Configure App Client**
   - Create app client: `personal-os-web`
   - Authentication flows: `ALLOW_USER_PASSWORD_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
   - Token validity:
     - Access token: 1 hour
     - Refresh token: 30 days
   - Generate client secret: No (public client for SPA)

3. **Configure Domain**
   - Cognito domain: `personal-os` (or custom domain)
   - Used for hosted UI (optional)

### Infrastructure note (current monorepo)

Cognito is created by Terraform (**`infrastructure/modules/api-cognito`**). The YAML below is a **legacy illustration** only.

Legacy shape (reference only):

```yaml
resources:
  Resources:
    # Cognito User Pool
    CognitoUserPool:
      Type: AWS::Cognito::UserPool
      Properties:
        UserPoolName: personal-os-${self:provider.stage}
        AutoVerifiedAttributes:
          - email
        UsernameAttributes:
          - email
        UsernameConfiguration:
          CaseSensitive: false
        Policies:
          PasswordPolicy:
            MinimumLength: 8
            RequireUppercase: true
            RequireLowercase: true
            RequireNumbers: true
            RequireSymbols: false
        Schema:
          - Name: email
            Required: true
            Mutable: true
        AccountRecoverySetting:
          RecoveryMechanisms:
            - Name: verified_email
              Priority: 1

    # Cognito User Pool Client
    CognitoUserPoolClient:
      Type: AWS::Cognito::UserPoolClient
      Properties:
        ClientName: personal-os-web-${self:provider.stage}
        UserPoolId: !Ref CognitoUserPool
        GenerateSecret: false
        ExplicitAuthFlows:
          - ALLOW_USER_PASSWORD_AUTH
          - ALLOW_REFRESH_TOKEN_AUTH
          - ALLOW_USER_SRP_AUTH
        PreventUserExistenceErrors: ENABLED
        AccessTokenValidity: 1
        IdTokenValidity: 1
        RefreshTokenValidity: 30
        TokenValidityUnits:
          AccessToken: hours
          IdToken: hours
          RefreshToken: days

  Outputs:
    UserPoolId:
      Value: !Ref CognitoUserPool
      Export:
        Name: ${self:service}-${self:provider.stage}-UserPoolId

    UserPoolClientId:
      Value: !Ref CognitoUserPoolClient
      Export:
        Name: ${self:service}-${self:provider.stage}-UserPoolClientId

    UserPoolArn:
      Value: !GetAtt CognitoUserPool.Arn
      Export:
        Name: ${self:service}-${self:provider.stage}-UserPoolArn
```

---

## API Gateway JWT Authorizer

Configure HTTP API to validate JWTs automatically:

```yaml
provider:
  httpApi:
    authorizers:
      cognitoAuthorizer:
        type: jwt
        identitySource: $request.header.Authorization
        issuerUrl:
          Fn::Sub: https://cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPool}
        audience:
          - !Ref CognitoUserPoolClient

functions:
  tasks:
    handler: handlers/tasks_handler.handler
    events:
      - httpApi:
          path: /tasks
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /tasks
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /tasks/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      # ... more endpoints

  # Auth endpoints (no authorizer)
  auth:
    handler: handlers/auth_handler.handler
    events:
      - httpApi:
          path: /auth/signup
          method: POST
      - httpApi:
          path: /auth/login
          method: POST
      - httpApi:
          path: /auth/refresh
          method: POST
```

---

## Backend JWT Handling

### Extract User ID from JWT

The JWT payload contains:

```json
{
  "sub": "abc-123-def-456", // User ID
  "email": "user@example.com",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxx",
  "exp": 1704931200,
  "iat": 1704927600
}
```

### FastAPI Dependency

```python
# src/core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from functools import lru_cache
from src.core.config import settings

security = HTTPBearer()

@lru_cache()
def get_jwks_client():
    """Cache JWKS client for performance."""
    jwks_url = f"https://cognito-idp.{settings.AWS_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    return PyJWKClient(jwks_url)

def decode_jwt(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.COGNITO_CLIENT_ID,
            issuer=f"https://cognito-idp.{settings.AWS_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Dependency to extract current user from JWT.

    Usage:
        @router.get("/tasks")
        async def list_tasks(user: dict = Depends(get_current_user)):
            user_id = user["sub"]
            ...
    """
    token = credentials.credentials
    payload = decode_jwt(token)
    return {
        "id": payload["sub"],
        "email": payload.get("email"),
    }

# Type alias for cleaner code
CurrentUser = Depends(get_current_user)
```

### Usage in Routes

```python
# src/api/routes/tasks.py
from fastapi import APIRouter, Depends
from src.core.security import get_current_user
from src.services.tasks import TasksService

router = APIRouter()

@router.get("")
async def list_tasks(
    user: dict = Depends(get_current_user),
    status: str = None,
    area: str = None
):
    """List all tasks for current user."""
    user_id = user["id"]
    tasks = await TasksService.list_tasks(user_id, status=status, area=area)
    return {"success": True, "data": tasks}

@router.post("")
async def create_task(
    task: CreateTaskRequest,
    user: dict = Depends(get_current_user)
):
    """Create a new task."""
    user_id = user["id"]
    created = await TasksService.create_task(user_id, task)
    return {"success": True, "data": created}
```

---

## Auth Endpoints Implementation

### Signup

```python
# src/api/routes/auth.py
import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from src.core.config import settings

router = APIRouter()
cognito = boto3.client('cognito-idp', region_name=settings.AWS_REGION)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class SignupResponse(BaseModel):
    userId: str
    email: str
    message: str

@router.post("/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
    """Create a new user account."""
    try:
        response = cognito.sign_up(
            ClientId=settings.COGNITO_CLIENT_ID,
            Username=request.email,
            Password=request.password,
            UserAttributes=[
                {"Name": "email", "Value": request.email}
            ]
        )

        return SignupResponse(
            userId=response["UserSub"],
            email=request.email,
            message="Verification email sent. Please verify your email."
        )
    except cognito.exceptions.UsernameExistsException:
        raise HTTPException(
            status_code=409,
            detail="User with this email already exists"
        )
    except cognito.exceptions.InvalidPasswordException as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid password: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Signup failed: {str(e)}"
        )
```

### Login

```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int
    user: dict

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return tokens."""
    try:
        response = cognito.initiate_auth(
            ClientId=settings.COGNITO_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": request.email,
                "PASSWORD": request.password
            }
        )

        auth_result = response["AuthenticationResult"]

        # Decode access token to get user info
        # (In production, you might fetch from Cognito instead)
        import jwt
        payload = jwt.decode(
            auth_result["AccessToken"],
            options={"verify_signature": False}
        )

        return LoginResponse(
            accessToken=auth_result["AccessToken"],
            refreshToken=auth_result["RefreshToken"],
            expiresIn=auth_result["ExpiresIn"],
            user={
                "id": payload["sub"],
                "email": request.email
            }
        )
    except cognito.exceptions.NotAuthorizedException:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    except cognito.exceptions.UserNotConfirmedException:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )
```

### Refresh Token

```python
class RefreshRequest(BaseModel):
    refreshToken: str

@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    """Refresh access token using refresh token."""
    try:
        response = cognito.initiate_auth(
            ClientId=settings.COGNITO_CLIENT_ID,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": request.refreshToken
            }
        )

        auth_result = response["AuthenticationResult"]

        return {
            "success": True,
            "data": {
                "accessToken": auth_result["AccessToken"],
                "expiresIn": auth_result["ExpiresIn"]
            }
        }
    except cognito.exceptions.NotAuthorizedException:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )
```

---

## Frontend Integration

### Update AuthContext.tsx

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const AUTH_TOKENS_KEY = 'gs_auth_tokens';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load tokens from storage on mount
    const stored = localStorage.getItem(AUTH_TOKENS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthTokens;
      setTokens(parsed);
      // Decode user from token (or fetch from /auth/me)
      fetchCurrentUser(parsed.accessToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      const authTokens: AuthTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresAt: Date.now() + (data.data.expiresIn * 1000)
      };

      localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(authTokens));
      setTokens(authTokens);
      setUser(data.data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      // User needs to verify email before logging in
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem(AUTH_TOKENS_KEY);
    setTokens(null);
    setUser(null);
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!tokens) return null;

    // Check if token is expired (with 5 min buffer)
    if (Date.now() > tokens.expiresAt - 300000) {
      // Refresh token
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken })
        });

        const data = await response.json();

        if (response.ok) {
          const newTokens: AuthTokens = {
            ...tokens,
            accessToken: data.data.accessToken,
            expiresAt: Date.now() + (data.data.expiresIn * 1000)
          };
          localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(newTokens));
          setTokens(newTokens);
          return newTokens.accessToken;
        } else {
          // Refresh failed, sign out
          await signOut();
          return null;
        }
      } catch (err) {
        await signOut();
        return null;
      }
    }

    return tokens.accessToken;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      getAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Update API Storage Adapter

```typescript
// src/lib/storage/api-storage-adapter.ts
import type { IStorageAdapter } from './storage-interface';

class APIStorageAdapterImpl implements IStorageAdapter {
  private getAccessToken: () => Promise<string | null>;

  constructor(getAccessToken: () => Promise<string | null>) {
    this.getAccessToken = getAccessToken;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getAll<T>(collection: string): Promise<T[]> {
    const response = await fetch(`${API_URL}/${collection}`, {
      headers: await this.getHeaders(),
    });
    const data = await response.json();
    return data.data || [];
  }

  // ... rest of methods with auth headers
}
```

---

## Environment Variables

### Backend (.env)

```bash
# AWS
AWS_REGION=us-east-1

# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Stage
STAGE=dev
```

### Frontend (.env)

```bash
VITE_API_URL=https://api.sunnysingh.tech
# or for dev: https://dev-api.sunnysingh.tech
```

---

## Testing Auth Flow

### 1. Create Test User

```bash
# Using AWS CLI
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username your@email.com \
  --temporary-password TempPass123! \
  --user-attributes Name=email,Value=your@email.com Name=email_verified,Value=true

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username your@email.com \
  --password YourSecurePassword123! \
  --permanent
```

### 2. Test Login (curl)

```bash
curl -X POST https://api.sunnysingh.tech/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "YourSecurePassword123!"}'
```

### 3. Test Protected Endpoint

```bash
TOKEN="eyJhbGc..."

curl https://api.sunnysingh.tech/tasks \
  -H "Authorization: Bearer $TOKEN"
```

---

## Security Considerations

1. **HTTPS Only:** All endpoints served over HTTPS via API Gateway
2. **Token Storage:** Store in localStorage (acceptable for SPA) or httpOnly cookies
3. **Token Refresh:** Implement automatic refresh before expiration
4. **CORS:** Configure API Gateway to only allow `sunnysingh.tech`
5. **Rate Limiting:** Implement rate limits on auth endpoints (10 req/min)
6. **Password Policy:** Enforce strong passwords via Cognito
7. **Email Verification:** Require email verification before login
