import { useState } from 'react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import type { ProactiveSuggestion } from '@/types/api-contracts';
import { summarizeProactiveSuggestionPayload } from '@/components/proactive/proactive-suggestion-summary';

export interface UpdateSuggestionFeedbackDialogProps {
  isOpen: boolean;
  suggestion: ProactiveSuggestion | null;
  onClose: () => void;
  onSave: (feedback: string) => void;
  isSubmitting: boolean;
}

function effectivePayloadRecord(s: ProactiveSuggestion): Record<string, unknown> {
  const r = s.resolvedPayload;
  if (r && typeof r === 'object' && !Array.isArray(r)) return r as Record<string, unknown>;
  const p = s.proposedPayload;
  if (p && typeof p === 'object' && !Array.isArray(p)) return p as Record<string, unknown>;
  return {};
}

function UpdateSuggestionFeedbackDialogBody({
  suggestion,
  onClose,
  onSave,
  isSubmitting,
}: {
  suggestion: ProactiveSuggestion;
  onClose: () => void;
  onSave: (feedback: string) => void;
  isSubmitting: boolean;
}) {
  const [feedback, setFeedback] = useState(() => suggestion.resolutionFeedback?.trim() ?? '');
  const payload = effectivePayloadRecord(suggestion);
  const summary = summarizeProactiveSuggestionPayload(payload);

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Notes here are included when brainstorming new suggestions. Leave empty and save to clear
        stored feedback.
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/40 px-3 py-2 mb-4 text-sm">
        <p className="font-medium text-gray-900 dark:text-white">{summary.title}</p>
        <p className="text-xs text-gray-500 mt-1">{summary.kindLabel}</p>
      </div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        Feedback
      </label>
      <textarea
        className="w-full border rounded-lg px-2 py-2 text-sm min-h-[100px] bg-white dark:bg-gray-900 dark:border-gray-600 mb-4"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="What should future runs avoid or lean into?"
        disabled={isSubmitting}
        maxLength={2000}
      />
      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-lg"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="rounded-lg"
          disabled={isSubmitting}
          onClick={() => onSave(feedback)}
        >
          {isSubmitting ? 'Saving…' : 'Save feedback'}
        </Button>
      </div>
    </>
  );
}

export default function UpdateSuggestionFeedbackDialog({
  isOpen,
  suggestion,
  onClose,
  onSave,
  isSubmitting,
}: UpdateSuggestionFeedbackDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Suggestion feedback" size="md">
      {isOpen && suggestion ? (
        <UpdateSuggestionFeedbackDialogBody
          key={suggestion.id + (suggestion.updatedAt ?? '')}
          suggestion={suggestion}
          onClose={onClose}
          onSave={onSave}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </Dialog>
  );
}
