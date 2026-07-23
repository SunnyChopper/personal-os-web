import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import { getBulkRejectModalCopy } from '@/pages/admin/personal-branding/content-pipeline/bulk-reject-modal-copy';

export interface BulkRejectVariantsModalProps {
  isOpen: boolean;
  variantCount: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (critique: string) => void;
}

export function BulkRejectVariantsModal({
  isOpen,
  variantCount,
  isSubmitting = false,
  onClose,
  onSubmit,
}: BulkRejectVariantsModalProps) {
  const [critique, setCritique] = useState('');
  const { title, description, submitLabel } = getBulkRejectModalCopy(variantCount);

  useEffect(() => {
    if (isOpen) {
      setCritique('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setCritique('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = critique.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4 p-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        <Textarea
          value={critique}
          onChange={(e) => setCritique(e.target.value)}
          placeholder="What fell flat? Hook, tone, length, structure…"
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
        />
        <DialogFooter>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!critique.trim() || isSubmitting}
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Rejecting…' : submitLabel}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
