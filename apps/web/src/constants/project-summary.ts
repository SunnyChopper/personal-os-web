export type ScheduleHealthTone = 'ahead' | 'ontrack' | 'behind' | 'overdue';

export const IMPACT_LABELS: Record<number, string> = {
  1: 'Very Low Impact',
  2: 'Low Impact',
  3: 'Medium Impact',
  4: 'High Impact',
  5: 'Very High Impact',
};

export const SCHEDULE_HEALTH_STYLES: Record<
  ScheduleHealthTone,
  { label: string; className: string }
> = {
  ahead: {
    label: 'Ahead',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  ontrack: {
    label: 'On Track',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  behind: {
    label: 'Behind',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
};
