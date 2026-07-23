import { useState } from 'react';
import { ImageIcon, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import PanelToggleHandle from '@/components/atoms/PanelToggleHandle';
import Dialog from '@/components/molecules/Dialog';
import Menubar from '@/components/molecules/Menubar';
import { Select } from '@/components/atoms/Select';
import { linkAccentClassName, statusPillClassName } from '../personal-branding-ui';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';
import { cn } from '@/lib/utils';
import type {
  AssetPromptsResult,
  BrandPlatform,
  ContentNode,
  ContentStatus,
  ContentType,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import { DialogFooter, PageCard, SidebarCard } from '../PersonalBrandingPageTemplate';
import ContentStatusBadge from './ContentStatusBadge';
import ContentStatusChangeModal, {
  type ContentStatusChangeMode,
  type PublishContentMetadata,
} from './ContentStatusChangeModal';
import BrandPillarMultiSelect from '@/components/molecules/personal-branding/BrandPillarMultiSelect';
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
  draftPlatform: BrandPlatform | null;
  onDraftPlatformChange: (value: BrandPlatform | null) => void;
  draftCanonicalUrl: string;
  onDraftCanonicalUrlChange: (value: string) => void;
  draftPillars: string[];
  onDraftPillarsChange: (value: string[]) => void;
  brandPillarOptions: string[];
  assetPrompts: AssetPromptsResult | null;
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
  isGeneratingAssets: boolean;
  isInjectingImages?: boolean;
  imageInjectError?: string | null;
  imageInjectMessage?: string | null;
  isOptimizingKeywords?: boolean;
  keywordOptimizeError?: string | null;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onLoadDraft: (node: ContentNode) => void;
  onNewDraft: () => void;
  onSaveDraft: () => void;
  onDeleteDraft: () => void | Promise<void>;
  onPublish: (metadata: PublishContentMetadata) => void | Promise<void>;
  onUnpublish: () => void | Promise<void>;
  onGenerateAssetPrompts: () => void;
  onInjectImages?: () => void;
  onOptimizeKeywords?: () => void;
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
  draftPlatform,
  onDraftPlatformChange,
  draftCanonicalUrl,
  onDraftCanonicalUrlChange,
  draftPillars,
  onDraftPillarsChange,
  brandPillarOptions,
  assetPrompts,
  isDirty,
  isSaving,
  isPublishing,
  isUnpublishing,
  isDeleting,
  isGeneratingAssets,
  isInjectingImages = false,
  imageInjectError,
  imageInjectMessage,
  isOptimizingKeywords = false,
  keywordOptimizeError,
  drawerOpen,
  onToggleDrawer,
  onLoadDraft,
  onNewDraft,
  onSaveDraft,
  onDeleteDraft,
  onPublish,
  onUnpublish,
  onGenerateAssetPrompts,
  onInjectImages,
  onOptimizeKeywords,
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

  const handleStatusChangeConfirm = (metadata?: PublishContentMetadata) => {
    const action =
      statusChangeModal === 'unpublish'
        ? onUnpublish
        : () => {
            if (!metadata) return Promise.resolve();
            return onPublish(metadata);
          };
    void Promise.resolve(action()).then(() => {
      setStatusChangeModal(null);
    });
  };

  const publishLabel = isPublishing
    ? 'Publishing…'
    : isUnpublishing
      ? 'Moving…'
      : isPublished
        ? 'Move to draft'
        : 'Publish';

  const publishDisabled = isPublished
    ? statusChangePending || !activeDraftId
    : statusChangePending || !editorTitle.trim();

  const showOptimizeKeywords =
    Boolean(activeDraftId) &&
    contentType === 'DEEP_DIVE_BLOG' &&
    draftPlatform === 'medium' &&
    Boolean(onOptimizeKeywords);

  const menubarMenus = [
    {
      key: 'file',
      label: 'File',
      items: [
        {
          key: 'publish',
          label: publishLabel,
          onClick: () => setStatusChangeModal(isPublished ? 'unpublish' : 'publish'),
          disabled: publishDisabled,
        },
        {
          key: 'delete',
          label: isDeleting ? 'Deleting…' : 'Delete',
          icon: Trash2,
          tone: 'danger' as const,
          onClick: () => setDeleteModalOpen(true),
          disabled: deleteDisabled,
        },
      ],
    },
    {
      key: 'ai-tools',
      label: 'AI Tools',
      items: [
        {
          key: 'generate-asset-prompts',
          label: isGeneratingAssets ? 'Generating…' : 'Generate Asset Prompts',
          icon: Sparkles,
          onClick: onGenerateAssetPrompts,
          disabled:
            isGeneratingAssets || isInjectingImages || !editorBody.trim() || isOptimizingKeywords,
        },
        {
          key: 'inject-images',
          label: isInjectingImages ? 'Injecting images…' : 'Inject Images',
          icon: ImageIcon,
          onClick: () => onInjectImages?.(),
          disabled:
            isInjectingImages ||
            isGeneratingAssets ||
            isOptimizingKeywords ||
            !editorBody.trim() ||
            !onInjectImages,
        },
        ...(showOptimizeKeywords
          ? [
              {
                key: 'optimize-keywords',
                label: isOptimizingKeywords ? 'Optimizing…' : 'Optimize Keywords',
                icon: Search,
                onClick: () => onOptimizeKeywords?.(),
                disabled:
                  isOptimizingKeywords ||
                  isGeneratingAssets ||
                  !editorBody.trim() ||
                  !activeDraftId,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <div
      className={cn(
        'grid h-full min-h-0 gap-6',
        drawerOpen ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-1'
      )}
    >
      {drawerOpen ? (
        <SidebarCard
          className={cn(
            'flex flex-col overflow-hidden lg:h-full lg:min-h-0',
            'max-h-[35vh] lg:max-h-none'
          )}
        >
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
                      <ContentStatusBadge status={node.status} platform={node.platform} />
                      <span aria-hidden="true">·</span>
                      <span>{new Date(node.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {node.pillars.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {node.pillars.map((pillar) => (
                          <span
                            key={pillar}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {pillar}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </SidebarCard>
      ) : null}

      <PageCard className="relative flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <PanelToggleHandle
          collapsed={!drawerOpen}
          onToggle={onToggleDrawer}
          className="absolute -left-3 top-6 z-10"
        />

        <Menubar menus={menubarMenus} ariaLabel="Content workbench actions" className="shrink-0" />

        <div
          role="toolbar"
          aria-label="Draft actions"
          className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-gray-200 pb-3 dark:border-gray-700"
        >
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
            <Select
              value={draftPlatform ?? ''}
              onChange={(e) => onDraftPlatformChange((e.target.value as BrandPlatform) || null)}
              aria-label="Draft target platform"
              className="w-auto shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="">No platform</option>
              {(Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[]).map((p) => (
                <option key={p} value={p}>
                  {BRAND_PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
            <input
              type="url"
              value={draftCanonicalUrl}
              onChange={(e) => onDraftCanonicalUrlChange(e.target.value)}
              placeholder="Canonical URL"
              aria-label="Canonical URL"
              className="w-44 shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
            />
            <Button
              type="button"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="shrink-0"
            >
              {isSaving ? 'Saving…' : isDirty ? 'Save draft' : 'Saved'}
            </Button>
          </div>
        </div>

        {brandPillarOptions.length > 0 ? (
          <div className="shrink-0 border-b border-gray-200 pb-3 dark:border-gray-700">
            <div className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              Brand pillars
            </div>
            <BrandPillarMultiSelect
              options={brandPillarOptions}
              value={draftPillars}
              onChange={onDraftPillarsChange}
              disabled={isSaving || isPublishing || isUnpublishing}
            />
          </div>
        ) : null}

        {keywordOptimizeError ? (
          <p className="shrink-0 text-sm text-amber-700 dark:text-amber-300" role="status">
            {keywordOptimizeError}
          </p>
        ) : null}

        {imageInjectError ? (
          <p className="shrink-0 text-sm text-red-600 dark:text-red-400" role="alert">
            {imageInjectError}
          </p>
        ) : null}

        {isInjectingImages && imageInjectMessage ? (
          <p className="shrink-0 text-sm text-gray-600 dark:text-gray-400" role="status">
            {imageInjectMessage}
          </p>
        ) : null}

        <div
          className={cn(
            'min-h-0 flex-1 overflow-hidden',
            (isOptimizingKeywords || isInjectingImages) && 'pointer-events-none opacity-70'
          )}
        >
          <MarkdownEditor
            value={editorBody}
            onChange={onBodyChange}
            minHeight="100%"
            className="h-full"
            fullWidth
            enableRichEmbedsToggle
          />
        </div>

        {assetPrompts ? (
          <PageCard className="max-h-[28vh] shrink-0 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/50">
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
        initialPlatform={draftPlatform}
        initialCanonicalUrl={draftCanonicalUrl}
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
