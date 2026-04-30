import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import { fetchPlainGetHealth, fetchPlainHealthMarkdown } from '@/lib/public-health-fetch';

/**
 * Hook to check general backend health
 */
export function useBackendHealth(options?: { refetchInterval?: number }) {
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: queryKeys.backendHealth.detail(),
    queryFn: async () => {
      const tryTasksFallback = async () => {
        try {
          const fallbackResponse = await apiClient.get('/tasks?limit=1');
          if (fallbackResponse.success) {
            recordSuccess();
            return { isOnline: true };
          } else {
            const apiError: { message: string; code: string } = fallbackResponse.error || {
              message: 'Connection check failed',
              code: 'CONNECTION_CHECK_FAILED',
            };
            recordError(apiError);
            return { isOnline: false, error: apiError };
          }
        } catch {
          const apiError: { message: string; code: string } = {
            message: 'Unable to reach backend server',
            code: 'NETWORK_ERROR',
          };
          recordError(apiError);
          return { isOnline: false, error: apiError };
        }
      };

      try {
        // Plain fetch avoids axios default Content-Type and auth → fewer CORS preflights
        const plain = await fetchPlainGetHealth();
        if (plain.ok) {
          recordSuccess();
          return { isOnline: true };
        }
        // Non-2xx: mirror axios (would throw) → same tasks fallback
        return tryTasksFallback();
      } catch {
        return tryTasksFallback();
      }
    },
    enabled: true,
    refetchInterval: options?.refetchInterval || false,
    retry: false, // Don't retry health checks automatically
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  const mergedError =
    apiError ??
    error ??
    (data && typeof data === 'object' && 'error' in data
      ? (data as { isOnline: boolean; error?: { message: string; code: string } }).error
      : undefined);

  return {
    isOnline: data?.isOnline ?? false,
    isLoading,
    isError,
    error: mergedError,
    isNetworkError: isNetworkErr,
    refetch,
  };
}

/**
 * Hook to check markdown backend health (specific endpoint)
 */
export function useMarkdownBackendHealth() {
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.backendHealth.markdown(),
    queryFn: async () => {
      try {
        const response = await fetchPlainHealthMarkdown();
        if (response.success && response.data) {
          recordSuccess();
          return { isOnline: true, status: response.data.status };
        } else {
          const apiError = response.error || {
            message: 'Markdown backend health check failed',
            code: 'MARKDOWN_HEALTH_CHECK_FAILED',
          };
          recordError(apiError);
          return { isOnline: false, error: apiError };
        }
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        return { isOnline: false, error: apiError || err };
      }
    },
    enabled: true,
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  return {
    isOnline: data?.isOnline ?? false,
    status: data?.status,
    isLoading,
    isError,
    error: apiError || error || data?.error,
    isNetworkError: isNetworkErr,
  };
}
