import Button from '@/components/atoms/Button';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import {
  pbBodySecondaryClassName,
  pbDenseListStackClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type { VariantImprovementSuggestion } from '@/types/api/personal-branding.dto';

export interface VariantImprovementSuggestionsPanelProps {
  suggestions: VariantImprovementSuggestion[];
  isApplying: boolean;
  applyingSuggestionId: string | null;
  onApply: (suggestion: VariantImprovementSuggestion) => void;
  onDismiss: () => void;
}

export function VariantImprovementSuggestionsPanel({
  suggestions,
  isApplying,
  applyingSuggestionId,
  onApply,
  onDismiss,
}: VariantImprovementSuggestionsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <InsetPanel className="mt-4 space-y-3" tone="neutral">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EyebrowLabel className="text-sky-800 dark:text-sky-300">
          Suggested improvements
        </EyebrowLabel>
        <Button type="button" size="sm" variant="secondary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
      <ul className={pbDenseListStackClassName}>
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-white/70 p-2 dark:bg-gray-950/40"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {suggestion.label}
              </p>
              <p className={pbBodySecondaryClassName}>{suggestion.rationale}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isApplying}
              onClick={() => onApply(suggestion)}
            >
              {isApplying && applyingSuggestionId === suggestion.id ? 'Applying…' : 'Apply'}
            </Button>
          </li>
        ))}
      </ul>
    </InsetPanel>
  );
}
