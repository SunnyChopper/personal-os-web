import type { ContentStatus } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

interface ContentStatusBadgeProps {
  status: ContentStatus;
  className?: string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
} as const;

function badgeLabel(status: ContentStatus): string {
  if (status === 'PUBLISHED') return 'Published';
  return 'Draft';
}

function badgeStyles(status: ContentStatus): string {
  if (status === 'PUBLISHED') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
}

export default function ContentStatusBadge({
  status,
  className,
  size = 'sm',
}: ContentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        badgeStyles(status),
        className
      )}
    >
      {badgeLabel(status)}
    </span>
  );
}
