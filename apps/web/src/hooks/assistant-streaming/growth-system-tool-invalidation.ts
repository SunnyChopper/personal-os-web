import type { QueryClient } from '@tanstack/react-query';
import type { WsToolCallCompletePayload } from '@/types/chatbot';
import type { Goal } from '@/types/growth-system';
import { removeGoalCache, upsertGoalCache } from '@/lib/react-query/growth-system-cache';
import { queryKeys } from '@/lib/react-query/query-keys';

/** Assistant tools that mutate Growth System tasks or dependencies. */
export const GROWTH_SYSTEM_TASK_MUTATION_TOOLS = new Set<string>([
  'complete_task',
  'update_task',
  'create_task',
  'delete_task',
  'add_task_dependency',
  'remove_task_dependency',
]);

/** Assistant tools that mutate Growth System goals. */
export const GROWTH_SYSTEM_GOAL_MUTATION_TOOLS = new Set<string>([
  'create_goal',
  'update_goal',
  'delete_goal',
]);

type MutationToolPayload = Pick<
  WsToolCallCompletePayload,
  'toolName' | 'status' | 'arguments' | 'result'
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function goalIdFromArguments(arguments_: Record<string, unknown> | undefined): string | undefined {
  const raw = arguments_?.goalId;
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

function goalFromToolResult(result: unknown): Goal | undefined {
  if (!isRecord(result)) {
    return undefined;
  }
  const id = result.id;
  const title = result.title;
  if (typeof id !== 'string' || typeof title !== 'string') {
    return undefined;
  }
  return result as unknown as Goal;
}

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

/**
 * When a goal-related tool succeeds, update goal caches immediately and invalidate list/dashboard
 * queries so Area/Board views and pickers cannot show deleted goals.
 */
export function invalidateGrowthSystemCachesAfterGoalTool(
  queryClient: QueryClient,
  payload: MutationToolPayload
): void {
  if (payload.status !== 'ok') {
    return;
  }
  if (!GROWTH_SYSTEM_GOAL_MUTATION_TOOLS.has(payload.toolName)) {
    return;
  }

  if (payload.toolName === 'delete_goal') {
    const goalId = goalIdFromArguments(payload.arguments);
    if (goalId) {
      removeGoalCache(queryClient, goalId);
    }
  } else {
    const goal = goalFromToolResult(payload.result);
    if (goal) {
      upsertGoalCache(queryClient, goal);
    }
  }

  void queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.goals.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
}

/** Apply task + goal Growth System cache updates after a successful assistant tool. */
export function invalidateGrowthSystemCachesAfterMutationTool(
  queryClient: QueryClient,
  payload: MutationToolPayload
): void {
  invalidateGrowthSystemCachesAfterTaskTool(queryClient, payload);
  invalidateGrowthSystemCachesAfterGoalTool(queryClient, payload);
}
