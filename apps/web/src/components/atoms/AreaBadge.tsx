import type { Area } from '@/types/growth-system';
import { AREA_LABELS } from '@/constants/growth-system';

interface AreaBadgeProps {
  area: Area;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const areaColors: Record<Area, { bg: string; text: string }> = {
  Health: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  Wealth: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  Love: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
  Happiness: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  Operations: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400' },
  'Day Job': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const defaultColors = {
  bg: 'bg-gray-100 dark:bg-gray-900/30',
  text: 'text-gray-700 dark:text-gray-400',
};

export function AreaBadge({ area, size = 'md', className = '' }: AreaBadgeProps) {
  const colors = areaColors[area] || defaultColors;
  const label = AREA_LABELS[area] || area;

  if (!areaColors[area]) {
    console.warn(`AreaBadge: Unknown area "${area}". Using default colors.`);
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]} ${className}`}
    >
      {label}
    </span>
  );
}
