import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Textarea } from '@/components/atoms/Textarea';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';

export interface RejectWithFeedbackModalProps {
  isOpen: boolean;
  title?: string;
  promptText?: string;
  subjectLabel?: string;
  /** @deprecated Prefer subjectLabel */
  ideaTitle?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (feedbackText: string | null) => void;
}

export default function RejectWithFeedbackModal({
  isOpen,
  title = 'Reject idea',
  promptText,
  subjectLabel,
  ideaTitle,
  submitLabel = 'Reject idea',
  isSubmitting = false,
  onClose,
  onSubmit,
}: RejectWithFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const resolvedSubjectLabel = subjectLabel ?? ideaTitle;

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = feedback.trim();
    onSubmit(trimmed || null);
  };

  const defaultPrompt =
    resolvedSubjectLabel != null && resolvedSubjectLabel !== '' ? (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Tell the system why{' '}
        <span className="font-medium text-gray-900 dark:text-white">{resolvedSubjectLabel}</span>{' '}
        does not work so future runs can improve.
      </p>
    ) : null;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4 p-1">
        {promptText ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{promptText}</p>
        ) : (
          defaultPrompt
        )}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Feedback <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder='e.g. "Too generic" or "Out of my technical depth"'
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
