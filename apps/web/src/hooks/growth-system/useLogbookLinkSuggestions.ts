import { useMutation } from '@tanstack/react-query';
import { logbookService } from '@/services/growth-system/logbook.service';
import type { LogbookEntityLinkSuggestions, LogbookMood } from '@/types/growth-system';

export type SuggestLogbookLinksInput = {
  notes: string;
  title?: string;
  mood?: LogbookMood;
  energy?: number;
  limit?: number;
  useCache?: boolean;
  excludeEntities?: Array<{ entityType: 'project' | 'goal'; entityId: string }>;
};

export function useLogbookLinkSuggestions() {
  const mutation = useMutation({
    mutationKey: ['growth-system', 'logbook', 'suggest-links'],
    mutationFn: async (input: SuggestLogbookLinksInput): Promise<LogbookEntityLinkSuggestions> => {
      const response = await logbookService.suggestLinks({
        notes: input.notes,
        title: input.title,
        mood: input.mood,
        energyLevel: input.energy,
        limit: input.limit ?? 3,
        useCache: input.useCache ?? true,
        excludeEntities: input.excludeEntities,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch logbook link suggestions');
      }
      return response.data;
    },
  });

  return {
    suggestLinks: mutation.mutateAsync,
    suggestions: mutation.data?.suggestions ?? [],
    isSuggesting: mutation.isPending,
    suggestError: mutation.error,
    resetSuggestions: mutation.reset,
  };
}
