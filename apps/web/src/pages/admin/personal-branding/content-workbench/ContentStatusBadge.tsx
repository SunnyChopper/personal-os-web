import type { BrandPlatform, ContentStatus } from '@/types/api/personal-branding.dto';
import { contentStatusBadgeLabel } from '@/lib/personal-branding/content-node-labels';
import { cn } from '@/lib/utils';
import {
  contentStatusPillTone,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';

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

export default function ContentStatusBadge({
  status,
  platform,
  className,
  size = 'sm',
}: ContentStatusBadgeProps) {
  return (
    <span
      className={cn(
        statusPillClassName(contentStatusPillTone(status), sizeClasses[size]),
        className
      )}
    >
      {contentStatusBadgeLabel(status, platform)}
    </span>
  );
}
