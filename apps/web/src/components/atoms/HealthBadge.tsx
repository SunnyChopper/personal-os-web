import type { GoalHealth } from '@/types/growth-system';
import { GOAL_HEALTH_LABELS } from '@/constants/growth-system';

interface HealthBadgeProps {
  health: GoalHealth;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const healthColors: Record<GoalHealth, { bg: string; text: string }> = {
  onTrack: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  atRisk: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  behind: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  stagnant: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
  },
  dormant: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-400',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function HealthBadge({ health, size = 'sm', className = '' }: HealthBadgeProps) {
  const colors = healthColors[health];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]} ${className}`}
    >
      {GOAL_HEALTH_LABELS[health]}
    </span>
  );
}
