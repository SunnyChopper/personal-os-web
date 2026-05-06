import {
  signIn,
  signUp,
  signOut,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import type { SignUpOutput, AuthSession } from 'aws-amplify/auth';
import { apiClient } from '@/lib/api-client';
import { authLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api-contracts';
import { isCognitoConfigured } from './cognito-config';

// Extended AuthTokens type that includes refreshToken for Cognito
interface CognitoAuthTokens {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface ConfirmPasswordResetInput {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

const PASSWORD_RESET_SENT_MESSAGE =
  'If an account exists for this email, you will receive a code shortly.';

const COGNITO_NOT_CONFIGURED_MESSAGE =
  'Cognito is not configured. Please check your environment variables.';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // Optional - Amplify v6 manages refresh tokens internally
  expiresIn: number;
}

export type AppRole = 'owner' | 'spouse';

export interface HouseholdPermissions {
  canEditHouseholdLogistics?: boolean;
  canUseHouseholdDropzone?: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role?: AppRole;
  householdId?: string | null;
  ownerUserId?: string | null;
  householdMemberIds?: string[];
  permissions?: HouseholdPermissions;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /auth/me data envelope (camelCase). */
interface AuthMeProfile {
  id: string;
  email: string;
  displayName?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  role: AppRole;
  householdId?: string | null;
  ownerUserId?: string | null;
  householdMemberIds?: string[] | null;
  permissions?: HouseholdPermissions;
}

function mapAuthMeToUser(p: AuthMeProfile): User {
  return {
    id: p.id,
    email: p.email,
    displayName: p.displayName,
    role: p.role,
    householdId: p.householdId ?? undefined,
    ownerUserId: p.ownerUserId ?? undefined,
    householdMemberIds: p.householdMemberIds ?? undefined,
    permissions: p.permissions,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * Decode JWT token to extract user information
 */
function decodeJWT(token: string): { sub: string; email: string; [key: string]: unknown } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    authLogger.error('Error decoding JWT', error);
    return null;
  }
}

const TOKEN_STORAGE_KEY = 'gs_auth_tokens';
const USER_STORAGE_KEY = 'gs_auth_user';

/**
 * Store tokens securely in localStorage
 * In production, consider using httpOnly cookies or secure storage
 */
function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Retrieve stored tokens
 */
function getStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/** Dispatched when local auth tokens + stored user are cleared (see AuthProvider listener). */
export const AUTH_STORAGE_CLEARED_EVENT = 'personal-os:auth-storage-cleared';

function notifyAuthStorageCleared(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_STORAGE_CLEARED_EVENT));
  }
}

/**
 * Clear stored tokens
 */
function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  notifyAuthStorageCleared();
}

/**
 * Store user information
 */
function storeUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Retrieve stored user
 */
function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Extract email from ID token, access token, or fallback to credentials
 */
function extractEmailFromTokens(
  idToken: string | undefined,
  accessToken: string,
  fallbackEmail: string
): string {
  // Try ID token first (typically contains email)
  if (idToken) {
    const decodedIdToken = decodeJWT(idToken);
    if (decodedIdToken?.email) {
      return decodedIdToken.email;
    }
  }

  // Try access token (usually doesn't have email)
  const decodedAccessToken = decodeJWT(accessToken);
  if (decodedAccessToken?.email) {
    return decodedAccessToken.email;
  }

  // Fallback to credentials email
  return fallbackEmail;
}

/**
 * Process tokens from Cognito session and create user/auth response
 */
function processSignInTokens(
  session: AuthSession,
  credentials: LoginCredentials
): { user: User; tokens: AuthTokens } | null {
  if (!session.tokens?.accessToken) {
    return null;
  }

  const accessToken = session.tokens.accessToken.toString();
  const cognitoTokens = session.tokens as unknown as CognitoAuthTokens;
  const refreshToken = cognitoTokens.refreshToken;
  const idToken = cognitoTokens.idToken;

  // Get existing refresh token from storage if not available in session
  const existingTokens = getStoredTokens();
  const storedRefreshToken = refreshToken || existingTokens?.refreshToken;

  // Decode access token to get user ID
  const decodedAccessToken = decodeJWT(accessToken);
  if (!decodedAccessToken) {
    return null;
  }

  // Extract email from tokens
  const email = extractEmailFromTokens(idToken, accessToken, credentials.email);

  // Get expiration time from token
  const exp = typeof decodedAccessToken.exp === 'number' ? decodedAccessToken.exp : null;
  const expiresIn = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 3600;

  const tokens: AuthTokens = {
    accessToken,
    refreshToken: storedRefreshToken,
    expiresIn,
  };

  const user: User = {
    id: decodedAccessToken.sub,
    email,
    displayName: decodedAccessToken.name as string | undefined,
  };

  return { user, tokens };
}

/**
 * Check if email is valid (not a UUID/sub ID)
 */
function isValidEmail(email: string | undefined): boolean {
  if (!email || !email.includes('@')) {
    return false;
  }

  // UUIDs typically have the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(email);
  return !isUUID;
}

/**
 * Check if a token is expired
 */
function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) {
    return true;
  }

  const decodedToken = decodeJWT(token);
  if (!decodedToken) {
    return true;
  }

  const exp = decodedToken.exp;
  if (!exp || typeof exp !== 'number') {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return exp < currentTime;
}

/**
 * Check if stored tokens are expired
 */
function areStoredTokensExpired(): boolean {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    return true;
  }

  return isTokenExpired(tokens.accessToken);
}

/**
 * Get time until token expiration in seconds
 * Returns null if token is invalid or already expired
 */
function getTimeUntilExpiration(token: string | null | undefined): number | null {
  if (!token) {
    return null;
  }

  const decodedToken = decodeJWT(token);
  if (!decodedToken) {
    return null;
  }

  const exp = decodedToken.exp;
  if (!exp || typeof exp !== 'number') {
    return null;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiration = exp - currentTime;

  return timeUntilExpiration > 0 ? timeUntilExpiration : null;
}

/**
 * Check if token should be refreshed proactively
 * Refreshes if token expires within the specified buffer time (default: 5 minutes)
 */
function shouldRefreshTokenProactively(bufferSeconds: number = 300): boolean {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    return false;
  }

  const timeUntilExpiration = getTimeUntilExpiration(tokens.accessToken);
  if (timeUntilExpiration === null) {
    // Token is expired or invalid, should refresh
    return true;
  }

  // Refresh if token expires within the buffer time
  return timeUntilExpiration <= bufferSeconds;
}

/**
 * Validate if stored user is still valid (token not expired, email is valid)
 */
function validateStoredUser(storedUser: User): boolean {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    return false;
  }

  if (isTokenExpired(tokens.accessToken)) {
    return false;
  }

  // Check if stored user has a valid email (not a UUID/sub ID)
  if (!isValidEmail(storedUser.email)) {
    // Clear invalid stored user
    authLogger.warn('Stored user has invalid email (UUID), clearing it');
    localStorage.removeItem(USER_STORAGE_KEY);
    return false;
  }

  return true;
}

/**
 * Internal function to refresh tokens and store them
 * This is used by both refreshToken method and getCurrentUser
 */
async function performTokenRefresh(): Promise<{ success: boolean; accessToken?: string }> {
  if (!isCognitoConfigured()) {
    return { success: false };
  }

  try {
    // Force refresh to get new tokens
    const session: AuthSession = await fetchAuthSession({ forceRefresh: true });

    if (!session.tokens?.accessToken) {
      clearTokens();
      apiClient.setAuthToken(null);
      return { success: false };
    }

    const accessToken = session.tokens.accessToken.toString();
    const cognitoTokens = session.tokens as unknown as CognitoAuthTokens;
    const refreshToken = cognitoTokens.refreshToken;

    // Get existing refresh token from storage if not available in session
    const existingTokens = getStoredTokens();
    const storedRefreshToken = refreshToken || existingTokens?.refreshToken;

    // Decode JWT to get expiration time
    const decodedToken = decodeJWT(accessToken);
    const exp = decodedToken?.exp;
    const expiresIn =
      exp && typeof exp === 'number' ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 3600;

    const newTokens: AuthTokens = {
      accessToken,
      refreshToken: storedRefreshToken,
      expiresIn,
    };

    storeTokens(newTokens);
    apiClient.setAuthToken(accessToken);

    return { success: true, accessToken };
  } catch {
    clearTokens();
    apiClient.setAuthToken(null);
    return { success: false };
  }
}

/**
 * Fetch user from Cognito session and extract user information
 * @param forceRefresh - Whether to force refresh the auth session (use when tokens are expired)
 */
async function fetchUserFromCognito(forceRefresh: boolean = false): Promise<User | null> {
  // Use AWS Amplify's getCurrentUser (imported as amplifyGetCurrentUser to avoid naming conflict)
  const cognitoUser = await amplifyGetCurrentUser();
  const session: AuthSession = await fetchAuthSession({ forceRefresh });

  if (!session.tokens?.accessToken) {
    return null;
  }

  const accessToken = session.tokens.accessToken.toString();
  const decodedAccessToken = decodeJWT(accessToken);

  if (!decodedAccessToken) {
    return null;
  }

  // Try to get email from ID token (which typically contains email)
  const cognitoTokens = session.tokens as unknown as CognitoAuthTokens;
  const idToken = cognitoTokens.idToken;
  const fallbackEmail = cognitoUser.username;

  let email = extractEmailFromTokens(idToken, accessToken, fallbackEmail);

  // If token/username gave a UUID (Cognito sub), fetch email from user attributes
  if (!isValidEmail(email)) {
    try {
      const attributes = await fetchUserAttributes();
      const attrEmail = attributes?.email;
      if (isValidEmail(attrEmail) && attrEmail) {
        email = attrEmail;
      }
    } catch {
      // Keep existing email (UUID) if fetch fails; UI can hide or mask it
    }
  }

  return {
    id: decodedAccessToken.sub,
    email,
    displayName: decodedAccessToken.name as string | undefined,
  };
}

/**
 * Handle Cognito sign-in errors and return user-friendly messages
 */
function handleSignInError(error: unknown): { code: string; message: string } {
  if (!(error instanceof Error)) {
    return {
      code: 'SIGNIN_FAILED',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  const errorName = error.name || '';
  const errorMsg = error.message || '';

  authLogger.warn('Sign-in error details', {
    name: errorName,
    message: errorMsg,
    stack: error.stack,
  });

  // Check for common Cognito error patterns
  if (
    errorName.includes('NotAuthorizedException') ||
    errorMsg.includes('Incorrect username or password') ||
    errorMsg.includes('not authorized') ||
    errorMsg.toLowerCase().includes('authentication failed')
  ) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please check your credentials and try again.',
    };
  }

  if (
    errorName.includes('UserNotConfirmedException') ||
    errorMsg.includes('not confirmed') ||
    errorMsg.includes('User is not confirmed')
  ) {
    return {
      code: 'USER_NOT_CONFIRMED',
      message:
        'Your email address has not been verified. Please check your inbox for a verification email.',
    };
  }

  if (
    errorName.includes('UserNotFoundException') ||
    errorMsg.includes('does not exist') ||
    errorMsg.includes('User does not exist')
  ) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'No account found with this email address.',
    };
  }

  if (
    errorName.includes('TooManyRequestsException') ||
    errorMsg.includes('too many requests') ||
    errorMsg.includes('Attempt limit exceeded')
  ) {
    return {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please wait a few minutes and try again.',
    };
  }

  if (errorName.includes('InvalidParameterException') || errorMsg.includes('Invalid parameter')) {
    return {
      code: 'INVALID_PARAMETER',
      message: 'Invalid email or password format. Please check your input.',
    };
  }

  if (
    errorMsg.includes('already a signed in user') ||
    errorMsg.includes('already signed in') ||
    errorMsg.includes('User is already signed in')
  ) {
    return {
      code: 'ALREADY_SIGNED_IN',
      message: 'You are already signed in. Redirecting to dashboard...',
    };
  }

  // Default error
  return {
    code: 'SIGNIN_FAILED',
    message: errorMsg || 'Failed to sign in. Please check your credentials.',
  };
}

function normalizeEmailForAuthCompare(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Amplify can retain a Cognito session while app state / local token storage is empty
 * (e.g. cleared storage, new tab). signIn() then throws UserAlreadyAuthenticatedException.
 */
function isAmplifyAlreadySignedInError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const name = error.name || '';
  const msg = (error.message || '').toLowerCase();
  if (name.includes('UserAlreadyAuthenticated')) {
    return true;
  }
  return (
    msg.includes('already a signed in user') ||
    msg.includes('already signed in') ||
    msg.includes('user is already signed in')
  );
}

/**
 * When Amplify already has a session, either sync tokens (same account) or sign out and
 * perform a fresh password sign-in (different account or unreadable session).
 */
async function reconcileAmplifySessionWithFormEmail(credentials: LoginCredentials): Promise<void> {
  const requested = normalizeEmailForAuthCompare(credentials.email);
  let resolvedEmail: string | undefined;

  try {
    const cognitoUser = await amplifyGetCurrentUser();
    try {
      const attrs = await fetchUserAttributes();
      if (attrs?.email && isValidEmail(attrs.email)) {
        resolvedEmail = attrs.email;
      }
    } catch {
      // Prefer username if attributes are unavailable
    }
    if (!resolvedEmail) {
      resolvedEmail = cognitoUser.username ?? '';
    }
  } catch (err) {
    authLogger.warn(
      'Could not inspect Cognito user during already-signed-in reconcile; signing out',
      err
    );
    await signOut();
    await signIn({
      username: credentials.email,
      password: credentials.password,
    });
    return;
  }

  if (normalizeEmailForAuthCompare(resolvedEmail ?? '') !== requested) {
    authLogger.info('Clearing Cognito session for a different account before password sign-in');
    await signOut();
    await signIn({
      username: credentials.email,
      password: credentials.password,
    });
    return;
  }

  authLogger.info(
    'Existing Cognito session matches requested account; syncing app state from session'
  );
}

async function attemptCognitoPasswordSignIn(credentials: LoginCredentials): Promise<void> {
  try {
    await signIn({
      username: credentials.email,
      password: credentials.password,
    });
  } catch (error) {
    if (!isAmplifyAlreadySignedInError(error)) {
      throw error;
    }
    authLogger.info('Cognito password sign-in skipped: session already present; reconciling', {
      email: credentials.email,
    });
    await reconcileAmplifySessionWithFormEmail(credentials);
  }
}

function handlePasswordResetRequestError(error: unknown): { code: string; message: string } {
  if (!(error instanceof Error)) {
    return {
      code: 'PASSWORD_RESET_FAILED',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  const errorName = error.name || '';
  const errorMsg = error.message || '';

  if (
    errorName.includes('TooManyRequestsException') ||
    errorName.includes('LimitExceededException') ||
    errorMsg.includes('too many requests') ||
    errorMsg.includes('Attempt limit exceeded')
  ) {
    return {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many reset attempts. Please wait a few minutes and try again.',
    };
  }

  if (errorName.includes('InvalidParameterException') || errorMsg.includes('Invalid parameter')) {
    return {
      code: 'INVALID_PARAMETER',
      message: 'Invalid email format. Please enter a valid email address.',
    };
  }

  if (
    errorName.includes('InvalidEmailRoleAccessPolicyException') ||
    errorName.includes('NotAuthorizedException')
  ) {
    return {
      code: 'PASSWORD_RESET_CONFIG',
      message: 'Password reset is temporarily unavailable. Please try again later.',
    };
  }

  return {
    code: 'PASSWORD_RESET_FAILED',
    message: errorMsg || 'Could not send reset code. Please try again.',
  };
}

function handlePasswordResetConfirmError(error: unknown): { code: string; message: string } {
  if (!(error instanceof Error)) {
    return {
      code: 'PASSWORD_RESET_CONFIRM_FAILED',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  const errorName = error.name || '';
  const errorMsg = error.message || '';

  if (
    errorName.includes('CodeMismatchException') ||
    errorMsg.includes('Invalid verification code')
  ) {
    return {
      code: 'INVALID_CODE',
      message: 'That code is invalid. Check the email and try again.',
    };
  }

  if (
    errorName.includes('ExpiredCodeException') ||
    errorMsg.includes('expired') ||
    errorMsg.includes('Expired')
  ) {
    return {
      code: 'EXPIRED_CODE',
      message: 'This code has expired. Request a new code from the sign-in page.',
    };
  }

  if (
    errorName.includes('InvalidPasswordException') ||
    errorMsg.includes('Password did not conform')
  ) {
    return {
      code: 'INVALID_PASSWORD',
      message:
        'Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, and numbers.',
    };
  }

  if (
    errorName.includes('TooManyRequestsException') ||
    errorName.includes('LimitExceededException') ||
    errorMsg.includes('too many requests') ||
    errorMsg.includes('Attempt limit exceeded')
  ) {
    return {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please wait a few minutes and try again.',
    };
  }

  if (errorName.includes('InvalidParameterException') || errorMsg.includes('Invalid parameter')) {
    return {
      code: 'INVALID_PARAMETER',
      message: 'Invalid code or password format. Please check your input.',
    };
  }

  return {
    code: 'PASSWORD_RESET_CONFIRM_FAILED',
    message: errorMsg || 'Could not reset password. Please try again.',
  };
}

export const authService = {
  /**
   * Sign up a new user with AWS Cognito
   */
  async signUp(
    credentials: SignUpCredentials
  ): Promise<ApiResponse<{ userId: string; email: string; message: string }>> {
    if (!isCognitoConfigured()) {
      return {
        success: false,
        error: {
          code: 'COGNITO_NOT_CONFIGURED',
          message: COGNITO_NOT_CONFIGURED_MESSAGE,
        },
      };
    }

    try {
      const result: SignUpOutput = await signUp({
        username: credentials.email,
        password: credentials.password,
        options: {
          userAttributes: {
            email: credentials.email,
          },
        },
      });

      // Cognito returns userId in the result
      return {
        success: true,
        data: {
          userId: result.userId || 'unknown',
          email: credentials.email,
          message: result.isSignUpComplete
            ? 'Account created successfully'
            : 'Account created. Please verify your email.',
        },
      };
    } catch (error) {
      // Handle Cognito-specific errors with user-friendly messages
      let errorMessage = 'Failed to sign up';
      let errorCode = 'SIGNUP_FAILED';

      if (error instanceof Error) {
        const errorName = error.name || '';
        const errorMsg = error.message || '';

        // Check for common Cognito error patterns
        if (
          errorName.includes('UsernameExistsException') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('An account with the given email already exists')
        ) {
          errorMessage =
            'An account with this email address already exists. Please sign in instead.';
          errorCode = 'USER_ALREADY_EXISTS';
        } else if (
          errorName.includes('InvalidPasswordException') ||
          errorMsg.includes('Password did not conform')
        ) {
          errorMessage =
            'Password does not meet requirements. Please use at least 8 characters with uppercase, lowercase, and numbers.';
          errorCode = 'INVALID_PASSWORD';
        } else if (
          errorName.includes('InvalidParameterException') ||
          errorMsg.includes('Invalid parameter')
        ) {
          errorMessage = 'Invalid email format. Please enter a valid email address.';
          errorCode = 'INVALID_PARAMETER';
        } else if (
          errorName.includes('TooManyRequestsException') ||
          errorMsg.includes('too many requests')
        ) {
          errorMessage = 'Too many sign-up attempts. Please wait a few minutes and try again.';
          errorCode = 'TOO_MANY_REQUESTS';
        } else {
          // Use the original error message for other errors
          errorMessage = errorMsg || 'Failed to sign up';
        }
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      };
    }
  },

  /**
   * Sign in with email and password using AWS Cognito
   */
  async signIn(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    if (!isCognitoConfigured()) {
      return {
        success: false,
        error: {
          code: 'COGNITO_NOT_CONFIGURED',
          message: COGNITO_NOT_CONFIGURED_MESSAGE,
        },
      };
    }

    try {
      authLogger.info('Attempting Cognito sign-in', { email: credentials.email });
      await attemptCognitoPasswordSignIn(credentials);

      // Fetch the auth session to get tokens
      authLogger.debug('Fetching auth session after sign-in');
      const session: AuthSession = await fetchAuthSession({ forceRefresh: false });
      authLogger.debug('Fetched auth session', {
        hasTokens: !!session.tokens,
        hasAccessToken: !!session.tokens?.accessToken,
      });

      // Process tokens and create user/auth response
      const result = processSignInTokens(session, credentials);
      if (!result) {
        return {
          success: false,
          error: {
            code: 'TOKEN_PROCESSING_FAILED',
            message: 'Failed to process authentication tokens',
          },
        };
      }

      const { user, tokens } = result;

      storeTokens(tokens);
      apiClient.setAuthToken(tokens.accessToken);

      let sessionUser = user;
      try {
        const meResponse = await apiClient.get<AuthMeProfile>('/auth/me');
        if (meResponse.success && meResponse.data) {
          sessionUser = mapAuthMeToUser(meResponse.data);
        }
      } catch (hydrateErr) {
        authLogger.warn('Failed to hydrate user from /auth/me after sign-in', hydrateErr);
      }
      storeUser(sessionUser);

      return {
        success: true,
        data: {
          user: sessionUser,
          tokens,
        },
      };
    } catch (error) {
      authLogger.error('Sign-in failed', error);
      const { code, message } = handleSignInError(error);

      return {
        success: false,
        error: {
          code,
          message,
        },
      };
    }
  },

  /**
   * Request a Cognito password reset code (email delivery).
   * Uses a generic success message on success and on UserNotFound to limit email enumeration.
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    if (!isCognitoConfigured()) {
      return {
        success: false,
        error: {
          code: 'COGNITO_NOT_CONFIGURED',
          message: COGNITO_NOT_CONFIGURED_MESSAGE,
        },
      };
    }

    try {
      await resetPassword({ username: email.trim() });
      return {
        success: true,
        data: { message: PASSWORD_RESET_SENT_MESSAGE },
      };
    } catch (error) {
      if (error instanceof Error && error.name.includes('UserNotFoundException')) {
        return {
          success: true,
          data: { message: PASSWORD_RESET_SENT_MESSAGE },
        };
      }
      const { code, message } = handlePasswordResetRequestError(error);
      return {
        success: false,
        error: { code, message },
      };
    }
  },

  /**
   * Complete password reset with code from email and new password.
   */
  async confirmPasswordReset(
    input: ConfirmPasswordResetInput
  ): Promise<ApiResponse<{ message: string }>> {
    if (!isCognitoConfigured()) {
      return {
        success: false,
        error: {
          code: 'COGNITO_NOT_CONFIGURED',
          message: COGNITO_NOT_CONFIGURED_MESSAGE,
        },
      };
    }

    try {
      await confirmResetPassword({
        username: input.email.trim(),
        confirmationCode: input.confirmationCode.trim(),
        newPassword: input.newPassword,
      });
      return {
        success: true,
        data: {
          message: 'Your password was reset. You can sign in with your new password.',
        },
      };
    } catch (error) {
      const { code, message } = handlePasswordResetConfirmError(error);
      return {
        success: false,
        error: { code, message },
      };
    }
  },

  /**
   * Sign out the current user from AWS Cognito
   */
  async signOut(): Promise<ApiResponse<void>> {
    try {
      // Sign out from Cognito
      await signOut();
    } catch (error) {
      authLogger.warn('Cognito sign out failed', error);
      // Continue with local cleanup even if Cognito sign out fails
    }

    // Clear local storage
    clearTokens();
    apiClient.setAuthToken(null);

    return { success: true, data: undefined };
  },

  /**
   * Refresh the access token using AWS Cognito
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    if (!isCognitoConfigured()) {
      return {
        success: false,
        error: {
          code: 'COGNITO_NOT_CONFIGURED',
          message: COGNITO_NOT_CONFIGURED_MESSAGE,
        },
      };
    }

    const refreshResult = await performTokenRefresh();

    if (!refreshResult.success || !refreshResult.accessToken) {
      return {
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Failed to refresh access token',
        },
      };
    }

    // Get the stored tokens (which were just updated by performTokenRefresh)
    const tokens = getStoredTokens();
    if (!tokens) {
      return {
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Failed to retrieve refreshed tokens',
        },
      };
    }

    return { success: true, data: tokens };
  },

  /**
   * Get current user: prefer GET /auth/me (role + household), then Cognito fallback.
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (!isCognitoConfigured()) {
      return {
        success: false,
        error: {
          code: 'COGNITO_NOT_CONFIGURED',
          message: COGNITO_NOT_CONFIGURED_MESSAGE,
        },
      };
    }

    try {
      const tokens = getStoredTokens();
      if (!tokens?.accessToken) {
        return {
          success: false,
          error: { code: 'NO_ACCESS_TOKEN', message: 'No access token available' },
        };
      }

      const tokensExpired = areStoredTokensExpired();
      if (tokensExpired) {
        authLogger.info('Stored tokens expired, attempting refresh');
        const refreshResult = await performTokenRefresh();
        if (!refreshResult.success) {
          return {
            success: false,
            error: {
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Failed to refresh expired tokens',
            },
          };
        }
      }

      const latest = getStoredTokens();
      if (!latest?.accessToken) {
        return {
          success: false,
          error: { code: 'NO_ACCESS_TOKEN', message: 'No access token available' },
        };
      }

      apiClient.setAuthToken(latest.accessToken);
      const meResponse = await apiClient.get<AuthMeProfile>('/auth/me');
      if (meResponse.success && meResponse.data) {
        const u = mapAuthMeToUser(meResponse.data);
        storeUser(u);
        return { success: true, data: u };
      }

      authLogger.warn('GET /auth/me failed, falling back to Cognito attributes', meResponse.error);

      const user = await fetchUserFromCognito(tokensExpired);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'NO_ACCESS_TOKEN',
            message: 'No access token available',
          },
        };
      }

      storeUser(user);
      return { success: true, data: user };
    } catch (error) {
      const storedUser = getStoredUser();
      if (storedUser && validateStoredUser(storedUser)) {
        authLogger.warn('getCurrentUser threw, using stored user fallback', error);
        return { success: true, data: storedUser };
      }

      if (storedUser && !isValidEmail(storedUser.email)) {
        authLogger.warn('Stored user has invalid email, clearing it');
        localStorage.removeItem(USER_STORAGE_KEY);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
      return {
        success: false,
        error: {
          code: 'GET_USER_FAILED',
          message: errorMessage,
        },
      };
    }
  },

  /**
   * Get stored tokens
   */
  getStoredTokens,

  /**
   * Get stored user
   */
  getStoredUser,

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    const tokens = getStoredTokens();
    return !!tokens?.accessToken;
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    const tokens = getStoredTokens();
    return tokens?.accessToken || null;
  },

  /**
   * Access token suitable for WebSocket URL auth (refreshes when expired or near expiry).
   */
  async getValidAccessToken(): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    if (this.areStoredTokensExpired() || this.shouldRefreshTokenProactively()) {
      const result = await this.refreshToken();
      if (!result.success) {
        return null;
      }
    }
    return this.getAccessToken();
  },

  /**
   * Clear tokens without making an API call
   * Use this when you need to clear auth state without calling the backend
   */
  clearTokensOnly(): void {
    clearTokens();
  },

  /**
   * Clear stored user if it has an invalid email (UUID)
   * This forces a fresh fetch from Cognito on next getCurrentUser call
   */
  clearInvalidStoredUser(): void {
    const storedUser = getStoredUser();
    if (storedUser && !isValidEmail(storedUser.email)) {
      authLogger.warn('Clearing stored user with invalid email', { email: storedUser.email });
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  /**
   * Check if stored tokens are expired
   */
  areStoredTokensExpired,

  /**
   * Get time until token expiration in seconds
   */
  getTimeUntilExpiration,

  /**
   * Check if token should be refreshed proactively
   */
  shouldRefreshTokenProactively,
};
