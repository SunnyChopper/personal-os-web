import { RECON_ENTITY_TYPE_LABELS, type ReconEntityType } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { entityTypeBadgeClassName } from './rolodex-platform';

interface EntityTypeBadgeProps {
  entityType?: ReconEntityType | null;
  className?: string;
}

export default function EntityTypeBadge({ entityType, className }: EntityTypeBadgeProps) {
  const resolved = entityType ?? 'other';

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        entityTypeBadgeClassName(resolved),
        className
      )}
    >
      {RECON_ENTITY_TYPE_LABELS[resolved]}
    </span>
  );
}
