import { Sparkles, Link as LinkIcon } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { LogbookEntityLinkSuggestion, LogbookLinkedEntity } from '@/types/growth-system';
import { isLogbookEntityLinked } from '@/lib/growth-system/logbook-linkable-entities';

interface LogbookLinkSuggestionsPanelProps {
  suggestions: LogbookEntityLinkSuggestion[];
  linkedEntities?: LogbookLinkedEntity[];
  isLoading?: boolean;
  hasRequested?: boolean;
  onToggle: (suggestion: LogbookEntityLinkSuggestion) => void;
}

function confidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)}% match`;
}

export function LogbookLinkSuggestionsPanel({
  suggestions,
  linkedEntities = [],
  isLoading = false,
  hasRequested = false,
  onToggle,
}: LogbookLinkSuggestionsPanelProps) {
  if (!isLoading && !hasRequested) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-violet-200/80 bg-violet-50/60 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
        <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
        Suggested links
      </h4>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/60"
            />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No strong matches for this note. Try the manual picker below or add more detail to your
          notes.
        </p>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
            const linked = isLogbookEntityLinked(
              linkedEntities,
              suggestion.entityType,
              suggestion.entityId
            );
            return (
              <div
                key={`${suggestion.entityType}-${suggestion.entityId}`}
                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                      {suggestion.reason}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                      {confidenceLabel(suggestion.confidence)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={linked ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onToggle(suggestion)}
                    className="shrink-0"
                  >
                    {linked ? (
                      'Linked'
                    ) : (
                      <>
                        <LinkIcon className="mr-1 h-3.5 w-3.5" />
                        Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
          Powered by AI suggestions
        </p>
      )}
    </div>
  );
}
