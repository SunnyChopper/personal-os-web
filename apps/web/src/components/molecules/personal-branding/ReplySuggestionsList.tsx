import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import type { ReplySuggestion } from '@/types/api/personal-branding.dto';

export interface ReplySuggestionsListProps {
  suggestions: ReplySuggestion[];
  isUpdating?: boolean;
  onAccept: (suggestion: ReplySuggestion) => void;
  onReject: (suggestion: ReplySuggestion, feedbackText: string | null) => void;
}

export default function ReplySuggestionsList({
  suggestions,
  isUpdating = false,
  onAccept,
  onReject,
}: ReplySuggestionsListProps) {
  const [rejecting, setRejecting] = useState<ReplySuggestion | null>(null);

  if (!suggestions.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Suggestions</h3>
      {suggestions.map((suggestion) => (
        <article
          key={suggestion.id}
          className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900/40"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.label}</h4>
            <span className="text-xs text-blue-600 dark:text-blue-400">{suggestion.angle}</span>
          </div>
          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {suggestion.draftText}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{suggestion.rationale}</p>
          {suggestion.status === 'SUGGESTED' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isUpdating}
                className="inline-flex items-center gap-1"
                onClick={() => onAccept(suggestion)}
              >
                <Check className="size-4" />
                Accept & copy
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isUpdating}
                className="inline-flex items-center gap-1"
                onClick={() => setRejecting(suggestion)}
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
              {suggestion.status}
            </p>
          )}
        </article>
      ))}

      <RejectWithFeedbackModal
        isOpen={Boolean(rejecting)}
        title="Reject suggestion"
        submitLabel="Reject"
        promptText="What should improve in future reply drafts?"
        isSubmitting={isUpdating}
        onClose={() => setRejecting(null)}
        onSubmit={(feedbackText) => {
          if (!rejecting) return;
          onReject(rejecting, feedbackText);
          setRejecting(null);
        }}
      />
    </div>
  );
}
