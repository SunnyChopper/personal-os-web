import { X } from 'lucide-react';
import type { Area } from '@/types/growth-system';

interface EntityLinkChipProps {
  id: string;
  label: string;
  type: 'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook';
  area?: Area;
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  removeAriaLabel?: string;
}

const typeColors: Record<string, { bg: string; text: string; hover: string }> = {
  task: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
  },
  project: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
  },
  goal: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
  },
  metric: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    hover: 'hover:bg-orange-200 dark:hover:bg-orange-900/50',
  },
  habit: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-400',
    hover: 'hover:bg-pink-200 dark:hover:bg-pink-900/50',
  },
  logbook: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    hover: 'hover:bg-amber-200 dark:hover:bg-amber-900/50',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
};

export function EntityLinkChip({
  id,
  label,
  type,
  onRemove,
  onClick,
  size = 'md',
  className = '',
  removeAriaLabel,
}: EntityLinkChipProps) {
  const colors = typeColors[type];

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(id);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(id);
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-colors ${colors.bg} ${colors.text} ${onClick ? `cursor-pointer ${colors.hover}` : ''} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
    >
      <span className="truncate max-w-[200px]">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          aria-label={removeAriaLabel || `Remove ${label}`}
          className="inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
