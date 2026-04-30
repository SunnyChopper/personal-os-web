import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { AuthContext, type User } from './types';
import { authService, AUTH_STORAGE_CLEARED_EVENT } from '@/lib/auth/auth.service';
import { apiClient } from '@/lib/api-client';
import { authLogger } from '@/lib/logger';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onStorageCleared = () => {
      setUser(null);
      apiClient.setAuthToken(null);
    };
    window.addEventListener(AUTH_STORAGE_CLEARED_EVENT, onStorageCleared);
    return () => window.removeEventListener(AUTH_STORAGE_CLEARED_EVENT, onStorageCleared);
  }, []);

  useEffect(() => {
    authLogger.debug('AuthProvider mounted, checking user');
    // Clear any invalid stored users (with UUID emails) before checking
    authService.clearInvalidStoredUser();
    checkUser();

    // Set up periodic token validation and proactive refresh
    // Check every minute to see if tokens need refreshing
    refreshIntervalRef.current = setInterval(async () => {
      const tokens = authService.getStoredTokens();
      if (!tokens?.accessToken) {
        return;
      }

      // Check if token is expired
      if (authService.areStoredTokensExpired()) {
        authLogger.info('Periodic auth check found expired token');
        try {
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success && refreshResponse.data) {
            authLogger.info('Periodic token refresh successful');
            apiClient.setAuthToken(refreshResponse.data.accessToken);
          } else {
            authLogger.warn('Periodic token refresh failed');
            authService.clearTokensOnly();
            apiClient.setAuthToken(null);
            setUser(null);
          }
        } catch (err) {
          authLogger.warn('Periodic token refresh threw', err);
          authService.clearTokensOnly();
          apiClient.setAuthToken(null);
          setUser(null);
        }
        return;
      }

      // Check if token should be refreshed proactively (within 5 minutes of expiration)
      if (authService.shouldRefreshTokenProactively(300)) {
        const timeUntilExpiration = authService.getTimeUntilExpiration(tokens.accessToken);
        authLogger.info('Token nearing expiry, refreshing proactively', {
          timeUntilExpiration,
        });
        try {
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success && refreshResponse.data) {
            authLogger.info('Proactive token refresh successful');
            apiClient.setAuthToken(refreshResponse.data.accessToken);
          } else {
            authLogger.warn('Proactive token refresh failed');
          }
        } catch (err) {
          authLogger.warn('Proactive token refresh threw', err);
        }
      }
    }, 60000); // Check every 60 seconds

    return () => {
      authLogger.debug('AuthProvider unmounting, clearing token check interval');
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTokenRefresh = async (): Promise<boolean> => {
    authLogger.info('checkUser found expired tokens, attempting refresh');
    try {
      const refreshResponse = await authService.refreshToken();
      if (refreshResponse.success && refreshResponse.data) {
        authLogger.info('checkUser token refresh successful');
        apiClient.setAuthToken(refreshResponse.data.accessToken);
        return true;
      }
      authLogger.warn('checkUser token refresh failed, clearing auth state');
      authService.clearTokensOnly();
      apiClient.setAuthToken(null);
      setUser(null);
      return false;
    } catch (refreshError) {
      authLogger.warn('checkUser token refresh threw, clearing auth state', refreshError);
      authService.clearTokensOnly();
      apiClient.setAuthToken(null);
      setUser(null);
      return false;
    }
  };

  const handleGetCurrentUser = async (): Promise<void> => {
    try {
      const response = await authService.getCurrentUser();
      authLogger.debug('checkUser getCurrentUser response', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });
      if (response.success && response.data) {
        authLogger.info('checkUser loaded current user', { email: response.data.email });
        setUser(response.data);
      } else {
        authLogger.warn('checkUser failed to fetch current user, clearing auth state');
        authService.clearTokensOnly();
        apiClient.setAuthToken(null);
        setUser(null);
      }
    } catch (err) {
      authLogger.warn('checkUser threw while fetching current user, clearing auth state', err);
      authService.clearTokensOnly();
      apiClient.setAuthToken(null);
      setUser(null);
    }
  };

  const checkUser = async () => {
    // Prevent multiple simultaneous checks
    if (isChecking) {
      authLogger.debug('checkUser skipped because a check is already running');
      return;
    }

    authLogger.debug('checkUser started');
    try {
      setIsChecking(true);
      setLoading(true);

      // Check if we have stored tokens
      const tokens = authService.getStoredTokens();
      authLogger.debug('checkUser token lookup complete', {
        hasAccessToken: !!tokens?.accessToken,
      });

      if (tokens?.accessToken) {
        // Check if tokens are expired and attempt refresh if needed
        const tokensExpired = authService.areStoredTokensExpired();
        authLogger.debug('checkUser token expiry evaluated', { tokensExpired });

        if (tokensExpired) {
          const refreshSuccess = await handleTokenRefresh();
          if (!refreshSuccess) {
            return;
          }
        } else {
          // Tokens are still valid, set them in API client
          authLogger.debug('checkUser using existing token', {
            tokenLength: tokens.accessToken.length,
            tokenPreview: `${tokens.accessToken.substring(0, 20)}...`,
          });
          apiClient.setAuthToken(tokens.accessToken);
        }

        authLogger.debug('checkUser calling getCurrentUser after setting token');
        await handleGetCurrentUser();
      } else {
        // No tokens, clear user
        authLogger.debug('checkUser found no tokens, clearing user');
        setUser(null);
      }
    } catch (err) {
      authLogger.error('checkUser failed', err);
      setUser(null);
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  };

  const handleSignIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      authLogger.info('Calling authService.signIn');
      const response = await authService.signIn({ email, password });

      authLogger.debug('Sign-in response received', {
        success: response.success,
        hasData: !!response.data,
        hasError: !!response.error,
        errorMessage: response.error?.message,
      });

      if (response.success && response.data) {
        authLogger.info('Sign-in successful', { email: response.data.user.email });
        setUser(response.data.user);
        // Ensure token is set in API client
        if (response.data.tokens?.accessToken) {
          authLogger.debug('Setting API client token after sign-in', {
            tokenLength: response.data.tokens.accessToken.length,
            tokenPreview: `${response.data.tokens.accessToken.substring(0, 20)}...`,
          });
          apiClient.setAuthToken(response.data.tokens.accessToken);
        } else {
          authLogger.error('No access token in sign-in response', response.data);
        }
      } else {
        const errorMessage = response.error?.message || 'Failed to sign in';
        authLogger.error('Sign-in failed', { errorMessage });
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      authLogger.error('Sign-in threw', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.signUp({ email, password });

      if (response.success && response.data) {
        // After signup, automatically sign in
        await handleSignIn(email, password);
      } else {
        const errorMessage = response.error?.message || 'Failed to sign up';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      setLoading(true);

      await authService.signOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
  };

  // Log state changes
  useEffect(() => {
    authLogger.debug('AuthProvider state changed', {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      error,
    });
  }, [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
