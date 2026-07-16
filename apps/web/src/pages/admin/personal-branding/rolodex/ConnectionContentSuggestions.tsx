import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useCollapsibleList } from '@/hooks/useCollapsibleList';
import type { ContentOpportunity } from '@/types/api/personal-branding.dto';
import SuggestedContentCard from './SuggestedContentCard';
import { cn } from '@/lib/utils';

interface ConnectionContentSuggestionsProps {
  opportunities: ContentOpportunity[];
  onDraftReply: (opportunity: ContentOpportunity) => void;
  onLogCheckIn: (opportunity: ContentOpportunity) => void;
  onComplete: (opportunity: ContentOpportunity) => void;
  onRequestDismiss: (opportunity: ContentOpportunity) => void;
  completingOpportunityId?: string | null;
  dismissingOpportunityId?: string | null;
}

export default function ConnectionContentSuggestions({
  opportunities,
  onDraftReply,
  onLogCheckIn,
  onComplete,
  onRequestDismiss,
  completingOpportunityId = null,
  dismissingOpportunityId = null,
}: ConnectionContentSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { visibleItems, hiddenCount, hasCollapsibleList, isExpanded, toggle } = useCollapsibleList(
    opportunities,
    3
  );

  if (opportunities.length === 0) return null;

  const summary =
    opportunities.length === 1 ? '1 suggestion' : `${opportunities.length} suggestions`;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs font-medium',
          'text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40'
        )}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
        )}
        <span>Saved content suggestions</span>
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
          {summary}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-2 space-y-2">
          {visibleItems.map((opportunity) => (
            <SuggestedContentCard
              key={opportunity.id}
              opportunity={opportunity}
              onDraftReply={onDraftReply}
              onLogCheckIn={onLogCheckIn}
              onComplete={onComplete}
              onRequestDismiss={onRequestDismiss}
              isCompleting={completingOpportunityId === opportunity.id}
              isDismissing={dismissingOpportunityId === opportunity.id}
              compact
            />
          ))}
          {hasCollapsibleList ? (
            <Button type="button" size="sm" variant="ghost" onClick={toggle}>
              {isExpanded ? 'Show fewer' : `Show ${hiddenCount} more`}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
