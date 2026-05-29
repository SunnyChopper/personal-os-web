import { Sparkles, Link as LinkIcon, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { GoalLinkSuggestion } from '@/types/growth-system';

type LinkEntityType = GoalLinkSuggestion['entityType'];

interface GoalLinkSuggestionsPanelProps {
  entityType: LinkEntityType;
  suggestions: GoalLinkSuggestion[];
  isLoading?: boolean;
  attachingId?: string | null;
  onAttach: (suggestion: GoalLinkSuggestion) => void;
}

const ENTITY_LABELS: Record<LinkEntityType, string> = {
  task: 'task',
  habit: 'habit',
  metric: 'metric',
  project: 'project',
};

function confidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)}% match`;
}

export function GoalLinkSuggestionsPanel({
  entityType,
  suggestions,
  isLoading = false,
  attachingId = null,
  onAttach,
}: GoalLinkSuggestionsPanelProps) {
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        Suggested {ENTITY_LABELS[entityType]}s to link
      </h4>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-16 rounded-lg bg-gray-100 dark:bg-gray-700/60 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
            const isAttaching = attachingId === suggestion.entityId;
            return (
              <div
                key={suggestion.entityId}
                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {suggestion.reason}
                    </p>
                    <span className="inline-flex mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                      {confidenceLabel(suggestion.confidence)}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAttach(suggestion)}
                    disabled={Boolean(attachingId)}
                    className="shrink-0"
                  >
                    {isAttaching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LinkIcon className="w-3.5 h-3.5 mr-1" />
                        Attach
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">Powered by AI suggestions</p>
    </div>
  );
}
