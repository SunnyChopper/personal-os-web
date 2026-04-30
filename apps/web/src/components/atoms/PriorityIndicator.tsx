import type { Priority } from '@/types/growth-system';

interface PriorityIndicatorProps {
  priority: Priority | null | undefined;
  variant?: 'dot' | 'badge' | 'bar';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  P1: { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-400', border: 'border-red-500' },
  P2: {
    bg: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500',
  },
  P3: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-500',
  },
  P4: {
    bg: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-500',
  },
};

// Default priority fallback
const DEFAULT_PRIORITY: Priority = 'P3';

export function PriorityIndicator({
  priority,
  variant = 'badge',
  size = 'md',
  className = '',
}: PriorityIndicatorProps) {
  // Normalize priority: use default if invalid or missing
  const normalizedPriority: Priority =
    priority && priority in priorityColors ? priority : DEFAULT_PRIORITY;
  const colors = priorityColors[normalizedPriority];

  if (variant === 'dot') {
    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
    };
    return (
      <span className={`inline-block rounded-full ${colors.bg} ${dotSizes[size]} ${className}`} />
    );
  }

  if (variant === 'bar') {
    const barSizes = {
      sm: 'w-1 h-4',
      md: 'w-1 h-6',
      lg: 'w-1.5 h-8',
    };
    return (
      <span className={`inline-block rounded-full ${colors.bg} ${barSizes[size]} ${className}`} />
    );
  }

  const badgeSizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-sm',
    lg: 'px-2.5 py-1 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded font-semibold ${colors.text} border ${colors.border} bg-opacity-10 ${badgeSizes[size]} ${className}`}
    >
      {normalizedPriority}
    </span>
  );
}
