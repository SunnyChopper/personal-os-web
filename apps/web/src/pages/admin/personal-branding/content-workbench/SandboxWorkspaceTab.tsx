import { useState } from 'react';
import {
  AlignLeft,
  Archive,
  ArchiveRestore,
  ImageIcon,
  ListTree,
  PenLine,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Button from '@/components/atoms/Button';
import PanelToggleHandle from '@/components/atoms/PanelToggleHandle';
import Dialog from '@/components/molecules/Dialog';
import Menubar from '@/components/molecules/Menubar';
import { pbBannerTitleClassName, pbFeedbackTextClassName } from '../personal-branding-ui';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';
import { cn } from '@/lib/utils';
import type {
  AssetPromptsResult,
  BrandPlatform,
  ContentNode,
  ContentStatus,
  ContentType,
} from '@/types/api/personal-branding.dto';
import { CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import { DialogFooter, PageCard, SidebarCard } from '../PersonalBrandingPageTemplate';
import ContentLibraryPanel from './ContentLibraryPanel';
import ContentStatusChangeModal, {
  type ContentStatusChangeMode,
  type PublishContentMetadata,
} from './ContentStatusChangeModal';
import BrandPillarMultiSelect from '@/components/molecules/personal-branding/BrandPillarMultiSelect';
import { contentTextStats } from './content-workbench-helpers';
import {
  pbAssetPanelMaxHeightClassName,
  pbDraftTitleInputClassName,
  pbSidebarMobileMaxHeightClassName,
  pbSidebarTwoColumnColsClassName,
} from './content-workbench-constants';
import { resolveSandboxEditorSaveStatus } from './resolve-sandbox-editor-save-status';
import { CLIENT_JOB_CANCELLED_LABEL } from '@/lib/personal-branding/client-job-cancel';
import DraftSettingsModal from './DraftSettingsModal';
import {
  publishMetadataFieldErrors,
  type PublishMetadataFieldErrors,
} from './publish-metadata-field-errors';

interface SandboxWorkspaceTabProps {
  contentNodes: ContentNode[];
  activeDraftId: string | null;
  activeContentStatus: ContentStatus | null;
  editorTitle: string;
  onTitleChange: (value: string) => void;
  editorBody: string;
  onBodyChange: (value: string) => void;
  contentType: ContentType;
  onContentTypeChange: (value: ContentType) => void;
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
  saveDraftError: string | null;
  lastSavedAt: number | null;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
  isArchiving?: boolean;
  isUnarchiving?: boolean;
  isGeneratingAssets: boolean;
  isFinishingContent?: boolean;
  isLengtheningContent?: boolean;
  isFormattingContent?: boolean;
  isInjectingImages?: boolean;
  imageInjectError?: string | null;
  imageInjectMessage?: string | null;
  imageInjectClientCancelState?: 'idle' | 'cancelled';
  onCancelImageInject?: () => void;
  isOptimizingKeywords?: boolean;
  keywordOptimizeError?: string | null;
  keywordOptimizeClientCancelState?: 'idle' | 'cancelled';
  onCancelKeywordOptimize?: () => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  showArchivedContent?: boolean;
  onShowArchivedChange?: (value: boolean) => void;
  contentLoadError?: boolean;
  onRetryContentLoad?: () => void;
  onLoadDraft: (node: ContentNode) => void;
  onNewDraft: () => void;
  onSaveDraft: () => void;
  onDeleteDraft: () => void | Promise<void>;
  onArchiveDraft?: () => void | Promise<void>;
  onUnarchiveDraft?: () => void | Promise<void>;
  onPublish: (metadata: PublishContentMetadata) => void | Promise<void>;
  onUnpublish: () => void | Promise<void>;
  onGenerateAssetPrompts: () => void;
  onFinishContent?: () => void;
  onLengthenContent?: () => void;
  onFormatPost?: () => void;
  onInjectImages?: () => void;
  onOptimizeKeywords?: () => void;
  aiToolLiveMessage?: string | null;
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
  onContentTypeChange,
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
  saveDraftError,
  lastSavedAt,
  isPublishing,
  isUnpublishing,
  isDeleting,
  isArchiving = false,
  isUnarchiving = false,
  isGeneratingAssets,
  isFinishingContent = false,
  isLengtheningContent = false,
  isFormattingContent = false,
  isInjectingImages = false,
  imageInjectError,
  imageInjectMessage,
  imageInjectClientCancelState = 'idle',
  onCancelImageInject,
  isOptimizingKeywords = false,
  keywordOptimizeError,
  keywordOptimizeClientCancelState = 'idle',
  onCancelKeywordOptimize,
  drawerOpen,
  onToggleDrawer,
  showArchivedContent = false,
  onShowArchivedChange,
  contentLoadError = false,
  onRetryContentLoad,
  onLoadDraft,
  onNewDraft,
  onSaveDraft,
  onDeleteDraft,
  onArchiveDraft,
  onUnarchiveDraft,
  onPublish,
  onUnpublish,
  onGenerateAssetPrompts,
  onFinishContent,
  onLengthenContent,
  onFormatPost,
  onInjectImages,
  onOptimizeKeywords,
  aiToolLiveMessage,
}: SandboxWorkspaceTabProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [draftSettingsModalOpen, setDraftSettingsModalOpen] = useState(false);
  const [brandPillarsModalOpen, setBrandPillarsModalOpen] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState<ContentStatusChangeMode | null>(null);
  const [publishFieldErrors, setPublishFieldErrors] = useState<PublishMetadataFieldErrors>({});
  const statusChangePending = isPublishing || isUnpublishing;
  const lifecyclePending = statusChangePending || isArchiving || isUnarchiving;
  const deleteDisabled = !activeDraftId || isSaving || lifecyclePending || isDeleting;
  const isPublished = activeContentStatus === 'PUBLISHED';
  const isArchived = activeContentStatus === 'SKIPPED';
  const draftLabel = editorTitle.trim() || 'Untitled draft';
  const publishStats = contentTextStats(editorBody);

  const closeStatusChangeModal = () => {
    if (!statusChangePending) {
      setStatusChangeModal(null);
      setPublishFieldErrors({});
    }
  };

  const openStatusChangeModal = (mode: ContentStatusChangeMode) => {
    setPublishFieldErrors({});
    setStatusChangeModal(mode);
  };

  const handleStatusChangeConfirm = (metadata?: PublishContentMetadata) => {
    const action =
      statusChangeModal === 'unpublish'
        ? onUnpublish
        : () => {
            if (!metadata) return Promise.resolve();
            return onPublish(metadata);
          };
    void Promise.resolve(action())
      .then(() => {
        setPublishFieldErrors({});
        setStatusChangeModal(null);
      })
      .catch((error: unknown) => {
        if (statusChangeModal === 'publish') {
          setPublishFieldErrors(publishMetadataFieldErrors(error));
        }
      });
  };

  const publishLabel = isPublishing
    ? 'Publishing…'
    : isUnpublishing
      ? 'Moving…'
      : isPublished
        ? 'Move to draft'
        : 'Publish';

  const publishDisabled = isArchived
    ? true
    : isPublished
      ? statusChangePending || !activeDraftId
      : statusChangePending || !editorTitle.trim();

  const archiveDisabled =
    !activeDraftId || isSaving || lifecyclePending || isDeleting || isArchived || !onArchiveDraft;

  const unarchiveDisabled =
    !activeDraftId ||
    isSaving ||
    lifecyclePending ||
    isDeleting ||
    !isArchived ||
    !onUnarchiveDraft;

  const showOptimizeKeywords =
    Boolean(activeDraftId) &&
    contentType === 'DEEP_DIVE_BLOG' &&
    draftPlatform === 'medium' &&
    Boolean(onOptimizeKeywords);

  const sandboxAiBusy =
    isGeneratingAssets ||
    isFinishingContent ||
    isLengtheningContent ||
    isFormattingContent ||
    isInjectingImages ||
    isOptimizingKeywords;
  const sandboxAiBodyDisabled = sandboxAiBusy || !editorBody.trim();

  const editorSaveStatus = resolveSandboxEditorSaveStatus({
    isDirty,
    isSaving,
    saveError: saveDraftError,
    lastSavedAt,
  });

  const menubarMenus = [
    {
      key: 'file',
      label: 'File',
      items: [
        ...(isArchived
          ? [
              {
                key: 'unarchive',
                label: isUnarchiving ? 'Restoring…' : 'Unarchive',
                icon: ArchiveRestore,
                onClick: () => {
                  void Promise.resolve(onUnarchiveDraft?.());
                },
                disabled: unarchiveDisabled,
              },
            ]
          : [
              {
                key: 'publish',
                label: publishLabel,
                onClick: () => openStatusChangeModal(isPublished ? 'unpublish' : 'publish'),
                disabled: publishDisabled,
              },
              {
                key: 'archive',
                label: isArchiving ? 'Archiving…' : 'Archive',
                icon: Archive,
                onClick: () => setArchiveModalOpen(true),
                disabled: archiveDisabled,
              },
            ]),
        {
          key: 'delete',
          label: isDeleting ? 'Deleting…' : 'Delete permanently',
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
          key: 'finish-content',
          label: isFinishingContent ? 'Finishing…' : 'Finish Content',
          icon: PenLine,
          onClick: () => onFinishContent?.(),
          disabled: sandboxAiBodyDisabled || !onFinishContent,
        },
        {
          key: 'lengthen-content',
          label: isLengtheningContent ? 'Lengthening…' : 'Lengthen Content',
          icon: AlignLeft,
          onClick: () => onLengthenContent?.(),
          disabled: sandboxAiBodyDisabled || !onLengthenContent,
        },
        {
          key: 'format-post',
          label: isFormattingContent ? 'Formatting…' : 'Format Post',
          icon: ListTree,
          onClick: () => onFormatPost?.(),
          disabled: sandboxAiBodyDisabled || !onFormatPost,
        },
        {
          key: 'generate-asset-prompts',
          label: isGeneratingAssets ? 'Generating…' : 'Generate Asset Prompts',
          icon: Sparkles,
          onClick: onGenerateAssetPrompts,
          disabled: sandboxAiBodyDisabled,
        },
        {
          key: 'inject-images',
          label: isInjectingImages ? 'Injecting images…' : 'Inject Images',
          icon: ImageIcon,
          onClick: () => onInjectImages?.(),
          disabled: sandboxAiBodyDisabled || !onInjectImages,
        },
        ...(showOptimizeKeywords
          ? [
              {
                key: 'optimize-keywords',
                label: isOptimizingKeywords ? 'Optimizing…' : 'Optimize Keywords',
                icon: Search,
                onClick: () => onOptimizeKeywords?.(),
                disabled: sandboxAiBusy || !editorBody.trim() || !activeDraftId,
              },
            ]
          : []),
      ],
    },
    {
      key: 'settings',
      label: 'Settings',
      items: [
        {
          key: 'draft-settings',
          label: 'Draft settings',
          icon: SlidersHorizontal,
          badge: CONTENT_TYPE_LABELS[contentType],
          onClick: () => setDraftSettingsModalOpen(true),
        },
        {
          key: 'brand-pillars',
          label: 'Brand Pillars',
          badge: draftPillars.length,
          onClick: () => setBrandPillarsModalOpen(true),
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        'grid h-full min-h-0 gap-3 lg:gap-6',
        drawerOpen ? pbSidebarTwoColumnColsClassName : 'lg:grid-cols-1'
      )}
    >
      <h2 className="sr-only">Sandbox Workspace</h2>
      {aiToolLiveMessage ? (
        <span className="sr-only" role="status" aria-live="polite">
          {aiToolLiveMessage}
        </span>
      ) : null}
      {drawerOpen ? (
        <SidebarCard
          className={cn(
            'flex flex-col overflow-hidden p-3 lg:h-full lg:min-h-0 lg:p-4',
            pbSidebarMobileMaxHeightClassName
          )}
        >
          <ContentLibraryPanel
            contentNodes={contentNodes}
            activeDraftId={activeDraftId}
            onSelect={onLoadDraft}
            onNewDraft={onNewDraft}
            density="compact"
            showArchived={showArchivedContent}
            onShowArchivedChange={onShowArchivedChange}
            loadError={contentLoadError}
            onRetry={onRetryContentLoad}
          />
        </SidebarCard>
      ) : null}

      <PageCard className="relative flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden p-4 sm:gap-3 sm:p-6">
        <PanelToggleHandle
          collapsed={!drawerOpen}
          onToggle={onToggleDrawer}
          className="absolute left-2 top-4 z-20"
        />

        <Menubar menus={menubarMenus} ariaLabel="Content workbench actions" className="shrink-0" />

        <div className="shrink-0 border-b border-gray-200 pb-2 dark:border-gray-700 lg:pb-3">
          <div
            role="toolbar"
            aria-label="Draft actions"
            className="flex items-center gap-2 lg:gap-3"
          >
            <input
              value={editorTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled draft"
              aria-label="Draft title"
              className={cn('min-w-0 w-full flex-1', pbDraftTitleInputClassName)}
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

        {keywordOptimizeError ? (
          <p className={cn('shrink-0', pbFeedbackTextClassName('warning'))} role="status">
            {keywordOptimizeError}
          </p>
        ) : null}

        {imageInjectError ? (
          <p className={cn('shrink-0', pbFeedbackTextClassName('danger'))} role="alert">
            {imageInjectError}
          </p>
        ) : null}

        {imageInjectClientCancelState === 'cancelled' ? (
          <p className="shrink-0 text-sm text-gray-700 dark:text-gray-300" role="status">
            <span className="font-medium">Image injection cancelled.</span>{' '}
            {CLIENT_JOB_CANCELLED_LABEL}
          </p>
        ) : isInjectingImages ? (
          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center gap-2',
              pbFeedbackTextClassName('muted')
            )}
          >
            <span role="status">{imageInjectMessage ?? 'Injecting images…'}</span>
            {onCancelImageInject ? (
              <Button type="button" size="sm" variant="secondary" onClick={onCancelImageInject}>
                Cancel
              </Button>
            ) : null}
          </div>
        ) : null}

        {keywordOptimizeClientCancelState === 'cancelled' ? (
          <p className="shrink-0 text-sm text-gray-700 dark:text-gray-300" role="status">
            <span className="font-medium">Keyword optimization cancelled.</span>{' '}
            {CLIENT_JOB_CANCELLED_LABEL}
          </p>
        ) : isOptimizingKeywords ? (
          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center gap-2',
              pbFeedbackTextClassName('muted')
            )}
          >
            <span role="status">Optimizing keywords…</span>
            {onCancelKeywordOptimize ? (
              <Button type="button" size="sm" variant="secondary" onClick={onCancelKeywordOptimize}>
                Cancel
              </Button>
            ) : null}
          </div>
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
            previewPlatform={draftPlatform}
            autosaveStatus={editorSaveStatus.status}
            autosaveLastSavedAt={editorSaveStatus.lastSavedAt}
            autosaveErrorMessage={editorSaveStatus.errorMessage}
          />
        </div>

        {assetPrompts ? (
          <PageCard
            className={cn(
              pbAssetPanelMaxHeightClassName,
              'shrink-0 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/50'
            )}
          >
            <h3 className={pbBannerTitleClassName}>Asset prompts</h3>
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

      <DraftSettingsModal
        isOpen={draftSettingsModalOpen}
        onClose={() => setDraftSettingsModalOpen(false)}
        contentType={contentType}
        onContentTypeChange={onContentTypeChange}
        draftPlatform={draftPlatform}
        onDraftPlatformChange={onDraftPlatformChange}
        draftCanonicalUrl={draftCanonicalUrl}
        onDraftCanonicalUrlChange={onDraftCanonicalUrlChange}
        isSaving={isSaving}
      />

      <ContentStatusChangeModal
        isOpen={statusChangeModal !== null}
        mode={statusChangeModal ?? 'publish'}
        contentTitle={draftLabel}
        wordCount={publishStats.wordCount}
        readingTimeMinutes={publishStats.readingTimeMinutes}
        initialPlatform={draftPlatform}
        initialCanonicalUrl={draftCanonicalUrl}
        serverFieldErrors={publishFieldErrors}
        isPending={statusChangePending}
        onClose={closeStatusChangeModal}
        onConfirm={handleStatusChangeConfirm}
      />

      <Dialog
        isOpen={brandPillarsModalOpen}
        onClose={() => setBrandPillarsModalOpen(false)}
        title="Brand pillars"
        size="md"
        trapFocus
        footer={
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setBrandPillarsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        }
      >
        <BrandPillarMultiSelect
          options={brandPillarOptions}
          value={draftPillars}
          onChange={onDraftPillarsChange}
          disabled={isSaving || isPublishing || isUnpublishing}
        />
      </Dialog>

      <Dialog
        isOpen={archiveModalOpen}
        onClose={() => {
          if (!isArchiving) setArchiveModalOpen(false);
        }}
        title="Archive content?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Archive <span className="font-medium text-gray-900 dark:text-white">{draftLabel}</span>?
            It will be hidden from your default library but kept for history. You can restore it
            from Show archived.
          </p>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setArchiveModalOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void Promise.resolve(onArchiveDraft?.()).then(() => {
                  setArchiveModalOpen(false);
                });
              }}
              disabled={isArchiving}
            >
              {isArchiving ? 'Archiving…' : 'Archive'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) setDeleteModalOpen(false);
        }}
        title="Delete permanently?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Permanently delete{' '}
            <span className="font-medium text-gray-900 dark:text-white">{draftLabel}</span>? This
            removes the content node and cannot be undone. To hide it while keeping history, use
            Archive instead.
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
                'Delete permanently'
              )}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
