import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/atoms/Button';

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
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Delete File
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this file? This action cannot be undone.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-gray-900 dark:text-white">{fileName}</p>
            {filePath && filePath !== fileName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{filePath}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting} size="sm">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isDeleting}
            size="sm"
            className={cn(
              '!bg-red-600 hover:!bg-red-700',
              'focus-visible:ring-red-500',
              'dark:!bg-red-600 dark:hover:!bg-red-700'
            )}
          >
            {isDeleting ? 'Deleting...' : 'Delete File'}
          </Button>
        </div>
      </div>
    </div>
  );
}
