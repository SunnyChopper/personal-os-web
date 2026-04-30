import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import type { NoteDraft } from '@/types/api-contracts';

/**
 * Hook to fetch draft note
 */
export function useDraftNote() {
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.draftNotes.detail(),
    queryFn: async () => {
      try {
        const result = await apiClient.getDraftNote();
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
    enabled: true,
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    draft: data?.data || null,
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
  };
}

/**
 * Hook for draft note mutations with optimistic updates
 */
export function useDraftNoteMutations() {
  const queryClient = useQueryClient();

  const saveDraftNote = useMutation({
    mutationFn: (draft: NoteDraft) => apiClient.saveDraftNote(draft),
    onMutate: async (newDraft) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.draftNotes.detail() });

      // Snapshot the previous value
      const previousDraft = queryClient.getQueryData<{ data: NoteDraft | null }>(
        queryKeys.draftNotes.detail()
      );

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.draftNotes.detail(), {
        success: true,
        data: newDraft,
      });

      // Return a context object with the snapshotted value
      return { previousDraft };
    },
    onError: (_err, _newDraft, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDraft) {
        queryClient.setQueryData(queryKeys.draftNotes.detail(), context.previousDraft);
      }
    },
  });

  const deleteDraftNote = useMutation({
    mutationFn: () => apiClient.deleteDraftNote(),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.draftNotes.detail() });

      // Snapshot the previous value
      const previousDraft = queryClient.getQueryData<{ data: NoteDraft | null }>(
        queryKeys.draftNotes.detail()
      );

      // Optimistically update to null
      queryClient.setQueryData(queryKeys.draftNotes.detail(), {
        success: true,
        data: null,
      });

      // Return a context object with the snapshotted value
      return { previousDraft };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDraft) {
        queryClient.setQueryData(queryKeys.draftNotes.detail(), context.previousDraft);
      }
    },
  });

  return {
    saveDraftNote: saveDraftNote.mutateAsync,
    deleteDraftNote: deleteDraftNote.mutateAsync,
    isSaving: saveDraftNote.isPending,
    isDeleting: deleteDraftNote.isPending,
  };
}
