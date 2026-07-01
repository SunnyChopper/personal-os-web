import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import { Card, CardBody } from '@/components/atoms/Card';
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
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Entry"
      description="Are you sure you want to delete this entry? This action cannot be undone."
      confirmLabel={isDeleting ? 'Deleting…' : 'Delete Entry'}
      isLoading={isDeleting}
      variant="danger"
    >
      {entry ? (
        <Card>
          <CardBody className="py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              {parseDateInput(entry.date).toLocaleDateString()}
            </p>
            {entry.title ? (
              <p className="mt-1 text-gray-600 dark:text-gray-400">{entry.title}</p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </ConfirmDialog>
  );
}
