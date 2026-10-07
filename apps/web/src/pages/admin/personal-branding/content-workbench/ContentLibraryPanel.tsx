import { Plus } from 'lucide-react';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { cn } from '@/lib/utils';
import type { ContentNode } from '@/types/api/personal-branding.dto';
import {
  formatPersonalBrandingDate,
  linkAccentClassName,
  pbBannerTitleClassName,
  pbFocusVisibleRingClassName,
} from '../personal-branding-ui';
import ContentStatusBadge from './ContentStatusBadge';

function contentLibraryRowCheckboxClassName({
  isSelected = false,
  selectionActive = false,
}: {
  isSelected?: boolean;
  selectionActive?: boolean;
} = {}): string {
  return cn(
    'flex shrink-0 items-center justify-center self-center rounded-md px-1 transition-opacity duration-200',
    isSelected || selectionActive
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
  );
}

export interface ContentLibraryPanelProps {
  contentNodes: ContentNode[];
  activeDraftId: string | null;
  onSelect: (node: ContentNode) => void;
  onNewDraft: () => void;
  className?: string;
  /** Tighter header/list spacing for docked mobile sidebar under 35vh cap. */
  density?: 'default' | 'compact';
  showArchived?: boolean;
  onShowArchivedChange?: (value: boolean) => void;
  loadError?: boolean;
  onRetry?: () => void;
  /** Bulk selection: node is in the current selection set (distinct from activeDraftId). */
  isNodeSelected?: (node: ContentNode) => boolean;
  /** When true, show all row checkboxes (≥1 selected). */
  selectionActive?: boolean;
  /** When provided, renders per-row checkbox slots for future bulk actions. */
  onToggleSelect?: (node: ContentNode) => void;
}

export default function ContentLibraryPanel({
  contentNodes,
  activeDraftId,
  onSelect,
  onNewDraft,
  className,
  density = 'default',
  showArchived = false,
  onShowArchivedChange,
  loadError = false,
  onRetry,
  isNodeSelected,
  selectionActive = false,
  onToggleSelect,
}: ContentLibraryPanelProps) {
  const compact = density === 'compact';

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2',
          compact ? 'mb-2' : 'mb-3'
        )}
      >
        <h3 className={pbBannerTitleClassName}>Your content</h3>
        <button
          type="button"
          onClick={onNewDraft}
          className={cn('inline-flex items-center gap-1 text-xs font-medium', linkAccentClassName)}
        >
          <Plus size={14} />
          New
        </button>
      </div>
      {onShowArchivedChange ? (
        <label
          className={cn(
            'mb-2 flex shrink-0 items-center gap-2 text-xs text-gray-600 dark:text-gray-400',
            compact ? 'mb-1.5' : 'mb-2'
          )}
        >
          <FormCheckbox
            checked={showArchived}
            onChange={(event) => onShowArchivedChange(event.target.checked)}
            aria-label="Show archived content"
          />
          Show archived
        </label>
      ) : null}
      <ul className={cn('flex-1 overflow-y-auto', compact ? 'space-y-1.5' : 'space-y-2')}>
        {loadError && contentNodes.length === 0 ? (
          <li className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p role="alert">Couldn&apos;t load your content.</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
              >
                Retry
              </button>
            ) : null}
          </li>
        ) : contentNodes.length === 0 ? (
          <li className="text-xs text-gray-500 dark:text-gray-400">
            {showArchived ? 'No archived content.' : 'No content yet.'}
          </li>
        ) : (
          contentNodes.map((node) => {
            const isSelected = isNodeSelected?.(node) ?? false;
            const isActive = activeDraftId === node.id;

            return (
              <li key={node.id} className="group flex items-stretch gap-1">
                {onToggleSelect ? (
                  <div
                    data-content-library-select
                    className={contentLibraryRowCheckboxClassName({
                      isSelected,
                      selectionActive,
                    })}
                  >
                    <FormCheckbox
                      checked={isSelected}
                      onChange={() => onToggleSelect(node)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${node.title}`}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(node)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'min-w-0 flex-1 rounded-lg border text-left text-sm transition',
                    compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
                    pbFocusVisibleRingClassName,
                    isActive
                      ? 'border-blue-500/40 bg-blue-600/10 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="truncate font-medium">{node.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <ContentStatusBadge status={node.status} platform={node.platform} />
                    <span aria-hidden="true">·</span>
                    <span>{formatPersonalBrandingDate(node.updatedAt)}</span>
                    {node.pillars.length > 0 ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          {node.pillars.length} {node.pillars.length === 1 ? 'pillar' : 'pillars'}
                        </span>
                      </>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
