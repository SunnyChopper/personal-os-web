import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Textarea } from '@/components/atoms/Textarea';
import { DialogFooter } from '../PersonalBrandingPageTemplate';

interface RetryTemplateModalProps {
  isOpen: boolean;
  candidateTitle?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (feedbackText: string) => void;
}

export default function RetryTemplateModal({
  isOpen,
  candidateTitle,
  isSubmitting = false,
  onClose,
  onSubmit,
}: RetryTemplateModalProps) {
  const [feedback, setFeedback] = useState('');

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = feedback.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Retry with feedback" size="md">
      <div className="space-y-4 p-1">
        {candidateTitle ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tell the agent how to revise{' '}
            <span className="font-medium text-gray-900 dark:text-white">{candidateTitle}</span>.
          </p>
        ) : null}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Feedback
        </label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder='e.g. "Make the hook shorter" or "Add a stronger CTA section"'
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !feedback.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Retrying…' : 'Retry extraction'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
