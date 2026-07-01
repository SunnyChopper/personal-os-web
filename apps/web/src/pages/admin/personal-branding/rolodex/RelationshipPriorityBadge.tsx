import { RELATIONSHIP_PRIORITY_LABELS } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { priorityBadgeClassName, resolveRelationshipPriority } from './rolodex-platform';
import type { CreatorConnection } from '@/types/api/personal-branding.dto';

interface RelationshipPriorityBadgeProps {
  connection: Pick<CreatorConnection, 'relationshipPriority' | 'tier'>;
  className?: string;
}

export default function RelationshipPriorityBadge({
  connection,
  className,
}: RelationshipPriorityBadgeProps) {
  const priority = resolveRelationshipPriority(connection);
  if (!priority) {
    return <span className="text-sm text-gray-500">—</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        priorityBadgeClassName(priority),
        className
      )}
    >
      {RELATIONSHIP_PRIORITY_LABELS[priority]}
    </span>
  );
}
