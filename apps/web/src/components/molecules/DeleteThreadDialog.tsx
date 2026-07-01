import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import { Card, CardBody } from '@/components/atoms/Card';

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
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete chat"
      description="Are you sure you want to delete this chat? This action cannot be undone."
      confirmLabel={isDeleting ? 'Deleting…' : 'Delete chat'}
      isLoading={isDeleting}
      variant="danger"
    >
      {threadTitle ? (
        <Card>
          <CardBody className="py-2">
            <p className="font-semibold text-gray-900 dark:text-white">{threadTitle}</p>
          </CardBody>
        </Card>
      ) : null}
    </ConfirmDialog>
  );
}
