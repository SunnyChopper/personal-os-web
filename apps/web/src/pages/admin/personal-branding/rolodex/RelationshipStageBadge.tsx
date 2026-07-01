import {
  RELATIONSHIP_STAGE_LABELS,
  type RelationshipStage,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { stageBadgeClassName } from './rolodex-platform';

interface RelationshipStageBadgeProps {
  stage?: RelationshipStage | null;
  className?: string;
}

export default function RelationshipStageBadge({ stage, className }: RelationshipStageBadgeProps) {
  if (!stage) {
    return <span className="text-sm text-gray-500">—</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        stageBadgeClassName(stage),
        className
      )}
    >
      {RELATIONSHIP_STAGE_LABELS[stage]}
    </span>
  );
}
