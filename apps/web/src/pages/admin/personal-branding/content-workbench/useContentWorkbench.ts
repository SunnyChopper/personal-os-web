import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useContentIdeaApproveJob } from '@/hooks/useContentIdeaApproveJob';
import { useContentIdeationJob } from '@/hooks/useContentIdeationJob';
import { useContentImageInjectJob } from '@/hooks/useContentImageInjectJob';
import { useKeywordOptimizationJob } from '@/hooks/useKeywordOptimizationJob';
import { useIdeationEngineAIModelPicker } from '@/hooks/personal-branding/useIdeationEngineAIModelPicker';
import {
  consumeIgnoredTerminalJob,
  markJobCancelled,
  type ClientJobCancelState,
} from '@/lib/personal-branding/client-job-cancel';
import { contentIdeationJobInProgress } from '@/lib/personal-branding/content-ideation-progress';
import { personalBrandingJobFailureMessage } from '@/lib/personal-branding/content-ideation-progress';
import { reportPersonalBrandingJobFailure } from '@/lib/personal-branding/report-job-failure';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  AssetPromptsResult,
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaApproveJob,
  ContentIdeaGenerationContextStats,
  ContentIdeationJob,
  ContentImageInjectJob,
  ContentKeywordOptimizationJob,
  ContentNode,
  ContentStatus,
  ContentType,
} from '@/types/api/personal-branding.dto';
import type { ApproveIdeaGenerateRequest } from './ApproveIdeaGenerateModal';
import type { NewDraftAiRequest, NewDraftTemplateResult } from './NewDraftWizardModal';
import type { PublishContentMetadata } from './ContentStatusChangeModal';
import {
  announceLiveMessage,
  collectActiveBrandPillars,
  CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE,
  formatNewIdeasReadyMessage,
  getApproveJobDraft,
  isBrandProfileReadyForIdeation,
  selectTrendIdeas,
} from './content-workbench-helpers';
import { selectSandboxContentNodes } from './select-sandbox-content-nodes';
import { layoutTemplateForContentType } from './content-workbench-templates';
import { UNTITLED_DRAFT_LABEL } from './content-workbench-constants';

function isUntitledTitle(title: string): boolean {
  const trimmed = title.trim();
  return (
    trimmed.length === 0 ||
    trimmed.toLowerCase() === UNTITLED_DRAFT_LABEL.toLowerCase() ||
    trimmed.toLowerCase() === 'untitled'
  );
}

export function useContentWorkbench() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() => searchParams.get('tab') ?? 'sandbox');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeContentStatus, setActiveContentStatus] = useState<ContentStatus | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBody, setEditorBody] = useState('');
  const [contentType, setContentType] = useState<ContentType>('DEEP_DIVE_BLOG');
  const [draftPlatform, setDraftPlatform] = useState<BrandPlatform | null>(null);
  const [draftCanonicalUrl, setDraftCanonicalUrl] = useState('');
  const [draftPillars, setDraftPillars] = useState<string[]>([]);
  const [assetPrompts, setAssetPrompts] = useState<AssetPromptsResult | null>(null);
  const [rejectingIdea, setRejectingIdea] = useState<ContentIdea | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<BrandPlatform>('linkedin');
  const [seedIdeas, setSeedIdeas] = useState('');
  const [boostFromRecentPublishes, setBoostFromRecentPublishes] = useState(true);
  const [enableImageSearch, setEnableImageSearch] = useState(false);
  const [vaultEnableImageSearch, setVaultEnableImageSearch] = useState(false);
  const [enableKeywordResearch, setEnableKeywordResearch] = useState(false);
  const [ideaCount, setIdeaCount] = useState(6);
  const {
    catalog: ideationModelCatalog,
    isCatalogLoading: isIdeationModelCatalogLoading,
    picker: ideationModelPicker,
    setPicker: setIdeationModelPicker,
    resolveApiModel: resolveIdeationApiModel,
  } = useIdeationEngineAIModelPicker();
  const [selectedVaultItemIds, setSelectedVaultItemIds] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [vaultGenerateError, setVaultGenerateError] = useState<string | null>(null);
  const [ideationJobId, setIdeationJobId] = useState<string | null>(null);
  const [imageInjectJobId, setImageInjectJobId] = useState<string | null>(null);
  const [imageInjectError, setImageInjectError] = useState<string | null>(null);
  const [keywordOptimizeJobId, setKeywordOptimizeJobId] = useState<string | null>(null);
  const [keywordOptimizeError, setKeywordOptimizeError] = useState<string | null>(null);
  const [vaultJobId, setVaultJobId] = useState<string | null>(null);
  const [lastGenerationStats, setLastGenerationStats] =
    useState<ContentIdeaGenerationContextStats | null>(null);
  const [lastVaultGenerationStats, setLastVaultGenerationStats] =
    useState<ContentIdeaGenerationContextStats | null>(null);
  const [vaultItemLabels, setVaultItemLabels] = useState<Record<string, string>>({});
  const [newDraftWizardOpen, setNewDraftWizardOpen] = useState(false);
  const [titlePromptOpen, setTitlePromptOpen] = useState(false);
  const [approvingIdea, setApprovingIdea] = useState<ContentIdea | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveJobId, setApproveJobId] = useState<string | null>(null);
  const [approveJobIdeaId, setApproveJobIdeaId] = useState<string | null>(null);
  const [ideationClientCancelState, setIdeationClientCancelState] =
    useState<ClientJobCancelState>('idle');
  const [vaultClientCancelState, setVaultClientCancelState] =
    useState<ClientJobCancelState>('idle');
  const [approveClientCancelState, setApproveClientCancelState] =
    useState<ClientJobCancelState>('idle');
  const [imageInjectClientCancelState, setImageInjectClientCancelState] =
    useState<ClientJobCancelState>('idle');
  const [keywordOptimizeClientCancelState, setKeywordOptimizeClientCancelState] =
    useState<ClientJobCancelState>('idle');
  const [ideationLiveMessage, setIdeationLiveMessage] = useState<string | null>(null);
  const [vaultLiveMessage, setVaultLiveMessage] = useState<string | null>(null);
  const [aiToolLiveMessage, setAiToolLiveMessage] = useState<string | null>(null);
  const [showArchivedContent, setShowArchivedContent] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const ignoredTerminalJobIdsRef = useRef<Set<string>>(new Set());

  const contentQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100, undefined, true),
    queryFn: () =>
      personalBrandingService.listContentNodes(1, 100, undefined, {
        includeSkipped: true,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
  });

  const draftedIdeasQ = useQuery({
    queryKey: queryKeys.personalBranding.ideas.list(1, 50, 'DRAFTED'),
    queryFn: () => personalBrandingService.listContentIdeas(1, 50, 'DRAFTED'),
    enabled: activeTab === 'trend-ideas',
  });

  const ideasQ = useQuery({
    queryKey: queryKeys.personalBranding.ideas.list(1, 50, 'GENERATED'),
    queryFn: () => personalBrandingService.listContentIdeas(1, 50, 'GENERATED'),
  });

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 50),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 50);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  const brandProfiles: BrandProfile[] = profilesQ.data?.data ?? [];
  const brandPillarOptions = useMemo(
    () => collectActiveBrandPillars(brandProfiles),
    [brandProfiles]
  );

  const contentNodes = useMemo(
    () => selectSandboxContentNodes(contentQ.data, showArchivedContent ? 'archived' : 'active'),
    [contentQ.data, showArchivedContent]
  );

  const trendIdeasQ = useMemo(
    () => ({
      isPending: ideasQ.isPending || (activeTab === 'trend-ideas' && draftedIdeasQ.isPending),
    }),
    [activeTab, draftedIdeasQ.isPending, ideasQ.isPending]
  );

  const ideas = ideasQ.data?.data ?? [];

  const ideationIdeas = useMemo(
    () =>
      ideas.filter(
        (idea) => idea.sourceType !== 'VAULT_EXTRACTED' && idea.sourceType !== 'RADAR_INGESTED'
      ),
    [ideas]
  );

  const vaultIdeas = useMemo(
    () => ideas.filter((idea) => idea.sourceType === 'VAULT_EXTRACTED'),
    [ideas]
  );

  const trendIdeas = useMemo(
    () => selectTrendIdeas(ideas, draftedIdeasQ.data?.data ?? []),
    [draftedIdeasQ.data?.data, ideas]
  );

  const sandboxBodyEditInput = useCallback(
    () => ({
      title: editorTitle.trim() || UNTITLED_DRAFT_LABEL,
      body: editorBody,
      contentType,
      platform: draftPlatform ?? undefined,
      ...(draftPillars.length > 0 ? { pillars: draftPillars } : {}),
      ...(selectedProfileId ? { brandProfileId: selectedProfileId } : {}),
    }),
    [contentType, draftPillars, draftPlatform, editorBody, editorTitle, selectedProfileId]
  );

  const loadDraft = useCallback((node: ContentNode | null | undefined) => {
    // Guard: sync approve onSuccess used to call loadDraft(result.draft) after the
    // API moved to 202 job-start (no draft) → TypeError reading 'id' (bbc5bae966c5).
    if (!node?.id) return;
    setActiveDraftId(node.id);
    setActiveContentStatus(node.status);
    setEditorTitle(node.title);
    setEditorBody(node.body ?? '');
    setContentType(node.contentType ?? 'DEEP_DIVE_BLOG');
    setDraftPlatform(node.platform ?? null);
    setDraftCanonicalUrl(node.canonicalUrl ?? '');
    setDraftPillars(node.pillars ?? []);
    setAssetPrompts((node.assetPrompts as AssetPromptsResult | null) ?? null);
    setIsDirty(false);
    const parsedUpdatedAt = Date.parse(node.updatedAt ?? '');
    setLastSavedAt(Number.isFinite(parsedUpdatedAt) ? parsedUpdatedAt : null);
  }, []);

  const openDraftFromIdea = useCallback(
    (idea: ContentIdea) => {
      const draftNodeId = idea.draftNodeId;
      if (!draftNodeId) return;
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'sandbox');
      next.set('contentId', draftNodeId);
      setSearchParams(next, { replace: true });
      setActiveTabState('sandbox');
      const fromList = contentNodes.find((n) => n.id === draftNodeId);
      if (fromList) {
        loadDraft(fromList);
        return;
      }
      void personalBrandingService.getContentNode(draftNodeId).then(loadDraft);
    },
    [contentNodes, loadDraft, searchParams, setSearchParams]
  );

  const openDraftFromLibrary = useCallback(
    (node: ContentNode) => {
      if (!node?.id) return;
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'sandbox');
      next.set('contentId', node.id);
      setSearchParams(next, { replace: true });
      setActiveTabState('sandbox');
      const fromList = contentNodes.find((n) => n.id === node.id);
      if (fromList) {
        loadDraft(fromList);
        return;
      }
      void personalBrandingService.getContentNode(node.id).then(loadDraft);
    },
    [contentNodes, loadDraft, searchParams, setSearchParams]
  );

  const setActiveTab = useCallback(
    (tabId: string) => {
      setActiveTabState(tabId);
      const next = new URLSearchParams(searchParams);
      next.set('tab', tabId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const urlContentId = searchParams.get('contentId');

  useEffect(() => {
    if (activeDraftId || contentNodes.length === 0) return;
    loadDraft(contentNodes[0]);
  }, [activeDraftId, contentNodes, loadDraft]);

  useEffect(() => {
    if (selectedProfileId || brandProfiles.length === 0) return;
    const ready = brandProfiles.find((p) => isBrandProfileReadyForIdeation(p));
    setSelectedProfileId((ready ?? brandProfiles[0]).id);
  }, [brandProfiles, selectedProfileId]);

  useEffect(() => {
    if (!urlContentId) return;
    const fromList = contentNodes.find((n) => n.id === urlContentId);
    if (fromList) {
      loadDraft(fromList);
      if (searchParams.get('tab')) setActiveTabState(searchParams.get('tab') ?? 'sandbox');
      return;
    }
    void personalBrandingService.getContentNode(urlContentId).then((node) => {
      loadDraft(node);
      if (searchParams.get('tab')) setActiveTabState(searchParams.get('tab') ?? 'sandbox');
    });
  }, [urlContentId, contentNodes, loadDraft, searchParams]);

  const invalidateWorkbench = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.ideas.all() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.rejectedFeedback.all(),
      }),
    ]);
  }, [queryClient]);

  const saveDraftMutation = useMutation({
    mutationFn: async (options?: { title?: string }) => {
      const resolvedTitle = options?.title ?? (editorTitle.trim() || UNTITLED_DRAFT_LABEL);
      const body = {
        title: resolvedTitle,
        body: editorBody,
        contentType,
        platform: draftPlatform,
        canonicalUrl: draftCanonicalUrl.trim() || null,
        pillars: draftPillars,
      };
      if (activeDraftId) {
        return personalBrandingService.updateContentNode(activeDraftId, body);
      }
      return personalBrandingService.createContentNode({ ...body, status: 'DRAFT' });
    },
    onSuccess: (node, variables) => {
      setActiveDraftId(node.id);
      setActiveContentStatus(node.status);
      if (variables?.title) {
        setEditorTitle(variables.title);
      } else if (!editorTitle.trim()) {
        setEditorTitle(node.title);
      }
      setIsDirty(false);
      setTitlePromptOpen(false);
      setLastSavedAt(Date.now());
      void invalidateWorkbench();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (metadata: PublishContentMetadata) => {
      const publishBody = {
        status: 'PUBLISHED' as const,
        platform: metadata.platform,
        canonicalUrl: metadata.canonicalUrl,
      };
      if (!activeDraftId) {
        const saved = await saveDraftMutation.mutateAsync(undefined);
        return personalBrandingService.updateContentNode(saved.id, publishBody);
      }
      return personalBrandingService.updateContentNode(activeDraftId, publishBody);
    },
    onSuccess: (_node, metadata) => {
      setActiveContentStatus('PUBLISHED');
      setDraftPlatform(metadata.platform);
      setDraftCanonicalUrl(metadata.canonicalUrl);
      setIsDirty(false);
      void invalidateWorkbench();
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      if (!activeDraftId) {
        throw new Error('No content selected');
      }
      return personalBrandingService.updateContentNode(activeDraftId, { status: 'DRAFT' });
    },
    onSuccess: () => {
      setActiveContentStatus('DRAFT');
      void invalidateWorkbench();
    },
  });

  const handleImageInjectJobTerminal = useCallback(
    (job: ContentImageInjectJob) => {
      if (job.status === 'succeeded' && job.result) {
        setEditorBody(job.result.body);
        setIsDirty(false);
        setImageInjectError(null);
        setImageInjectJobId(null);
        void invalidateWorkbench();
        return;
      }
      if (job.status === 'failed') {
        reportPersonalBrandingJobFailure({
          feature: 'contentImageInject',
          jobId: job.jobId,
          error: job.error,
          message: job.message,
          errorCode: job.errorCode,
          retryable: job.retryable,
        });
        setImageInjectError(
          personalBrandingJobFailureMessage(job, 'Failed to inject images')
        );
        setImageInjectJobId(null);
      }
    },
    [invalidateWorkbench]
  );

  const imageInjectJobQuery = useContentImageInjectJob(
    imageInjectJobId,
    handleImageInjectJobTerminal,
    () => {
      setImageInjectError('Image injection is taking longer than expected. Try again in a moment.');
      setImageInjectJobId(null);
    }
  );

  const injectImagesMutation = useMutation({
    mutationFn: (input: {
      title: string;
      body: string;
      contentId?: string;
      contentType?: ContentType;
    }) =>
      personalBrandingService.injectContentImages({
        title: input.title,
        body: input.body,
        contentId: input.contentId ?? null,
        contentType: input.contentType ?? null,
      }),
    onMutate: () => setImageInjectError(null),
    onSuccess: (start) => {
      setImageInjectJobId(start.jobId);
    },
    onError: (err: Error) => setImageInjectError(err.message),
  });

  const handleKeywordOptimizeJobTerminal = useCallback(
    (job: ContentKeywordOptimizationJob) => {
      if (job.status === 'succeeded' && job.result?.applied) {
        if (job.result.title) setEditorTitle(job.result.title);
        if (job.result.body) setEditorBody(job.result.body);
        setIsDirty(false);
        setKeywordOptimizeError(job.result.warning ?? job.warning ?? null);
        setKeywordOptimizeJobId(null);
        void invalidateWorkbench();
        return;
      }
      if (job.status === 'succeeded') {
        setKeywordOptimizeError(
          job.result?.warning ?? job.warning ?? 'Keywords were not applied to this draft.'
        );
        setKeywordOptimizeJobId(null);
        return;
      }
      if (job.status === 'failed') {
        reportPersonalBrandingJobFailure({
          feature: 'contentKeywordOptimize',
          jobId: job.jobId,
          error: job.error,
          message: job.message,
          errorCode: job.errorCode,
          retryable: job.retryable,
        });
        setKeywordOptimizeError(
          personalBrandingJobFailureMessage(job, 'Keyword optimization failed')
        );
        setKeywordOptimizeJobId(null);
      }
    },
    [invalidateWorkbench]
  );

  const keywordOptimizeJobQuery = useKeywordOptimizationJob(
    activeDraftId,
    keywordOptimizeJobId,
    handleKeywordOptimizeJobTerminal,
    () => {
      setKeywordOptimizeError('Keyword optimization is taking longer than expected.');
      setKeywordOptimizeJobId(null);
    }
  );

  const optimizeKeywordsMutation = useMutation({
    mutationFn: async () => {
      if (!activeDraftId) throw new Error('Save the draft before optimizing keywords');
      if (isDirty) {
        await personalBrandingService.updateContentNode(activeDraftId, {
          title: editorTitle,
          body: editorBody,
        });
        setIsDirty(false);
      }
      return personalBrandingService.startKeywordOptimizationJob(activeDraftId);
    },
    onMutate: () => setKeywordOptimizeError(null),
    onSuccess: (start) => setKeywordOptimizeJobId(start.jobId),
    onError: (err: Error) => setKeywordOptimizeError(err.message),
  });

  const handleApproveJobTerminal = useCallback(
    (job: ContentIdeaApproveJob) => {
      if (job.status === 'succeeded') {
        const draft = getApproveJobDraft(job);
        if (!draft) {
          setApproveError('Draft generation finished without a draft payload. Retry the idea.');
          setApproveJobId(null);
          setApproveJobIdeaId(null);
          return;
        }
        const idea = job.result?.idea;
        setApprovingIdea(null);
        setApproveJobId(null);
        setApproveJobIdeaId(null);
        setApproveError(null);
        loadDraft(draft);
        setActiveTab('sandbox');
        void invalidateWorkbench();
        if (idea?.enableImageSearch) {
          injectImagesMutation.mutate({
            title: draft.title,
            body: draft.body ?? '',
            contentId: draft.id,
            contentType: draft.contentType ?? undefined,
          });
        }
        return;
      }
      if (job.status === 'failed') {
        reportPersonalBrandingJobFailure({
          feature: 'contentIdeaApprove',
          jobId: job.jobId,
          error: job.error,
          message: job.message,
          errorCode: job.errorCode,
          retryable: job.retryable,
        });
        setApproveError(
          personalBrandingJobFailureMessage(job, 'Failed to generate draft')
        );
        setApproveJobId(null);
        setApproveJobIdeaId(null);
      }
    },
    [invalidateWorkbench, injectImagesMutation.mutate, loadDraft, setActiveTab]
  );

  useContentIdeaApproveJob(approveJobIdeaId, approveJobId, handleApproveJobTerminal, () => {
    if (approveJobId) {
      reportPersonalBrandingJobFailure({
        feature: 'contentIdeaApprove',
        jobId: approveJobId,
        error: 'Client poll stopped after 300000ms without terminal status',
        stage: 'client_timeout',
      });
    }
    setApproveError('Draft generation is taking longer than expected.');
    setApproveJobId(null);
    setApproveJobIdeaId(null);
  });

  const approveIdeaMutation = useMutation({
    mutationKey: ['personalBranding', 'contentIdea', 'approve'],
    mutationFn: (request: ApproveIdeaGenerateRequest) =>
      personalBrandingService.approveContentIdea(request.ideaId, {
        brandProfileId: request.brandProfileId,
        templateId: request.templateId,
        platform: request.platform,
        pillars: request.pillars,
      }),
    onMutate: () => setApproveError(null),
    onSuccess: (start, request) => {
      setApproveJobIdeaId(request.ideaId);
      setApproveJobId(start.jobId);
    },
    onError: (err: Error) => setApproveError(err.message),
  });

  const isApprovingIdea = approveIdeaMutation.isPending || Boolean(approveJobId);

  const approvingIdeaId =
    approveJobIdeaId ??
    (approveIdeaMutation.isPending ? (approveIdeaMutation.variables?.ideaId ?? null) : null);

  const handleIdeationJobTerminal = useCallback(
    (job: ContentIdeationJob) => {
      if (consumeIgnoredTerminalJob(ignoredTerminalJobIdsRef.current, job.jobId)) {
        setIdeationJobId(null);
        setIdeationClientCancelState('idle');
        return;
      }
      if (job.status === 'succeeded' && job.result) {
        setLastGenerationStats(job.result.contextStats);
        announceLiveMessage(
          setIdeationLiveMessage,
          formatNewIdeasReadyMessage(job.result.ideas.length)
        );
        void invalidateWorkbench();
        setIdeationJobId(null);
        setIdeationClientCancelState('idle');
        return;
      }
      if (job.status === 'failed') {
        setGenerateError(
          personalBrandingJobFailureMessage(job, 'Failed to generate content ideas')
        );
        setIdeationJobId(null);
      }
    },
    [invalidateWorkbench]
  );

  const handleVaultJobTerminal = useCallback(
    (job: ContentIdeationJob) => {
      if (consumeIgnoredTerminalJob(ignoredTerminalJobIdsRef.current, job.jobId)) {
        setVaultJobId(null);
        setVaultClientCancelState('idle');
        return;
      }
      if (job.status === 'succeeded' && job.result) {
        setLastVaultGenerationStats(job.result.contextStats);
        announceLiveMessage(
          setVaultLiveMessage,
          formatNewIdeasReadyMessage(job.result.ideas.length)
        );
        void invalidateWorkbench();
        setVaultJobId(null);
        setVaultClientCancelState('idle');
        return;
      }
      if (job.status === 'failed') {
        setVaultGenerateError(
          personalBrandingJobFailureMessage(job, 'Failed to generate vault content ideas')
        );
        setVaultJobId(null);
      }
    },
    [invalidateWorkbench]
  );

  const ideationJobQuery = useContentIdeationJob(ideationJobId, handleIdeationJobTerminal, () => {
    setGenerateError('Generation is taking longer than expected. Try again in a moment.');
    setIdeationJobId(null);
    void invalidateWorkbench();
  });

  const vaultJobQuery = useContentIdeationJob(vaultJobId, handleVaultJobTerminal, () => {
    setVaultGenerateError('Generation is taking longer than expected. Try again in a moment.');
    setVaultJobId(null);
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfileId) {
        throw new Error('Select a brand profile first');
      }
      return personalBrandingService.generateContentIdeas({
        brandProfileId: selectedProfileId,
        targetPlatform,
        seedIdeas: seedIdeas.trim() || null,
        boostFromRecentPublishes,
        count: ideaCount,
        enableImageSearch,
        enableKeywordResearch: targetPlatform === 'medium' ? false : enableKeywordResearch,
        ...(resolveIdeationApiModel() ? { model: resolveIdeationApiModel() } : {}),
      });
    },
    onMutate: () => {
      setGenerateError(null);
      setIdeationJobId(null);
    },
    onSuccess: (start) => {
      setIdeationJobId(start.jobId);
      if (start.countEffective != null && start.countEffective !== ideaCount) {
        setIdeaCount(start.countEffective);
      }
      if (start.countAdjustmentWarning) {
        showToast({ type: 'warning', title: start.countAdjustmentWarning });
      }
    },
    onError: (err: Error) => setGenerateError(err.message),
  });

  const handleTargetPlatformChange = useCallback((platform: BrandPlatform) => {
    setTargetPlatform(platform);
    if (platform === 'medium') {
      setEnableKeywordResearch(false);
    }
  }, []);

  const generateVaultIdeasMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfileId) {
        throw new Error('Select a brand profile first');
      }
      if (selectedVaultItemIds.length === 0) {
        throw new Error('Select at least one Knowledge Vault item');
      }
      return personalBrandingService.generateVaultExtractedIdeas({
        brandProfileId: selectedProfileId,
        vaultItemIds: selectedVaultItemIds,
        targetPlatform,
        enableImageSearch: vaultEnableImageSearch,
      });
    },
    onMutate: () => {
      setVaultGenerateError(null);
      setVaultJobId(null);
    },
    onSuccess: (start) => {
      setVaultJobId(start.jobId);
      if (start.countAdjustmentWarning) {
        showToast({ type: 'warning', title: start.countAdjustmentWarning });
      }
    },
    onError: (err: Error) => setVaultGenerateError(err.message),
  });

  const rejectIdeaMutation = useMutation({
    mutationFn: ({
      ideaId,
      feedbackText,
      feedbackCategory,
    }: {
      ideaId: string;
      feedbackText: string | null;
      feedbackCategory?: string | null;
    }) =>
      personalBrandingService.rejectContentIdea(ideaId, {
        feedbackText: feedbackText ?? undefined,
        feedbackCategory: feedbackCategory ?? undefined,
      }),
    onSuccess: () => {
      setRejectingIdea(null);
      void invalidateWorkbench();
    },
  });

  const assetPromptsMutation = useMutation({
    mutationFn: () =>
      personalBrandingService.generateAssetPrompts({
        title: editorTitle.trim() || UNTITLED_DRAFT_LABEL,
        body: editorBody,
        contentType,
      }),
    onSuccess: async (result) => {
      setAssetPrompts(result);
      if (activeDraftId) {
        await personalBrandingService.updateContentNode(activeDraftId, {
          assetPrompts: result as unknown as Record<string, unknown>,
        });
        void invalidateWorkbench();
      }
    },
  });

  const generateDraftMutation = useMutation({
    mutationFn: (request: NewDraftAiRequest) =>
      personalBrandingService.generateDraft({
        topic: request.topic,
        contentType: request.contentType,
        platform: request.platform,
        brandProfileId: request.brandProfileId,
        templateId: request.templateId,
      }),
    onSuccess: (result, request) => {
      setActiveDraftId(null);
      setActiveContentStatus(null);
      setContentType(request.contentType);
      setDraftPlatform(request.platform);
      setDraftPillars(request.pillars ?? []);
      setEditorTitle(result.title);
      setEditorBody(result.body);
      setAssetPrompts(null);
      setIsDirty(true);
      setNewDraftWizardOpen(false);
      const next = new URLSearchParams(searchParams);
      next.delete('contentId');
      setSearchParams(next, { replace: true });
    },
  });

  const handleEditorBodyChange = (value: string) => {
    setEditorBody(value);
    setIsDirty(true);
  };

  const openNewDraftWizard = () => {
    setNewDraftWizardOpen(true);
  };

  const closeNewDraftWizard = () => {
    if (generateDraftMutation.isPending) return;
    setNewDraftWizardOpen(false);
  };

  const clearContentIdFromUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('contentId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const startFromTemplate = (result: NewDraftTemplateResult) => {
    setActiveDraftId(null);
    setContentType(result.contentType);
    setDraftPlatform(result.platform ?? null);
    setDraftPillars(result.pillars ?? []);
    setEditorTitle(result.title);
    setEditorBody(layoutTemplateForContentType(result.contentType));
    setAssetPrompts(null);
    setIsDirty(true);
    setNewDraftWizardOpen(false);
    clearContentIdFromUrl();
  };

  const requestSaveDraft = () => {
    if (isUntitledTitle(editorTitle)) {
      setTitlePromptOpen(true);
      return;
    }
    saveDraftMutation.mutate(undefined);
  };

  const saveWithResolvedTitle = (title: string) => {
    setEditorTitle(title);
    saveDraftMutation.mutate({ title });
  };

  const keepUntitledAndSave = () => {
    saveDraftMutation.mutate({ title: UNTITLED_DRAFT_LABEL });
  };

  const startNewDraft = useCallback(() => {
    setActiveDraftId(null);
    setActiveContentStatus(null);
    setEditorTitle('');
    setEditorBody('');
    setDraftPlatform(null);
    setDraftCanonicalUrl('');
    setDraftPillars([]);
    setAssetPrompts(null);
    setIsDirty(false);
    const next = new URLSearchParams(searchParams);
    next.delete('contentId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const deleteDraftMutation = useMutation({
    mutationFn: (contentId: string) => personalBrandingService.deleteContentNode(contentId),
    onSuccess: async (_void, deletedId) => {
      await invalidateWorkbench();
      if (activeDraftId === deletedId) {
        startNewDraft();
      }
    },
  });

  const archiveDraftMutation = useMutation({
    mutationFn: (contentId: string) =>
      personalBrandingService.updateContentNode(contentId, { status: 'SKIPPED' }),
    onSuccess: async (_node, archivedId) => {
      await invalidateWorkbench();
      if (activeDraftId === archivedId) {
        startNewDraft();
      }
    },
  });

  const unarchiveDraftMutation = useMutation({
    mutationFn: (contentId: string) =>
      personalBrandingService.updateContentNode(contentId, { status: 'DRAFT' }),
    onSuccess: async (node) => {
      setShowArchivedContent(false);
      setActiveContentStatus('DRAFT');
      loadDraft(node);
      await invalidateWorkbench();
    },
  });

  const finishContentMutation = useMutation({
    mutationFn: () => personalBrandingService.finishContent(sandboxBodyEditInput()),
    onSuccess: (result) => {
      setEditorBody(result.body);
      setIsDirty(true);
      announceLiveMessage(setAiToolLiveMessage, CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE);
    },
  });

  const lengthenContentMutation = useMutation({
    mutationFn: () => personalBrandingService.lengthenContent(sandboxBodyEditInput()),
    onSuccess: (result) => {
      setEditorBody(result.body);
      setIsDirty(true);
      announceLiveMessage(setAiToolLiveMessage, CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE);
    },
  });

  const formatContentMutation = useMutation({
    mutationFn: () => personalBrandingService.formatContent(sandboxBodyEditInput()),
    onSuccess: (result) => {
      setEditorBody(result.body);
      setIsDirty(true);
      announceLiveMessage(setAiToolLiveMessage, CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE);
    },
  });

  const cancelIdeationJob = useCallback(() => {
    if (ideationJobId) {
      markJobCancelled(ignoredTerminalJobIdsRef.current, ideationJobId);
      void queryClient.cancelQueries({
        queryKey: queryKeys.personalBranding.ideationJobs.detail(ideationJobId),
      });
      setIdeationJobId(null);
    }
    setIdeationClientCancelState('cancelled');
  }, [ideationJobId, queryClient]);

  const cancelVaultJob = useCallback(() => {
    if (vaultJobId) {
      markJobCancelled(ignoredTerminalJobIdsRef.current, vaultJobId);
      void queryClient.cancelQueries({
        queryKey: queryKeys.personalBranding.ideationJobs.detail(vaultJobId),
      });
      setVaultJobId(null);
    }
    setVaultClientCancelState('cancelled');
  }, [queryClient, vaultJobId]);

  const cancelApproveJob = useCallback(() => {
    if (approveJobId) {
      markJobCancelled(ignoredTerminalJobIdsRef.current, approveJobId);
    }
    setApproveJobId(null);
    setApproveJobIdeaId(null);
    setApproveClientCancelState('cancelled');
  }, [approveJobId]);

  const cancelImageInjectJob = useCallback(() => {
    if (imageInjectJobId) {
      markJobCancelled(ignoredTerminalJobIdsRef.current, imageInjectJobId);
      void queryClient.cancelQueries({
        queryKey: queryKeys.personalBranding.imageInjectJobs.detail(imageInjectJobId),
      });
      setImageInjectJobId(null);
    }
    setImageInjectClientCancelState('cancelled');
  }, [imageInjectJobId, queryClient]);

  const cancelKeywordOptimizeJob = useCallback(() => {
    if (keywordOptimizeJobId) {
      markJobCancelled(ignoredTerminalJobIdsRef.current, keywordOptimizeJobId);
      setKeywordOptimizeJobId(null);
    }
    setKeywordOptimizeClientCancelState('cancelled');
  }, [keywordOptimizeJobId]);

  return {
    activeTab,
    setActiveTab,
    contentQ,
    contentLoadError: contentQ.isError,
    retryContentLoad: () => {
      void contentQ.refetch();
    },
    ideasQ,
    contentNodes,
    ideas,
    ideationIdeas,
    vaultIdeas,
    trendIdeas,
    trendIdeasQ,
    openDraftFromIdea,
    openDraftFromLibrary,
    activeDraftId,
    activeContentStatus,
    editorTitle,
    setEditorTitle: (value: string) => {
      setEditorTitle(value);
      setIsDirty(true);
    },
    editorBody,
    handleEditorBodyChange,
    contentType,
    setContentType: (value: ContentType) => {
      setContentType(value);
      setIsDirty(true);
    },
    draftPlatform,
    setDraftPlatform: (value: BrandPlatform | null) => {
      setDraftPlatform(value);
      setIsDirty(true);
    },
    draftCanonicalUrl,
    setDraftCanonicalUrl: (value: string) => {
      setDraftCanonicalUrl(value);
      setIsDirty(true);
    },
    draftPillars,
    setDraftPillars: (value: string[]) => {
      setDraftPillars(value);
      setIsDirty(true);
    },
    brandPillarOptions,
    assetPrompts,
    isDirty,
    loadDraft,
    openNewDraftWizard,
    closeNewDraftWizard,
    newDraftWizardOpen,
    startFromTemplate,
    generateDraftMutation,
    titlePromptOpen,
    setTitlePromptOpen,
    requestSaveDraft,
    saveWithResolvedTitle,
    keepUntitledAndSave,
    saveDraftMutation,
    saveDraftError: saveDraftMutation.isError
      ? (saveDraftMutation.error?.message ?? 'Failed to save draft')
      : null,
    lastSavedAt,
    deleteDraftMutation,
    archiveDraftMutation,
    unarchiveDraftMutation,
    publishMutation,
    unpublishMutation,
    approveIdeaMutation,
    isApprovingIdea,
    approvingIdeaId,
    rejectIdeaMutation,
    assetPromptsMutation,
    finishContentMutation,
    lengthenContentMutation,
    formatContentMutation,
    injectImagesMutation,
    imageInjectJob: imageInjectJobQuery.data,
    imageInjectError,
    isInjectingImages:
      injectImagesMutation.isPending ||
      imageInjectJobQuery.data?.status === 'queued' ||
      imageInjectJobQuery.data?.status === 'running',
    keywordOptimizeJob: keywordOptimizeJobQuery.data,
    keywordOptimizeError,
    isOptimizingKeywords:
      optimizeKeywordsMutation.isPending ||
      keywordOptimizeJobQuery.data?.status === 'queued' ||
      keywordOptimizeJobQuery.data?.status === 'running',
    onOptimizeKeywords: () => optimizeKeywordsMutation.mutate(),
    aiToolLiveMessage,
    ideationLiveMessage,
    vaultLiveMessage,
    ideationClientCancelState,
    cancelIdeationJob,
    vaultClientCancelState,
    cancelVaultJob,
    approveClientCancelState,
    cancelApproveJob,
    imageInjectClientCancelState,
    cancelImageInjectJob,
    keywordOptimizeClientCancelState,
    cancelKeywordOptimizeJob,
    showArchivedContent,
    setShowArchivedContent,
    rejectingIdea,
    setRejectingIdea,
    approvingIdea,
    setApprovingIdea,
    approveError,
    setApproveError,
    profilesQ,
    brandProfiles,
    selectedProfileId,
    setSelectedProfileId,
    targetPlatform,
    setTargetPlatform: handleTargetPlatformChange,
    seedIdeas,
    setSeedIdeas,
    boostFromRecentPublishes,
    setBoostFromRecentPublishes,
    enableImageSearch,
    setEnableImageSearch,
    vaultEnableImageSearch,
    setVaultEnableImageSearch,
    enableKeywordResearch,
    setEnableKeywordResearch,
    ideaCount,
    setIdeaCount,
    ideationModelCatalog,
    isIdeationModelCatalogLoading,
    ideationModelPicker,
    setIdeationModelPicker,
    selectedVaultItemIds,
    setSelectedVaultItemIds,
    generateError,
    generateIdeasMutation,
    ideationJob: ideationJobQuery.data,
    isGeneratingIdeas:
      generateIdeasMutation.isPending || contentIdeationJobInProgress(ideationJobQuery.data),
    lastGenerationStats,
    vaultGenerateError,
    generateVaultIdeasMutation,
    vaultJob: vaultJobQuery.data,
    isGeneratingVaultIdeas:
      generateVaultIdeasMutation.isPending || contentIdeationJobInProgress(vaultJobQuery.data),
    lastVaultGenerationStats,
    vaultItemLabels,
    setVaultItemLabels,
  };
}
