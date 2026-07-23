import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import type { RadarItem } from '@/types/api/personal-branding.dto';

const RELEVANCE_BLURB =
  'Relevance is the model’s estimate of brand fit for this trend item — informed by your brand pillars, source context, and filtering instructions. It is not a guarantee of quality or reach.';

function formatRelevancePercent(value?: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
}

export interface RadarItemRelevanceModalProps {
  isOpen: boolean;
  item: RadarItem | null;
  isExplaining: boolean;
  onClose: () => void;
  onExplain: () => void;
}

export default function RadarItemRelevanceModal({
  isOpen,
  item,
  isExplaining,
  onClose,
  onExplain,
}: RadarItemRelevanceModalProps) {
  if (!item) return null;

  const rationale = item.aiRationale?.trim();
  const hasScore = typeof item.aiRelevanceScore === 'number';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Relevance breakdown" size="lg">
      <div className="space-y-5 p-1">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {hasScore
              ? `${formatRelevancePercent(item.aiRelevanceScore)} relevant`
              : 'No score yet'}
          </p>
          {item.sourceName ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.sourceName}</p>
          ) : null}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">{RELEVANCE_BLURB}</p>

        {rationale ? (
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">Reasoning</h4>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{rationale}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No relevance reasoning is saved for this card yet. Run an on-demand explanation to
              generate a score and rationale.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              disabled={isExplaining}
              onClick={onExplain}
            >
              {isExplaining ? 'Explaining…' : 'Explain with AI'}
            </Button>
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
