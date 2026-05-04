import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';

interface DeleteThreadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  threadTitle?: string;
  isDeleting?: boolean;
}

export function DeleteThreadDialog({
  isOpen,
  onClose,
  onConfirm,
  threadTitle,
  isDeleting = false,
}: DeleteThreadDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Delete chat">
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this chat? This action cannot be undone.
        </p>
        {threadTitle ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-gray-900 dark:text-white">{threadTitle}</p>
          </div>
        ) : null}
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
            {isDeleting ? 'Deleting…' : 'Delete chat'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
