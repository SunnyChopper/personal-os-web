import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { ambientPresenceService } from '@/services/assistant/ambient-presence.service';
import type {
  AmbientActionId,
  AmbientEntityRef,
  AmbientSurface,
  AmbientWhisperItem,
} from '@/types/chatbot';
import { useToast } from '@/hooks/use-toast';

const STALE_MS = 60_000;

export function useAmbientPresence(surface: AmbientSurface) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.chatbot.ambient(surface);

  // Abort in-flight ambient GETs on leave so Axios 30s timeouts do not alert (8b25dbe8c269).
  useEffect(() => {
    return () => {
      void queryClient.cancelQueries({ queryKey });
    };
  }, [queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => ambientPresenceService.getAmbient(surface, signal),
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useAmbientPresenceMutations(surface: AmbientSurface) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = queryKeys.chatbot.ambient(surface);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey });
  };

  const dismissMutation = useMutation({
    mutationFn: (item: AmbientWhisperItem) =>
      ambientPresenceService.dismiss({
        surface,
        whisperId: item.id,
        ledgerEntryId: item.ledgerEntryId,
      }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<import('@/types/chatbot').AmbientPresenceData>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          items: previous.items.filter((row) => row.id !== item.id),
        });
      }
      return { previous };
    },
    onError: (error, _item, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      const message = error instanceof Error ? error.message : 'Could not dismiss whisper';
      showToast({ type: 'error', title: 'Dismiss failed', message });
    },
    onSettled: invalidate,
  });

  const actionMutation = useMutation({
    mutationFn: (input: {
      item: AmbientWhisperItem;
      actionId: AmbientActionId;
      entityRef?: AmbientEntityRef;
    }) =>
      ambientPresenceService.executeAction({
        surface,
        whisperId: input.item.id,
        actionId: input.actionId,
        entityRef: input.entityRef ?? input.item.entityRef,
      }),
    onSuccess: invalidate,
  });

  return { dismissMutation, actionMutation, invalidate };
}
