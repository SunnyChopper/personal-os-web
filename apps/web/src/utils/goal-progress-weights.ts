import type { GoalProgressConfig } from '@/types/growth-system';

export const DEFAULT_GOAL_PROGRESS_WEIGHTS: GoalProgressConfig = {
  criteriaWeight: 35,
  tasksWeight: 35,
  metricsWeight: 10,
  habitsWeight: 20,
  manualOverride: null,
};
