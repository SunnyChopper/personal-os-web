import type { BrandPlatform, ContentStatus } from '@/types/api/personal-branding.dto';
import { contentStatusBadgeLabel } from '@/lib/personal-branding/content-node-labels';
import { cn } from '@/lib/utils';

interface ContentStatusBadgeProps {
  status: ContentStatus;
  platform?: BrandPlatform | null;
  className?: string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
} as const;

function badgeStyles(status: ContentStatus): string {
  if (status === 'PUBLISHED') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
}

export default function ContentStatusBadge({
  status,
  platform,
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
      {contentStatusBadgeLabel(status, platform)}
    </span>
  );
}
