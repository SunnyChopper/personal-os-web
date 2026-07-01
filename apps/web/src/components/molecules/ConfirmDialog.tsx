import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'default';
  children?: ReactNode;
}

/**
 * Confirmation dialog built on the shared Dialog primitive.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {variant === 'danger' ? (
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden />
            <div className="space-y-2">
              {description ? (
                <p className="text-gray-700 dark:text-gray-300">{description}</p>
              ) : null}
              {children}
            </div>
          </div>
        ) : (
          <>
            {description ? <p className="text-gray-700 dark:text-gray-300">{description}</p> : null}
            {children}
          </>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} size="sm">
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            size="sm"
            className={cn(
              variant === 'danger' &&
                '!bg-red-600 hover:!bg-red-700 focus-visible:ring-red-500 dark:!bg-red-600 dark:hover:!bg-red-700'
            )}
          >
            {isLoading ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
