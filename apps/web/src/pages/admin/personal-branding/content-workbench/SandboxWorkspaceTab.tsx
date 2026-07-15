import { useState } from 'react';
import { Loader2, PanelLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { linkAccentClassName, statusPillClassName } from '../personal-branding-ui';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';
import { cn } from '@/lib/utils';
import type {
  AssetPromptsResult,
  ContentNode,
  ContentStatus,
  ContentType,
} from '@/types/api/personal-branding.dto';
import { CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import { DialogFooter, PageCard, SidebarCard } from '../PersonalBrandingPageTemplate';
import ContentStatusBadge from './ContentStatusBadge';
import ContentStatusChangeModal, { type ContentStatusChangeMode } from './ContentStatusChangeModal';
import { contentTextStats } from './content-workbench-helpers';

interface SandboxWorkspaceTabProps {
  contentNodes: ContentNode[];
  activeDraftId: string | null;
  activeContentStatus: ContentStatus | null;
  editorTitle: string;
  onTitleChange: (value: string) => void;
  editorBody: string;
  onBodyChange: (value: string) => void;
  contentType: ContentType;
  assetPrompts: AssetPromptsResult | null;
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
  isGeneratingAssets: boolean;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onLoadDraft: (node: ContentNode) => void;
  onNewDraft: () => void;
  onSaveDraft: () => void;
  onDeleteDraft: () => void | Promise<void>;
  onPublish: () => void | Promise<void>;
  onUnpublish: () => void | Promise<void>;
  onGenerateAssetPrompts: () => void;
}

export default function SandboxWorkspaceTab({
  contentNodes,
  activeDraftId,
  activeContentStatus,
  editorTitle,
  onTitleChange,
  editorBody,
  onBodyChange,
  contentType,
  assetPrompts,
  isDirty,
  isSaving,
  isPublishing,
  isUnpublishing,
  isDeleting,
  isGeneratingAssets,
  drawerOpen,
  onToggleDrawer,
  onLoadDraft,
  onNewDraft,
  onSaveDraft,
  onDeleteDraft,
  onPublish,
  onUnpublish,
  onGenerateAssetPrompts,
}: SandboxWorkspaceTabProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState<ContentStatusChangeMode | null>(null);
  const deleteDisabled = !activeDraftId || isSaving || isPublishing || isUnpublishing || isDeleting;
  const isPublished = activeContentStatus === 'PUBLISHED';
  const statusChangePending = isPublishing || isUnpublishing;
  const draftLabel = editorTitle.trim() || 'Untitled draft';
  const publishStats = contentTextStats(editorBody);

  const closeStatusChangeModal = () => {
    if (!statusChangePending) setStatusChangeModal(null);
  };

  const handleStatusChangeConfirm = () => {
    const action = statusChangeModal === 'unpublish' ? onUnpublish : onPublish;
    void Promise.resolve(action()).then(() => {
      setStatusChangeModal(null);
    });
  };

  return (
    <div
      className={cn(
        'grid min-h-[640px] gap-6',
        drawerOpen ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-1'
      )}
    >
      {drawerOpen ? (
        <SidebarCard className="flex h-full flex-col overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your content</h3>
            <button
              type="button"
              onClick={onNewDraft}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                linkAccentClassName
              )}
            >
              <Plus size={14} />
              New
            </button>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto">
            {contentNodes.length === 0 ? (
              <li className="text-xs text-gray-500 dark:text-gray-400">No content yet.</li>
            ) : (
              contentNodes.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => onLoadDraft(node)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition',
                      activeDraftId === node.id
                        ? 'border-blue-500/40 bg-blue-600/10 text-blue-900 dark:text-blue-100'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="font-medium truncate">{node.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <ContentStatusBadge status={node.status} />
                      <span aria-hidden="true">·</span>
                      <span>{new Date(node.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </SidebarCard>
      ) : null}

      <PageCard className="flex min-w-0 flex-col gap-3 p-4 sm:p-6">
        <div
          role="toolbar"
          aria-label="Draft actions"
          className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-gray-200 pb-3 dark:border-gray-700"
        >
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onToggleDrawer}
              className="inline-flex shrink-0 items-center gap-1.5"
              aria-label="Toggle content library"
            >
              <PanelLeft size={16} className="shrink-0" />
              <span className="hidden sm:inline">Content</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onNewDraft}
              className="inline-flex shrink-0 items-center gap-1.5"
            >
              <Plus size={16} className="shrink-0" />
              <span className="hidden sm:inline">New draft</span>
            </Button>
          </div>
          <input
            value={editorTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Draft title"
            className="min-w-0 w-full flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <span className={statusPillClassName('neutral')}>
              {CONTENT_TYPE_LABELS[contentType]}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="shrink-0"
            >
              {isSaving ? 'Saving…' : isDirty ? 'Save draft' : 'Saved'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleteDisabled}
              className="inline-flex shrink-0 items-center border-red-300 px-2 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              aria-label="Delete draft"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </Button>
            {isPublished ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setStatusChangeModal('unpublish')}
                disabled={statusChangePending || !activeDraftId}
                className="shrink-0"
              >
                {isUnpublishing ? 'Moving…' : 'Move to draft'}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setStatusChangeModal('publish')}
                disabled={statusChangePending || !editorTitle.trim()}
                className="shrink-0"
              >
                {isPublishing ? 'Publishing…' : 'Publish'}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onGenerateAssetPrompts}
              disabled={isGeneratingAssets || !editorBody.trim()}
              className="inline-flex shrink-0 items-center gap-1.5"
            >
              {isGeneratingAssets ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span className="hidden md:inline">Assets</span>
            </Button>
          </div>
        </div>

        <div className="min-h-[480px] flex-1">
          <MarkdownEditor value={editorBody} onChange={onBodyChange} minHeight="480px" fullWidth />
        </div>

        {assetPrompts ? (
          <PageCard className="bg-gray-50 p-4 dark:bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asset prompts</h3>
            {assetPrompts.blogPrompts && assetPrompts.blogPrompts.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {assetPrompts.blogPrompts.map((row, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{row.placement}</div>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{row.prompt}</p>
                    {row.styleNotes ? (
                      <p className="mt-1 text-xs text-gray-500">{row.styleNotes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {assetPrompts.videoPrompts && assetPrompts.videoPrompts.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {assetPrompts.videoPrompts.map((row, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{row.timecode}</div>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{row.description}</p>
                    {row.visualHook ? (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        {row.visualHook}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {assetPrompts.socialNotes ? (
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {assetPrompts.socialNotes}
              </p>
            ) : null}
          </PageCard>
        ) : null}
      </PageCard>

      <ContentStatusChangeModal
        isOpen={statusChangeModal !== null}
        mode={statusChangeModal ?? 'publish'}
        contentTitle={draftLabel}
        wordCount={publishStats.wordCount}
        readingTimeMinutes={publishStats.readingTimeMinutes}
        isPending={statusChangePending}
        onClose={closeStatusChangeModal}
        onConfirm={handleStatusChangeConfirm}
      />

      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) setDeleteModalOpen(false);
        }}
        title="Delete draft?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-medium text-gray-900 dark:text-white">{draftLabel}</span>? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void Promise.resolve(onDeleteDraft()).then(() => {
                  setDeleteModalOpen(false);
                });
              }}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete draft'
              )}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
