import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import type { LogbookEntry } from '@/types/growth-system';
import { parseDateInput } from '@/utils/date-formatters';

interface DeleteEntryDialogProps {
  entry: LogbookEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteEntryDialog({
  entry,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteEntryDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Delete Entry">
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this entry? This action cannot be undone.
        </p>
        {entry && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-gray-900 dark:text-white">
              {parseDateInput(entry.date).toLocaleDateString()}
            </p>
            {entry.title && <p className="text-gray-600 dark:text-gray-400 mt-1">{entry.title}</p>}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isDeleting}
            className="!bg-red-600 hover:!bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Entry'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
