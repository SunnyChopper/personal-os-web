/**
 * Growth System vertical slice — barrel for hooks and domain types.
 * React Query cache helpers remain in `@/lib/react-query/growth-system-cache` (large module).
 */
export {
  useGoals,
  useHabits,
  useLogbook,
  useMetrics,
  useProjects,
  useTaskDependencies,
  useTasks,
} from '@/hooks/useGrowthSystem';
export type * from '@/types/growth-system';
