import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import { Card, CardBody } from '@/components/atoms/Card';

interface DeleteFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  filePath?: string;
  isDeleting?: boolean;
}

export default function DeleteFileDialog({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  filePath,
  isDeleting = false,
}: DeleteFileDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete File"
      description="Are you sure you want to delete this file? This action cannot be undone."
      confirmLabel={isDeleting ? 'Deleting…' : 'Delete File'}
      isLoading={isDeleting}
      variant="danger"
    >
      <Card>
        <CardBody className="py-2">
          <p className="font-semibold text-gray-900 dark:text-white">{fileName}</p>
          {filePath && filePath !== fileName ? (
            <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">{filePath}</p>
          ) : null}
        </CardBody>
      </Card>
    </ConfirmDialog>
  );
}
