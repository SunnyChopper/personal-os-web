import CollapsibleSection from '@/components/molecules/CollapsibleSection';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import Dialog from '@/components/molecules/Dialog';
import { Skeleton } from '@/components/atoms/Skeleton';
import ExecutionDetailMetadata from '@/components/molecules/observability/ExecutionDetailMetadata';
import ExecutionDetailStickyHeader from '@/components/molecules/observability/ExecutionDetailStickyHeader';
import ExecutionExpandableTextPanel from '@/components/molecules/observability/ExecutionExpandableTextPanel';
import ExecutionRawPayloads from '@/components/molecules/observability/ExecutionRawPayloads';
import LinkedStackTrace from '@/components/molecules/observability/LinkedStackTrace';
import type { EditorLinkSettings } from '@/lib/editor-links';
import {
  executionDetailLoadingPanelClassName,
  executionDetailMetricGridClassName,
  executionDetailMetricTileClassName,
  executionDetailStickyHeaderClassName,
  executionDetailTextPanelClassName,
} from '@/lib/observability/execution-detail-surfaces';
import {
  getRawPayloadEntries,
  hasFailureDetails,
  isExecutionFailure,
} from '@/lib/observability/execution-detail-helpers';
import { renderExecutionPromptText } from '@/lib/observability/render-execution-prompt';
import { cn } from '@/lib/utils';
import type { ObservabilityExecutionDetail } from '@/types/observability';

export type ExecutionDetailModalProps = {
  isOpen: boolean;
  detailId: string | null;
  detail: ObservabilityExecutionDetail | undefined;
  isLoading: boolean;
  onClose: () => void;
  onOpenSandbox: () => void;
  onOpenThread?: (threadId: string) => void;
  sandboxPending?: boolean;
  sandboxError?: string | null;
  editorLinkSettings: EditorLinkSettings;
};

function ExecutionDetailLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading execution detail">
      <div className={executionDetailStickyHeaderClassName}>
        <Skeleton className="h-5 w-16 rounded-full" variant="rectangular" />
        <Skeleton className="h-5 w-14 rounded-full" variant="rectangular" />
        <Skeleton className="h-4 w-32" variant="text" />
        <Skeleton className="h-4 w-20" variant="text" />
        <Skeleton className="ml-auto h-8 w-36" variant="rectangular" />
      </div>
      <div className={executionDetailMetricGridClassName}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={executionDetailMetricTileClassName}>
            <Skeleton className="h-3 w-16" variant="text" />
            <Skeleton className="mt-2 h-4 w-24" variant="text" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className={executionDetailTextPanelClassName}>
          <Skeleton className="mb-2 h-3 w-20" variant="text" />
          <Skeleton className="h-24 w-full" variant="rectangular" />
        </div>
      ))}
    </div>
  );
}

export default function ExecutionDetailModal({
  isOpen,
  detailId,
  detail,
  isLoading,
  onClose,
  onOpenSandbox,
  onOpenThread,
  sandboxPending = false,
  sandboxError = null,
  editorLinkSettings,
}: ExecutionDetailModalProps) {
  const rawEntries = detail ? getRawPayloadEntries(detail) : [];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Execution detail"
      size="full"
      trapFocus
      stickySubheader={
        detail ? (
          <ExecutionDetailStickyHeader
            detail={detail}
            onOpenSandbox={onOpenSandbox}
            sandboxPending={sandboxPending}
            sandboxError={sandboxError}
          />
        ) : null
      }
    >
      {isLoading && <ExecutionDetailLoadingSkeleton />}
      {detail && (
        <div className="space-y-4 text-sm">
          {detail.errorMessage?.trim() && isExecutionFailure(detail.status) && (
            <div
              role="alert"
              className="rounded-lg border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
            >
              {detail.errorMessage}
            </div>
          )}

          <ExecutionDetailMetadata detail={detail} animated onOpenThread={onOpenThread} />

          {detail.promptText != null && (
            <CollapsibleSection title="Prompt" defaultOpen animated>
              <ExecutionExpandableTextPanel
                collapsedMaxHeightClassName="max-h-48"
                expandedMaxHeightClassName="max-h-[32rem]"
              >
                {renderExecutionPromptText(detail.promptText)}
              </ExecutionExpandableTextPanel>
            </CollapsibleSection>
          )}

          {detail.responseRawText != null && (
            <CollapsibleSection title="Response" defaultOpen animated>
              <ExecutionExpandableTextPanel
                collapsedMaxHeightClassName="max-h-64"
                expandedMaxHeightClassName="max-h-[32rem]"
              >
                <div className="min-w-0 break-words">
                  <MarkdownRenderer content={detail.responseRawText} variant="chat" />
                </div>
              </ExecutionExpandableTextPanel>
            </CollapsibleSection>
          )}

          {hasFailureDetails(detail) && (
            <CollapsibleSection
              title="Failure details"
              defaultOpen={isExecutionFailure(detail.status)}
              summary={detail.errorMessage?.slice(0, 80) ?? 'Stack trace'}
              animated
            >
              <div className="space-y-4">
                {detail.errorMessage?.trim() && (
                  <div className="rounded-md border border-red-200/80 bg-red-50/90 px-3 py-2 text-xs text-red-800 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
                    {detail.errorMessage}
                  </div>
                )}
                {detail.partialResponseText != null && (
                  <div>
                    <div className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Partial response
                    </div>
                    <ExecutionExpandableTextPanel
                      collapsedMaxHeightClassName="max-h-32"
                      expandedMaxHeightClassName="max-h-64"
                    >
                      <div className="min-w-0 break-words">
                        <MarkdownRenderer content={detail.partialResponseText} variant="chat" />
                      </div>
                    </ExecutionExpandableTextPanel>
                  </div>
                )}
                {detail.stackTrace != null && (
                  <div>
                    <div className="mb-1 text-xs font-semibold text-red-600 dark:text-red-400">
                      Stack trace
                    </div>
                    <LinkedStackTrace
                      text={detail.stackTrace}
                      settings={editorLinkSettings}
                      className="rounded border border-red-200/80 bg-red-50/90 p-3 dark:border-red-900/70 dark:bg-red-950/30"
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {rawEntries.length > 0 && (
            <CollapsibleSection
              title="Raw payloads"
              defaultOpen={false}
              summary={`${rawEntries.length} field(s)`}
              animated
            >
              <ExecutionRawPayloads entries={rawEntries} />
            </CollapsibleSection>
          )}
        </div>
      )}
      {!isLoading && !detail && detailId ? (
        <p className={cn(executionDetailLoadingPanelClassName, 'text-sm text-gray-500')}>
          Execution not found.
        </p>
      ) : null}
    </Dialog>
  );
}
