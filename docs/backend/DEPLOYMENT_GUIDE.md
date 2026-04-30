# Deployment Guide

> **Superseded:** Use monorepo [`docs/backend/DEPLOYMENT.md`](../../../docs/backend/DEPLOYMENT.md) and `infrastructure/envs-api/`. This copy is a **historical** Serverless-oriented guide.

**Target Infrastructure:** AWS (Lambda, API Gateway, DynamoDB, Cognito, Secrets Manager)  
**IaC (historical doc):** Serverless Framework  
**Domain:** api.sunnysingh.tech (prod), dev-api.sunnysingh.tech (dev)

---

## Prerequisites

### 1. AWS Account & CLI

```bash
# Verify AWS CLI is installed and configured
aws --version
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-user"
# }
```

### 2. Node.js & Serverless Framework

```bash
# Install Node.js 18+ (required for Serverless Framework)
node --version  # Should be 18.x or higher

# Install Serverless Framework globally
npm install -g serverless

# Verify installation
serverless --version
```

### 3. Python 3.12

```bash
# Verify Python version
python --version  # Should be 3.12.x

# Or on some systems
python3 --version
```

### 4. Domain Verification

Ensure you have access to manage DNS for `sunnysingh.tech` at Namecheap.

---

## Step 1: Create Backend Repository

```bash
# Create new repository
mkdir personal-os-api
cd personal-os-api

# Initialize git
git init

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Create initial structure
mkdir -p src/{api/{routes,schemas},core,db,services,ai/{providers,schemas,prompts,features},utils}
mkdir -p handlers tests

# Create requirements files
touch requirements.txt requirements-dev.txt
touch serverless.yml
touch .env.example .gitignore README.md
```

---

## Step 2: Configure Serverless Framework

### serverless.yml

```yaml
service: personal-os-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: python3.12
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 512
  timeout: 30

  environment:
    STAGE: ${self:provider.stage}
    TABLE_NAME: personal-os-${self:provider.stage}
    COGNITO_USER_POOL_ID: !Ref CognitoUserPool
    COGNITO_CLIENT_ID: !Ref CognitoUserPoolClient
    AWS_REGION_NAME: ${self:provider.region}

  httpApi:
    cors:
      allowedOrigins:
        - https://sunnysingh.tech
        - http://localhost:5173
      allowedHeaders:
        - Content-Type
        - Authorization
      allowedMethods:
        - GET
        - POST
        - PATCH
        - DELETE
        - OPTIONS
    authorizers:
      cognitoAuthorizer:
        type: jwt
        identitySource: $request.header.Authorization
        issuerUrl:
          Fn::Sub: https://cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPool}
        audience:
          - !Ref CognitoUserPoolClient

  iam:
    role:
      statements:
        # DynamoDB
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:BatchGetItem
            - dynamodb:BatchWriteItem
          Resource:
            - !GetAtt DynamoDBTable.Arn
            - !Sub ${DynamoDBTable.Arn}/index/*

        # Secrets Manager
        - Effect: Allow
          Action:
            - secretsmanager:GetSecretValue
          Resource:
            - !Sub arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:personal-os/${self:provider.stage}/*

        # Cognito (for auth endpoints)
        - Effect: Allow
          Action:
            - cognito-idp:AdminCreateUser
            - cognito-idp:AdminSetUserPassword
            - cognito-idp:AdminInitiateAuth
          Resource:
            - !GetAtt CognitoUserPool.Arn

plugins:
  - serverless-python-requirements
  - serverless-domain-manager

custom:
  pythonRequirements:
    dockerizePip: true
    slim: true
    slimPatternsAppendDefaults: false
    slimPatterns:
      - '**/*.pyc'
      - '**/__pycache__'
      - '**/tests'
      - '**/test'
      - '**/*.md'
      - '**/*.txt'
    noDeploy:
      - pytest
      - black
      - mypy

  customDomain:
    domainName: ${self:custom.domainNames.${self:provider.stage}}
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: false # Managing DNS in Namecheap
    certificateArn: ${self:custom.certificateArn}
    endpointType: regional
    apiType: http

  domainNames:
    dev: dev-api.sunnysingh.tech
    prod: api.sunnysingh.tech

  # You'll need to create this certificate manually first
  certificateArn: arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID

functions:
  # Auth (public endpoints)
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
      - httpApi:
          path: /auth/me
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # Tasks
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
      - httpApi:
          path: /tasks/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /tasks/{id}
          method: DELETE
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /tasks/{id}/complete
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /tasks/{id}/dependencies
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /tasks/{id}/dependencies
          method: POST
          authorizer:
            name: cognitoAuthorizer

  # Goals
  goals:
    handler: handlers/goals_handler.handler
    events:
      - httpApi:
          path: /goals
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}
          method: DELETE
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}/progress
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}/tasks
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}/tasks
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}/metrics
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /goals/{id}/habits
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # Metrics
  metrics:
    handler: handlers/metrics_handler.handler
    events:
      - httpApi:
          path: /metrics
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}
          method: DELETE
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}/logs
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}/logs
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}/milestones
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /metrics/{id}/analytics
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # Habits
  habits:
    handler: handlers/habits_handler.handler
    events:
      - httpApi:
          path: /habits
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits/{id}
          method: DELETE
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits/{id}/logs
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits/{id}/logs
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /habits/today
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # Projects
  projects:
    handler: handlers/projects_handler.handler
    events:
      - httpApi:
          path: /projects
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /projects
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /projects/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /projects/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /projects/{id}
          method: DELETE
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /projects/{id}/tasks
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # Logbook
  logbook:
    handler: handlers/logbook_handler.handler
    events:
      - httpApi:
          path: /logbook
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /logbook
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /logbook/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /logbook/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /logbook/{id}
          method: DELETE
          authorizer:
            name: cognitoAuthorizer

  # Rewards
  rewards:
    handler: handlers/rewards_handler.handler
    events:
      - httpApi:
          path: /rewards
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /rewards
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /rewards/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /rewards/{id}
          method: PATCH
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /rewards/{id}/redeem
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /wallet
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # Knowledge Vault
  knowledge:
    handler: handlers/knowledge_handler.handler
    events:
      - httpApi:
          path: /knowledge/courses
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /knowledge/courses
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /knowledge/courses/{id}
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /knowledge/flashcards
          method: GET
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /knowledge/skills
          method: GET
          authorizer:
            name: cognitoAuthorizer

  # AI Features
  ai:
    handler: handlers/ai_handler.handler
    timeout: 60 # LLM calls can take longer
    memorySize: 1024 # More memory for LLM processing
    events:
      - httpApi:
          path: /ai/tasks/parse
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/tasks/breakdown
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/tasks/prioritize
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/tasks/estimate
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/tasks/categorize
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/goals/refine
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/goals/criteria
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/goals/cascade
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/goals/forecast
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/metrics/patterns
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/metrics/anomalies
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/metrics/correlations
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/metrics/predict
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/habits/design
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/logbook/prompts
          method: POST
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          path: /ai/weekly-review
          method: POST
          authorizer:
            name: cognitoAuthorizer

resources:
  Resources:
    # DynamoDB Table
    DynamoDBTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: personal-os-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: pk
            AttributeType: S
          - AttributeName: sk
            AttributeType: S
          - AttributeName: gsi1pk
            AttributeType: S
          - AttributeName: gsi1sk
            AttributeType: S
          - AttributeName: gsi2pk
            AttributeType: S
          - AttributeName: gsi2sk
            AttributeType: S
        KeySchema:
          - AttributeName: pk
            KeyType: HASH
          - AttributeName: sk
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: gsi1pk
                KeyType: HASH
              - AttributeName: gsi1sk
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
          - IndexName: GSI2
            KeySchema:
              - AttributeName: gsi2pk
                KeyType: HASH
              - AttributeName: gsi2sk
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true

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
    ApiEndpoint:
      Value: !Sub https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com
      Export:
        Name: ${self:service}-${self:provider.stage}-ApiEndpoint

    UserPoolId:
      Value: !Ref CognitoUserPool
      Export:
        Name: ${self:service}-${self:provider.stage}-UserPoolId

    UserPoolClientId:
      Value: !Ref CognitoUserPoolClient
      Export:
        Name: ${self:service}-${self:provider.stage}-UserPoolClientId

    TableName:
      Value: !Ref DynamoDBTable
      Export:
        Name: ${self:service}-${self:provider.stage}-TableName
```

---

## Step 3: Install Dependencies

```bash
# Install Serverless plugins
npm init -y
npm install --save-dev serverless-python-requirements serverless-domain-manager

# Install Python dependencies
pip install -r requirements.txt
```

### requirements.txt

```
# FastAPI
fastapi>=0.115.0
mangum>=0.18.0
pydantic>=2.0.0
pydantic-settings>=2.0.0

# AWS
boto3>=1.35.0

# Authentication
pyjwt[crypto]>=2.8.0

# LangChain
langchain>=0.3.0
langchain-core>=0.3.0
langchain-anthropic>=0.3.0
langchain-openai>=0.3.0
langchain-google-genai>=2.0.0
langchain-groq>=0.2.0

# Utilities
python-ulid>=2.0.0
python-dateutil>=2.8.0
```

---

## Step 4: Create SSL Certificate

Before deploying with custom domain, create an ACM certificate:

```bash
# Request certificate (must be in us-east-1 for API Gateway)
aws acm request-certificate \
  --domain-name api.sunnysingh.tech \
  --subject-alternative-names dev-api.sunnysingh.tech \
  --validation-method DNS \
  --region us-east-1

# Note the CertificateArn from output
# Example: arn:aws:acm:us-east-1:123456789012:certificate/abc123-def456
```

### Validate Certificate (DNS)

1. Go to AWS Certificate Manager console
2. Find the pending certificate
3. Copy the CNAME name and value for validation
4. Add CNAME record in Namecheap:
   - Host: `_abc123.api` (the part before .sunnysingh.tech)
   - Value: `_xyz789.acm-validations.aws.` (from ACM)
5. Wait for validation (can take 5-30 minutes)

---

## Step 5: Create Secrets

```bash
# Create LLM API keys secret
aws secretsmanager create-secret \
  --name personal-os/dev/llm-keys \
  --secret-string '{"anthropic":"sk-ant-xxxxx","openai":"sk-xxxxx"}'

aws secretsmanager create-secret \
  --name personal-os/prod/llm-keys \
  --secret-string '{"anthropic":"sk-ant-xxxxx","openai":"sk-xxxxx"}'
```

---

## Step 6: Deploy to Dev

```bash
# Deploy to dev environment
serverless deploy --stage dev

# Output will include:
# - API Gateway endpoint
# - Cognito User Pool ID
# - Cognito Client ID
# - DynamoDB Table name
```

---

## Step 7: Configure Custom Domain

After first deploy:

```bash
# Create custom domain mapping
serverless create_domain --stage dev
serverless create_domain --stage prod
```

### Configure DNS in Namecheap

1. Go to Namecheap → Domain List → sunnysingh.tech → Manage → Advanced DNS
2. Add CNAME records:

| Type  | Host    | Value                                                      | TTL       |
| ----- | ------- | ---------------------------------------------------------- | --------- |
| CNAME | api     | `{api-gateway-domain}.execute-api.us-east-1.amazonaws.com` | Automatic |
| CNAME | dev-api | `{api-gateway-domain}.execute-api.us-east-1.amazonaws.com` | Automatic |

Get the API Gateway domain from serverless output or AWS Console.

---

## Step 8: Create Admin User

```bash
# Get User Pool ID from deploy output
USER_POOL_ID="us-east-1_xxxxxxxx"

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username your@email.com \
  --temporary-password TempPass123! \
  --user-attributes Name=email,Value=your@email.com Name=email_verified,Value=true

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username your@email.com \
  --password YourSecurePassword123! \
  --permanent
```

---

## Step 9: Deploy to Prod

```bash
# Deploy to production
serverless deploy --stage prod
```

---

## Step 10: Update Frontend

### .env.production

```bash
VITE_API_URL=https://api.sunnysingh.tech
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Switch to API Storage

```typescript
// src/lib/storage/storage-config.ts
const isProduction = import.meta.env.PROD;
storageConfig.setStorageType(isProduction ? 'api' : 'local');
```

---

## Useful Commands

```bash
# View function logs
serverless logs -f tasks -t --stage dev

# Invoke function locally
serverless invoke local -f tasks --path test-event.json

# Remove all resources (DANGER!)
serverless remove --stage dev

# Deploy single function (faster)
serverless deploy function -f tasks --stage dev

# View deployed info
serverless info --stage prod
```

---

## Troubleshooting

### CORS Errors

Check that `allowedOrigins` in serverless.yml includes your frontend domain.

### 401 Unauthorized

1. Check JWT is being sent in Authorization header
2. Verify token is not expired
3. Check Cognito User Pool ID and Client ID match

### Lambda Timeout

Increase timeout in serverless.yml for slow functions (especially AI).

### DynamoDB Errors

Check IAM permissions include all required actions.

### Custom Domain Not Working

1. Verify certificate is validated (green checkmark in ACM)
2. Check DNS propagation: `nslookup api.sunnysingh.tech`
3. Wait up to 40 minutes for API Gateway domain to propagate

---

## Cost Estimation

| Service         | Estimated Monthly Cost        |
| --------------- | ----------------------------- |
| Lambda          | $0-5 (free tier: 1M requests) |
| API Gateway     | $0-3 (free tier: 1M requests) |
| DynamoDB        | $0-5 (on-demand, low volume)  |
| Cognito         | $0 (free tier: 50K MAU)       |
| Secrets Manager | $0.40/secret/month            |
| ACM             | Free                          |
| **Total**       | **~$5-15/month**              |

LLM API costs are separate and depend on usage.
