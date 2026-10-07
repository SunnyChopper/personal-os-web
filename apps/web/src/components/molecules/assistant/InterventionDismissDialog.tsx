import Button from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import Dialog from '@/components/molecules/Dialog';
import { FormField } from '@/components/molecules/FormField';

type InterventionDismissDialogProps = {
  isOpen: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  reasonFieldId?: string;
  /** When > 1, copy explains all similar alerts for this kind+task are dismissed. */
  occurrenceCount?: number;
};

export function InterventionDismissDialog({
  isOpen,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  isPending = false,
  reasonFieldId = 'intervention-dismiss-reason',
  occurrenceCount = 1,
}: InterventionDismissDialogProps) {
  const stacked = occurrenceCount > 1;
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Dismiss intervention">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {stacked
          ? `This dismisses all ${occurrenceCount} similar alerts for this task and kind. Tell the Assistant why (helps future nudges).`
          : 'Tell the Assistant why this is not relevant (helps future nudges).'}
      </p>
      <FormField label="Reason" htmlFor={reasonFieldId} className="mb-4">
        <Textarea
          id={reasonFieldId}
          rows={3}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Not a priority today…"
        />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={isPending} onClick={onConfirm}>
          Dismiss
        </Button>
      </div>
    </Dialog>
  );
}
