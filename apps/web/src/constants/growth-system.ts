import type {
  Area,
  SubCategory,
  Priority,
  TaskStatus,
  GoalStatus,
  ProjectStatus,
  TimeHorizon,
  HabitType,
  HabitFrequency,
  MetricUnit,
  MetricDirection,
  MetricSource,
  MetricStatus,
} from '@/types/growth-system';

export const AREAS: readonly Area[] = [
  'Health',
  'Wealth',
  'Love',
  'Happiness',
  'Operations',
  'Day Job',
];

export const SUBCATEGORIES_BY_AREA: Record<Area, readonly SubCategory[]> = {
  Health: ['Physical', 'Mental', 'Spiritual', 'Nutrition', 'Sleep', 'Exercise'],
  Wealth: ['Income', 'Expenses', 'Investments', 'Debt', 'Net Worth'],
  Love: ['Romantic', 'Family', 'Friends', 'Social'],
  Happiness: ['Joy', 'Gratitude', 'Purpose', 'Peace'],
  Operations: ['Productivity', 'Organization', 'Systems', 'Habits'],
  'Day Job': ['Career', 'Skills', 'Projects', 'Performance'],
};

export const PRIORITIES: readonly Priority[] = ['P1', 'P2', 'P3', 'P4'];

export const TASK_STATUSES: readonly TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Blocked',
  'On Hold',
  'Done',
  'Cancelled',
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  Blocked: 'Blocked',
  'On Hold': 'On Hold',
  Done: 'Done',
  Cancelled: 'Cancelled',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Planning: 'Planning',
  Active: 'Active',
  'On Hold': 'On Hold',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  Planning: 'Planning',
  Active: 'Active',
  'On Track': 'On Track',
  'At Risk': 'At Risk',
  Achieved: 'Achieved',
  Abandoned: 'Abandoned',
};

export const AREA_LABELS: Record<Area, string> = {
  Health: 'Health',
  Wealth: 'Wealth',
  Love: 'Love',
  Happiness: 'Happiness',
  Operations: 'Operations',
  'Day Job': 'Day Job',
};

export const SUBCATEGORY_LABELS: Record<SubCategory, string> = {
  // Health
  Physical: 'Physical',
  Mental: 'Mental',
  Spiritual: 'Spiritual',
  Nutrition: 'Nutrition',
  Sleep: 'Sleep',
  Exercise: 'Exercise',
  // Wealth
  Income: 'Income',
  Expenses: 'Expenses',
  Investments: 'Investments',
  Debt: 'Debt',
  'Net Worth': 'Net Worth',
  // Love
  Romantic: 'Romantic',
  Family: 'Family',
  Friends: 'Friends',
  Social: 'Social',
  // Happiness
  Joy: 'Joy',
  Gratitude: 'Gratitude',
  Purpose: 'Purpose',
  Peace: 'Peace',
  // Operations
  Productivity: 'Productivity',
  Organization: 'Organization',
  Systems: 'Systems',
  Habits: 'Habits',
  // Day Job
  Career: 'Career',
  Skills: 'Skills',
  Projects: 'Projects',
  Performance: 'Performance',
};

export const GOAL_TIME_HORIZONS: readonly TimeHorizon[] = [
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
  'Yearly',
];
export const GOAL_STATUSES: readonly GoalStatus[] = [
  'Planning',
  'Active',
  'On Track',
  'At Risk',
  'Achieved',
  'Abandoned',
];

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled',
];

export const HABIT_TYPES: readonly HabitType[] = ['Build', 'Maintain', 'Reduce', 'Quit'];
export const HABIT_FREQUENCIES: readonly HabitFrequency[] = [
  'Daily',
  'Weekly',
  'Monthly',
  'Custom',
];

/** Fibonacci story points for task `size` (planning poker set). */
export const TASK_STORY_POINTS_FIBONACCI: readonly number[] = [1, 2, 3, 5, 8, 13, 21];

export function isTaskStoryPointsValue(n: number): boolean {
  return TASK_STORY_POINTS_FIBONACCI.includes(n);
}

/** Snap any numeric estimate to the nearest allowed Fibonacci story point. */
export function nearestTaskStoryPoints(n: number): number {
  const values = TASK_STORY_POINTS_FIBONACCI as number[];
  return values.reduce((best, v) => (Math.abs(v - n) < Math.abs(best - n) ? v : best));
}

/** Compact label for UI (e.g. "2pts"). */
export function formatTaskStoryPointsLabel(size: number): string {
  return `${size}pts`;
}

export const METRIC_UNITS: readonly MetricUnit[] = [
  'count',
  'hours',
  'minutes',
  'dollars',
  'pounds',
  'kg',
  'percent',
  'rating',
  'custom',
];
export const METRIC_DIRECTIONS: readonly MetricDirection[] = ['Higher', 'Lower', 'Target'];
export const METRIC_SOURCES: readonly MetricSource[] = ['Manual', 'App', 'Device'];
export const METRIC_STATUSES: readonly MetricStatus[] = ['Active', 'Paused', 'Archived'];

export function getAreaColor(area: Area): string {
  const colors: Record<Area, string> = {
    Health: '#10b981',
    Wealth: '#f59e0b',
    Love: '#ec4899',
    Happiness: '#f97316',
    Operations: '#6b7280',
    'Day Job': '#3b82f6',
  };
  return colors[area];
}
