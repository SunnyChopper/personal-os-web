import { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/types/api-contracts';
import { BackendStatusContext, type BackendStatus, type BackendStatusContextValue } from './types';
import { apiClient } from '@/lib/api-client';
import { fetchPlainGetHealth } from '@/lib/public-health-fetch';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError } from '@/lib/react-query/error-utils';

interface BackendStatusProviderProps {
  children: ReactNode;
}

export function BackendStatusProvider({ children }: BackendStatusProviderProps) {
  // Implement health check directly in provider to avoid circular dependency
  // This cannot use useBackendHealth because that hook depends on useBackendStatus
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.backendHealth.detail(),
    queryFn: async () => {
      const tryTasksFallback = async () => {
        try {
          const fallbackResponse = await apiClient.get('/tasks?limit=1');
          if (fallbackResponse.success) {
            return { isOnline: true };
          } else {
            const apiError: ApiError = fallbackResponse.error || {
              message: 'Connection check failed',
              code: 'CONNECTION_CHECK_FAILED',
            };
            return { isOnline: false, error: apiError };
          }
        } catch {
          const apiError: ApiError = {
            message: 'Unable to reach backend server',
            code: 'NETWORK_ERROR',
          };
          return { isOnline: false, error: apiError };
        }
      };

      try {
        const plain = await fetchPlainGetHealth();
        if (plain.ok) {
          return { isOnline: true };
        }
        return tryTasksFallback();
      } catch {
        return tryTasksFallback();
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false, // Don't retry health checks automatically
    // Note: refetchInterval will be set dynamically via queryClient.setQueryData
    // For now, we'll let components trigger manual refetches when needed
  });

  const isOnline = data?.isOnline ?? false;
  const apiError = error ? extractApiError(error) : null;
  const queryPayloadError =
    data && typeof data === 'object' && 'error' in data
      ? (data as { isOnline: boolean; error?: ApiError }).error
      : undefined;
  const healthError = queryPayloadError || apiError;

  // Track error count separately since it accumulates
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<ApiError | null>(null);

  // Sync React Query state with local status state
  // This is a valid use case: syncing external state (React Query) with local state
  useEffect(() => {
    if (healthError) {
      setLastError(healthError as ApiError);
      setErrorCount((prev) => prev + 1);
    } else if (isOnline) {
      setLastError(null);
      setErrorCount(0);
    } else {
      // Keep last error but don't increment count if we're just offline
      // Only increment on new errors
    }
  }, [isOnline, healthError]);

  // Derive status from query state and local error tracking
  const status: BackendStatus = {
    isOnline,
    isChecking: isLoading,
    lastError,
    errorCount,
  };

  const recordError = useCallback((error: ApiError) => {
    setLastError(error);
    setErrorCount((prev) => prev + 1);
  }, []);

  const recordSuccess = useCallback(() => {
    setLastError(null);
    setErrorCount(0);
  }, []);

  const resetErrorCount = useCallback(() => {
    setErrorCount(0);
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const result = await refetch();
    return result.data?.isOnline ?? false;
  }, [refetch]);

  const value: BackendStatusContextValue = {
    status,
    checkConnection,
    resetErrorCount,
    recordError,
    recordSuccess,
  };

  return <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>;
}
