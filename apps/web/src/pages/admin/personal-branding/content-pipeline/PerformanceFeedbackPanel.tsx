import Button from '@/components/atoms/Button';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import { cn } from '@/lib/utils';
import {
  pbBodySecondaryClassName,
  pbDenseListStackClassName,
  pbMetaClassName,
} from '../personal-branding-ui';
import type { ContentVariant, PerformanceSuggestion } from '@/types/api/personal-branding.dto';
import { useVariantPerformanceInsights } from './useVariantPerformanceInsights';

interface PerformanceFeedbackPanelProps {
  variant: ContentVariant;
}

function isActionableSuggestion(suggestion: PerformanceSuggestion): boolean {
  return (
    suggestion.type === 'promote_tone_metrics' ||
    suggestion.type === 'promote_platform_rhetoric' ||
    suggestion.type === 'outperformed_baseline'
  );
}

function applyLabel(suggestion: PerformanceSuggestion): string {
  if (suggestion.type === 'promote_tone_metrics') return 'Apply tone metrics';
  if (suggestion.type === 'promote_platform_rhetoric') return 'Apply platform rules';
  return 'Acknowledge';
}

export function PerformanceFeedbackPanel({ variant }: PerformanceFeedbackPanelProps) {
  const showPanel = variant.distributionStatus === 'DEPLOYED' && variant.status !== 'rejected';
  const { insightsQ, applyMutation } = useVariantPerformanceInsights(
    showPanel ? variant.id : null,
    showPanel
  );

  if (!showPanel) return null;

  if (insightsQ.isPending) {
    return <p className={cn('mt-3', pbMetaClassName)}>Loading performance insights…</p>;
  }

  if (insightsQ.isError) {
    return null;
  }

  const insights = insightsQ.data;
  if (!insights || insights.suggestions.length === 0) {
    return null;
  }

  const pendingSuggestions = insights.suggestions.filter((s) => !s.applied);
  if (pendingSuggestions.length === 0) {
    return null;
  }

  return (
    <InsetPanel className="mt-4 space-y-3" tone="emerald">
      <EyebrowLabel className="text-emerald-800 dark:text-emerald-300">
        Performance feedback
      </EyebrowLabel>
      <ul className={pbDenseListStackClassName}>
        {pendingSuggestions.map((suggestion) => (
          <li
            key={suggestion.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-white/70 p-2 dark:bg-gray-950/40"
          >
            <p className={pbBodySecondaryClassName}>{suggestion.summary}</p>
            {isActionableSuggestion(suggestion) ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={applyMutation.isPending}
                onClick={() => applyMutation.mutate(suggestion.id)}
              >
                {applyMutation.isPending && applyMutation.variables === suggestion.id
                  ? 'Applying…'
                  : applyLabel(suggestion)}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </InsetPanel>
  );
}
