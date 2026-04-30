import { useQuery } from '@tanstack/react-query';
import { markdownFilesService } from '@/services/markdown-files.service';
import type { ApiError } from '@/types/api-contracts';
import { useMemo, useState, useEffect, useRef } from 'react';

export interface MarkdownBackendStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastError: ApiError | null;
  consecutiveErrorCount: number;
}

export function useMarkdownBackendStatus(): MarkdownBackendStatus & {
  checkHealth: () => Promise<void>;
} {
  const [consecutiveErrorCount, setConsecutiveErrorCount] = useState(0);
  const previousErrorRef = useRef<boolean>(false);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['markdown-backend-health'],
    queryFn: async () => {
      const result = await markdownFilesService.checkHealth();
      if (!result.success) {
        throw (
          result.error || {
            message: 'Markdown backend health check failed',
            code: 'HEALTH_CHECK_FAILED',
          }
        );
      }
      return result.data;
    },
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    refetchInterval: (query) => {
      // If offline (error exists), refetch every 30 seconds
      // If online, refetch every 5 minutes to keep status fresh
      return query.state.error ? 30000 : 300000;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider stale to allow refetching
  });

  const lastError = useMemo<ApiError | null>(() => {
    if (error) {
      // Extract ApiError from React Query error
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        return error as ApiError;
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'error' in error &&
        typeof (error as { error: unknown }).error === 'object' &&
        (error as { error: unknown }).error !== null
      ) {
        const wrappedError = (error as { error: unknown }).error;
        if (
          wrappedError !== null &&
          typeof wrappedError === 'object' &&
          'code' in wrappedError &&
          'message' in wrappedError
        ) {
          return wrappedError as ApiError;
        }
      }
      // Fallback error
      return {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN_ERROR',
      };
    }
    return null;
  }, [error]);

  const isOnline = data !== undefined && !error;
  const isChecking = isLoading || isFetching;

  // Track consecutive errors - only update when error state changes
  // Using a ref to track previous state to avoid unnecessary state updates
  useEffect(() => {
    const hasError = !!error;
    const hadError = previousErrorRef.current;

    if (hasError && !hadError) {
      // Error just occurred - increment count
      setConsecutiveErrorCount((prev) => prev + 1);
    } else if (!hasError && (hadError || consecutiveErrorCount > 0)) {
      // Error cleared or success - reset count
      setConsecutiveErrorCount(0);
    }

    previousErrorRef.current = hasError;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, data]);

  const checkHealth = async () => {
    await refetch();
  };

  return {
    isOnline,
    isChecking,
    lastError,
    consecutiveErrorCount,
    checkHealth,
  };
}
