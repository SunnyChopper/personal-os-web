import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '../PersonalBrandingPageTemplate';

export type ContentStatusChangeMode = 'publish' | 'unpublish';

interface ContentStatusChangeModalProps {
  isOpen: boolean;
  mode: ContentStatusChangeMode;
  contentTitle: string;
  wordCount?: number;
  readingTimeMinutes?: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ContentStatusChangeModal({
  isOpen,
  mode,
  contentTitle,
  wordCount,
  readingTimeMinutes,
  isPending,
  onClose,
  onConfirm,
}: ContentStatusChangeModalProps) {
  const isPublish = mode === 'publish';
  const title = isPublish ? 'Mark as published?' : 'Move back to draft?';
  const displayTitle = contentTitle.trim() || 'Untitled draft';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) onClose();
      }}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {isPublish ? (
          <>
            <p className="text-gray-600 dark:text-gray-300">
              You are about to mark{' '}
              <span className="font-medium text-gray-900 dark:text-white">{displayTitle}</span> as
              published.
            </p>
            <dl className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/50">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">Word count</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{wordCount ?? 0}</dd>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">Approx. read time</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {readingTimeMinutes ?? 0} min
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            Move <span className="font-medium text-gray-900 dark:text-white">{displayTitle}</span>{' '}
            back to draft? It will no longer be marked as published.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className={
              isPublish
                ? undefined
                : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
            }
          >
            {isPending
              ? isPublish
                ? 'Publishing…'
                : 'Moving…'
              : isPublish
                ? 'Mark published'
                : 'Move to draft'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
