import { useState } from 'react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import type { ProactiveSuggestion } from '@/types/api-contracts';
import { summarizeProactiveSuggestionPayload } from '@/components/proactive/proactive-suggestion-summary';

export interface RejectSuggestionDialogProps {
  isOpen: boolean;
  suggestion: ProactiveSuggestion | null;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  isSubmitting: boolean;
}

function effectivePayloadRecord(s: ProactiveSuggestion): Record<string, unknown> {
  const r = s.resolvedPayload;
  if (r && typeof r === 'object' && !Array.isArray(r)) return r as Record<string, unknown>;
  const p = s.proposedPayload;
  if (p && typeof p === 'object' && !Array.isArray(p)) return p as Record<string, unknown>;
  return {};
}

function RejectSuggestionDialogBody({
  suggestion,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  suggestion: ProactiveSuggestion;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  isSubmitting: boolean;
}) {
  const [feedback, setFeedback] = useState('');
  const payload = effectivePayloadRecord(suggestion);
  const summary = summarizeProactiveSuggestionPayload(payload);

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Optional feedback helps future <strong>Generate from my data</strong> runs avoid similar
        ideas.
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/40 px-3 py-2 mb-4 text-sm">
        <p className="font-medium text-gray-900 dark:text-white">{summary.title}</p>
        <p className="text-xs text-gray-500 mt-1">{summary.kindLabel}</p>
      </div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        Feedback (optional)
      </label>
      <textarea
        className="w-full border rounded-lg px-2 py-2 text-sm min-h-[100px] bg-white dark:bg-gray-900 dark:border-gray-600 mb-4"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="e.g. Wrong time of day, too frequent, or not the kind of check-in I want…"
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
          onClick={() => onConfirm(feedback.trim())}
        >
          {isSubmitting ? 'Rejecting…' : 'Reject suggestion'}
        </Button>
      </div>
    </>
  );
}

export default function RejectSuggestionDialog({
  isOpen,
  suggestion,
  onClose,
  onConfirm,
  isSubmitting,
}: RejectSuggestionDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Reject this suggestion?" size="md">
      {isOpen && suggestion ? (
        <RejectSuggestionDialogBody
          key={suggestion.id}
          suggestion={suggestion}
          onClose={onClose}
          onConfirm={onConfirm}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </Dialog>
  );
}
