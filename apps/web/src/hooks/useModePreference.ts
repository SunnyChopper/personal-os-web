import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { useAuth } from '@/contexts/Auth';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';

type ModePreference = 'work' | 'leisure';

/**
 * Hook to fetch mode preference
 */
export function useModePreference() {
  const { user, loading: authLoading } = useAuth();
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.modePreference.detail(),
    queryFn: async () => {
      try {
        const result = await apiClient.getModePreference();
        if (result.success) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    // Avoid calling /preferences/mode while logged out (e.g. /admin/login); that 401/refresh
    // path plus React Router login redirects caused redirect storms.
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - mode doesn't change often
  });

  const apiError = error ? extractApiError(error) : null;

  // When logged out, ignore cached preference so leisure class does not stick after sign-out.
  const mode = (user ? (data?.data ?? 'work') : 'work') as ModePreference;

  return {
    mode,
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
  };
}

/**
 * Hook for mode preference mutations with optimistic updates
 */
export function useModePreferenceMutations() {
  const queryClient = useQueryClient();

  const setModePreference = useMutation({
    mutationFn: (mode: ModePreference) => apiClient.setModePreference(mode),
    onMutate: async (newMode) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.modePreference.detail() });

      // Snapshot the previous value
      const previousMode = queryClient.getQueryData<{ data: ModePreference }>(
        queryKeys.modePreference.detail()
      );

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.modePreference.detail(), {
        success: true,
        data: newMode,
      });

      // Return a context object with the snapshotted value
      return { previousMode };
    },
    onError: (_err, _newMode, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMode) {
        queryClient.setQueryData(queryKeys.modePreference.detail(), context.previousMode);
      }
    },
  });

  return {
    setModePreference: setModePreference.mutateAsync,
    isSetting: setModePreference.isPending,
  };
}
