import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Textarea } from '@/components/atoms/Textarea';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

const FEEDBACK_MAX_LENGTH = 2000;

export interface FeedbackCategoryOption {
  id: string;
  label: string;
}

export interface RejectWithFeedbackModalProps {
  isOpen: boolean;
  title?: string;
  promptText?: string;
  subjectLabel?: string;
  /** @deprecated Prefer subjectLabel */
  ideaTitle?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  categories?: FeedbackCategoryOption[];
  /** When categories are shown, require a chip before submit. Defaults to true when categories are non-empty. */
  categoryRequired?: boolean;
  /** When true, feedback must be non-empty (1–2000 chars after trim) before submit. */
  feedbackRequired?: boolean;
  /** Parent mutation failure message shown inline. */
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (feedbackText: string | null, feedbackCategory?: string | null) => void;
}

export default function RejectWithFeedbackModal({
  isOpen,
  title = 'Reject idea',
  promptText,
  subjectLabel,
  ideaTitle,
  submitLabel = 'Reject idea',
  isSubmitting = false,
  categories,
  categoryRequired,
  feedbackRequired = false,
  errorMessage = null,
  onClose,
  onSubmit,
}: RejectWithFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('');
  const [localValidationMessage, setLocalValidationMessage] = useState<string | null>(null);
  const resolvedSubjectLabel = subjectLabel ?? ideaTitle;
  const showCategories = Boolean(categories?.length);
  const resolvedCategoryRequired = categoryRequired ?? showCategories;
  const trimmedFeedback = feedback.trim();

  const handleClose = () => {
    setFeedback('');
    setCategory('');
    setLocalValidationMessage(null);
    onClose();
  };

  const handleCategoryClick = (id: string) => {
    if (resolvedCategoryRequired) {
      setCategory(id);
      return;
    }
    setCategory((prev) => (prev === id ? '' : id));
  };

  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
    setLocalValidationMessage(null);
  };

  const handleSubmit = () => {
    const trimmed = feedback.trim();
    if (feedbackRequired) {
      if (!trimmed) {
        setLocalValidationMessage('Feedback is required.');
        return;
      }
      if (trimmed.length > FEEDBACK_MAX_LENGTH) {
        setLocalValidationMessage('Feedback must be 2000 characters or fewer.');
        return;
      }
      setLocalValidationMessage(null);
      onSubmit(trimmed, showCategories ? category || null : undefined);
      return;
    }
    onSubmit(trimmed || null, showCategories ? category || null : undefined);
  };

  const categoryOk = resolvedCategoryRequired ? category !== '' : true;
  const feedbackOk = feedbackRequired ? trimmedFeedback.length >= 1 : true;
  const canSubmit = categoryOk && feedbackOk;

  const defaultPrompt =
    resolvedSubjectLabel != null && resolvedSubjectLabel !== '' ? (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {feedbackRequired ? (
          <>
            Add feedback explaining why{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {resolvedSubjectLabel}
            </span>{' '}
            does not work so future runs can improve.
          </>
        ) : (
          <>
            Tell the system why{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {resolvedSubjectLabel}
            </span>{' '}
            does not work so future runs can improve.
          </>
        )}
      </p>
    ) : feedbackRequired ? (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Add feedback so future runs can improve.
      </p>
    ) : null;

  const displayAlert = localValidationMessage ?? errorMessage;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4 p-1">
        {promptText ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{promptText}</p>
        ) : (
          defaultPrompt
        )}
        {showCategories ? (
          <div>
            <span
              id="reject-feedback-reason-category-label"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Reason category
              {!resolvedCategoryRequired ? (
                <span className="font-normal text-gray-500"> (optional)</span>
              ) : null}
            </span>
            <div
              role="group"
              aria-labelledby="reject-feedback-reason-category-label"
              className="grid gap-2 sm:grid-cols-2"
            >
              {categories!.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectableChipClassName(
                    category === item.id,
                    'text-left py-1.5',
                    isSubmitting
                  )}
                  aria-pressed={category === item.id}
                  disabled={isSubmitting}
                  onClick={() => handleCategoryClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Feedback
          {!feedbackRequired ? (
            <span className="font-normal text-gray-500"> (optional)</span>
          ) : null}
        </label>
        <Textarea
          value={feedback}
          onChange={(e) => handleFeedbackChange(e.target.value)}
          rows={2}
          placeholder='e.g. "Too generic" or "Out of my technical depth"'
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
        {displayAlert ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {displayAlert}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !canSubmit}
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
