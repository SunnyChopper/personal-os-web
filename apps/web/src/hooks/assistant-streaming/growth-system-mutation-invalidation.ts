import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';

/** Invalidate ambient Assistant rail after Growth System task/project mutations from the UI. */
export function invalidateRelevantNowAfterGrowthTaskMutation(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.chatbot.relevantNow() });
}
