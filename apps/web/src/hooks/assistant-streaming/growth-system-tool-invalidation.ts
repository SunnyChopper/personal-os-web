import type { QueryClient } from '@tanstack/react-query';
import type { WsToolCallCompletePayload } from '@/types/chatbot';
import { queryKeys } from '@/lib/react-query/query-keys';

/** Assistant tools that mutate Growth System tasks or dependencies (invalidate tasks + wallet caches). */
export const GROWTH_SYSTEM_TASK_MUTATION_TOOLS = new Set<string>([
  'complete_task',
  'update_task',
  'create_task',
  'delete_task',
  'add_task_dependency',
  'remove_task_dependency',
]);

/**
 * When a task-related tool succeeds, drop Growth System + wallet caches so UI cannot drift
 * after assistant-driven writes.
 */
export function invalidateGrowthSystemCachesAfterTaskTool(
  queryClient: QueryClient,
  payload: Pick<WsToolCallCompletePayload, 'toolName' | 'status'>
): void {
  if (payload.status !== 'ok') {
    return;
  }
  if (!GROWTH_SYSTEM_TASK_MUTATION_TOOLS.has(payload.toolName)) {
    return;
  }
  void queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
}
