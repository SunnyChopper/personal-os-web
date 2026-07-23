import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { getMarkIrrelevantModalCopy } from '@/pages/admin/personal-branding/signal-radar/mark-irrelevant-modal-copy';
import { RADAR_IRRELEVANCE_REASON_OPTIONS } from '@/pages/admin/personal-branding/signal-radar/radar-irrelevance-reasons';
import type { RadarUserIrrelevanceReason } from '@/types/api/personal-branding.dto';

export interface MarkIrrelevantReasonModalProps {
  isOpen: boolean;
  itemTitle?: string;
  itemCount?: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: RadarUserIrrelevanceReason) => void;
}

export default function MarkIrrelevantReasonModal({
  isOpen,
  itemTitle,
  itemCount = 1,
  isSubmitting = false,
  onClose,
  onSubmit,
}: MarkIrrelevantReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<RadarUserIrrelevanceReason | null>(null);
  const { title, submitLabel, description, isBulk } = getMarkIrrelevantModalCopy(
    itemCount,
    itemTitle
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4 p-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isBulk ? (
            <>
              Help the ranking agent learn what to filter. Pick one reason for all{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {itemCount} selected cards
              </span>
              .
            </>
          ) : itemTitle ? (
            <>
              Help the ranking agent learn what to filter. Pick a reason for{' '}
              <span className="font-medium text-gray-900 dark:text-white">{itemTitle}</span>.
            </>
          ) : (
            description
          )}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {RADAR_IRRELEVANCE_REASON_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={selectableChipClassName(selectedReason === option.value, 'text-left')}
              onClick={() => setSelectedReason(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedReason || isSubmitting}
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
