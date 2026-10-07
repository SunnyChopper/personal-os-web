import { statusPillClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';
import {
  DEFAULT_MAX_VISIBLE_TAGS,
  splitVisibleTags,
} from '@/components/molecules/personal-branding/ContentIdeaTagChips';

interface ContentIdeaGroundedPillarsProps {
  matchedPillars: string[];
  maxVisible?: number;
  className?: string;
}

export function ContentIdeaGroundedPillars({
  matchedPillars,
  maxVisible = DEFAULT_MAX_VISIBLE_TAGS,
  className,
}: ContentIdeaGroundedPillarsProps) {
  if (matchedPillars.length === 0) return null;

  const { visible, hidden } = splitVisibleTags(matchedPillars, maxVisible);
  const hiddenLabel = hidden.join(', ');

  return (
    <div
      className={cn('mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs', className)}
      aria-label={
        hidden.length > 0
          ? `Grounded in ${matchedPillars.join(', ')}`
          : `Grounded in ${visible.join(', ')}`
      }
    >
      <span className="shrink-0 text-gray-500 dark:text-gray-400">Grounded in</span>
      {visible.map((pillar) => (
        <span key={pillar} className={statusPillClassName('neutral')}>
          {pillar}
        </span>
      ))}
      {hidden.length > 0 ? (
        <span
          className={statusPillClassName('neutral')}
          title={hiddenLabel}
          aria-label={`${hidden.length} more pillars: ${hiddenLabel}`}
        >
          +{hidden.length}
        </span>
      ) : null}
    </div>
  );
}

export default ContentIdeaGroundedPillars;
