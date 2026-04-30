import { Calendar, AlertTriangle } from 'lucide-react';

interface DateDisplayProps {
  date: string | null;
  label?: string;
  showIcon?: boolean;
  showWarning?: boolean;
  variant?: 'inline' | 'block';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

function isUpcoming(dateString: string, days: number = 3): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function DateDisplay({
  date,
  label,
  showIcon = true,
  showWarning = true,
  variant = 'inline',
  size = 'md',
  className = '',
}: DateDisplayProps) {
  if (!date) {
    return (
      <span className={`text-gray-400 dark:text-gray-600 ${sizeClasses[size]} ${className}`}>
        No date set
      </span>
    );
  }

  const overdue = isOverdue(date);
  const upcoming = !overdue && isUpcoming(date);
  const formattedDate = formatDate(date);

  const colorClass = overdue
    ? 'text-red-600 dark:text-red-400'
    : upcoming
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-gray-600 dark:text-gray-400';

  if (variant === 'block') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <span className={`font-medium text-gray-700 dark:text-gray-300 ${sizeClasses[size]}`}>
            {label}
          </span>
        )}
        <div className={`flex items-center gap-1.5 ${colorClass} ${sizeClasses[size]}`}>
          {showIcon && <Calendar className={iconSizes[size]} />}
          <span>{formattedDate}</span>
          {showWarning && overdue && <AlertTriangle className={iconSizes[size]} />}
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${colorClass} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Calendar className={iconSizes[size]} />}
      {label && <span className="font-medium">{label}:</span>}
      <span>{formattedDate}</span>
      {showWarning && overdue && <AlertTriangle className={iconSizes[size]} />}
    </span>
  );
}
