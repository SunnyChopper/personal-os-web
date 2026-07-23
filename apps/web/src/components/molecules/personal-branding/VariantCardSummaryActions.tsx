import Button from '@/components/atoms/Button';

export interface VariantCardSummaryActionsProps {
  isRejected: boolean;
  isReady: boolean;
  isDistributionUpdating: boolean;
  inWorkbench: boolean;
  sendToSandboxPending: boolean;
  regeneratePending: boolean;
  regenerateDisabled: boolean;
  suggestImprovementsPending?: boolean;
  suggestImprovementsDisabled?: boolean;
  onEdit: () => void;
  onOpenWorkbench: () => void;
  onPushToWorkbench: () => void;
  onMarkReady: () => void;
  onCopy: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  onSuggestImprovements?: () => void;
}

export function VariantCardSummaryActions({
  isRejected,
  isReady,
  isDistributionUpdating,
  inWorkbench,
  sendToSandboxPending,
  regeneratePending,
  regenerateDisabled,
  onEdit,
  onOpenWorkbench,
  onPushToWorkbench,
  onMarkReady,
  onCopy,
  onReject,
  onRegenerate,
  onSuggestImprovements,
  suggestImprovementsPending = false,
  suggestImprovementsDisabled = false,
}: VariantCardSummaryActionsProps) {
  return (
    <div className="mt-4 flex w-full flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onEdit}>
          Edit
        </Button>
        {!isRejected ? (
          <>
            {inWorkbench ? (
              <Button type="button" size="sm" variant="primary" onClick={onOpenWorkbench}>
                Open in Workbench
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={onPushToWorkbench}
                disabled={sendToSandboxPending}
              >
                Push to Workbench
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isReady || isDistributionUpdating}
              onClick={onMarkReady}
            >
              {isReady ? 'Ready' : 'Mark Ready'}
            </Button>
          </>
        ) : null}
        <Button type="button" size="sm" variant="secondary" onClick={onCopy}>
          Copy
        </Button>
        {!isRejected && onSuggestImprovements ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onSuggestImprovements}
            disabled={suggestImprovementsPending || suggestImprovementsDisabled}
          >
            {suggestImprovementsPending ? 'Suggesting…' : 'Suggest improvements'}
          </Button>
        ) : null}
        {isRejected ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={onRegenerate}
            disabled={regeneratePending || regenerateDisabled}
          >
            Regenerate
          </Button>
        ) : null}
      </div>
      {!isRejected ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <Button type="button" size="sm" variant="destructive" onClick={onReject}>
            Reject
          </Button>
        </div>
      ) : null}
    </div>
  );
}
