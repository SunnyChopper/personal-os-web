import { Link2, AlertCircle } from 'lucide-react';

interface DependencyBadgeProps {
  type: 'blocked' | 'blocking';
  count: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
  tooltip?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
};

export function DependencyBadge({
  type,
  count,
  onClick,
  size = 'md',
  className = '',
  tooltip,
}: DependencyBadgeProps) {
  if (count === 0) return null;

  const isBlocked = type === 'blocked';
  const bgColor = isBlocked ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
  const textColor = isBlocked
    ? 'text-red-700 dark:text-red-400'
    : 'text-blue-700 dark:text-blue-400';
  const hoverColor = onClick
    ? isBlocked
      ? 'hover:bg-red-200 dark:hover:bg-red-900/50'
      : 'hover:bg-blue-200 dark:hover:bg-blue-900/50'
    : '';

  const Icon = isBlocked ? AlertCircle : Link2;
  const label = isBlocked ? `Blocked by ${count}` : `Blocking ${count}`;

  return (
    <div className="relative group inline-block">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`inline-flex items-center rounded-full font-medium transition-colors ${bgColor} ${textColor} ${hoverColor} ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
        title={tooltip}
      >
        <Icon className={iconSizes[size]} />
        <span>{label}</span>
      </button>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-pre-line max-w-xs">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
}
