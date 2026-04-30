/**
 * Get color classes for a habit type
 * Returns consistent colors for borders, backgrounds, and progress bars
 */
export function getHabitTypeColors(habitType: string) {
  switch (habitType) {
    case 'Build':
      return {
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50/50 dark:bg-green-900/10',
        bgSolid: 'bg-green-100 dark:bg-green-900/30',
        progressBg: 'bg-green-100/50 dark:bg-green-900/20',
        progressFill: 'bg-green-500 dark:bg-green-600',
        text: 'text-green-700 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      };
    case 'Maintain':
      return {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50/50 dark:bg-blue-900/10',
        bgSolid: 'bg-blue-100 dark:bg-blue-900/30',
        progressBg: 'bg-blue-100/50 dark:bg-blue-900/20',
        progressFill: 'bg-blue-500 dark:bg-blue-600',
        text: 'text-blue-700 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };
    case 'Reduce':
      return {
        border: 'border-yellow-200 dark:border-yellow-800',
        bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
        bgSolid: 'bg-yellow-100 dark:bg-yellow-900/30',
        progressBg: 'bg-yellow-100/50 dark:bg-yellow-900/20',
        progressFill: 'bg-yellow-500 dark:bg-yellow-600',
        text: 'text-yellow-700 dark:text-yellow-400',
        badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      };
    case 'Quit':
      return {
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50/50 dark:bg-red-900/10',
        bgSolid: 'bg-red-100 dark:bg-red-900/30',
        progressBg: 'bg-red-100/50 dark:bg-red-900/20',
        progressFill: 'bg-red-500 dark:bg-red-600',
        text: 'text-red-700 dark:text-red-400',
        badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      };
    default:
      return {
        border: 'border-gray-200 dark:border-gray-700',
        bg: '',
        bgSolid: 'bg-gray-100 dark:bg-gray-700',
        progressBg: 'bg-gray-100 dark:bg-gray-800',
        progressFill: 'bg-gray-500 dark:bg-gray-600',
        text: 'text-gray-700 dark:text-gray-300',
        badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      };
  }
}
