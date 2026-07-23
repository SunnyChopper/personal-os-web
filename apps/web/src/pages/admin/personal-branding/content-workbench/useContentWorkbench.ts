import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useContentIdeationJob } from '@/hooks/useContentIdeationJob';
import { useContentImageInjectJob } from '@/hooks/useContentImageInjectJob';
import { useKeywordOptimizationJob } from '@/hooks/useKeywordOptimizationJob';
import { useIdeationEngineAIModelPicker } from '@/hooks/personal-branding/useIdeationEngineAIModelPicker';
import { contentIdeationJobInProgress } from '@/lib/personal-branding/content-ideation-progress';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  AssetPromptsResult,
  BrandPlatform,
  BrandProfile,
  ContentIdea,
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
  collectActiveBrandPillars,
  isBrandProfileReadyForIdeation,
} from './content-workbench-helpers';
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
  const [enableImageSearch, setEnableImageSearch] = useState(false);
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

  const contentQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100),
    queryFn: () => personalBrandingService.listContentNodes(1, 100),
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

  const contentNodes = useMemo(() => {
    const items = contentQ.data?.data?.data ?? [];
    return items
      .filter((n) => n.status !== 'SKIPPED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [contentQ.data]);

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
    () => ideas.filter((idea) => idea.sourceType === 'RADAR_INGESTED'),
    [ideas]
  );

  const loadDraft = useCallback((node: ContentNode) => {
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
  }, []);

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
        setImageInjectError(job.error ?? job.message ?? 'Failed to inject images');
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
        setKeywordOptimizeError(job.error ?? job.message ?? 'Keyword optimization failed');
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

  const approveIdeaMutation = useMutation({
    mutationFn: (request: ApproveIdeaGenerateRequest) =>
      personalBrandingService.approveContentIdea(request.ideaId, {
        brandProfileId: request.brandProfileId,
        templateId: request.templateId,
        platform: request.platform,
        pillars: request.pillars,
      }),
    onMutate: () => setApproveError(null),
    onSuccess: ({ idea, draft }) => {
      setApprovingIdea(null);
      loadDraft(draft);
      setActiveTab('sandbox');
      void invalidateWorkbench();
      if (idea.enableImageSearch) {
        injectImagesMutation.mutate({
          title: draft.title,
          body: draft.body ?? '',
          contentId: draft.id,
          contentType: draft.contentType ?? undefined,
        });
      }
    },
    onError: (err: Error) => setApproveError(err.message),
  });

  const handleIdeationJobTerminal = useCallback(
    (job: ContentIdeationJob) => {
      if (job.status === 'succeeded' && job.result) {
        setLastGenerationStats(job.result.contextStats);
        void invalidateWorkbench();
        setIdeationJobId(null);
        return;
      }
      if (job.status === 'failed') {
        setGenerateError(job.error ?? job.message ?? 'Failed to generate content ideas');
        setIdeationJobId(null);
      }
    },
    [invalidateWorkbench]
  );

  const handleVaultJobTerminal = useCallback(
    (job: ContentIdeationJob) => {
      if (job.status === 'succeeded' && job.result) {
        setLastVaultGenerationStats(job.result.contextStats);
        void invalidateWorkbench();
        setVaultJobId(null);
        return;
      }
      if (job.status === 'failed') {
        setVaultGenerateError(job.error ?? job.message ?? 'Failed to generate vault content ideas');
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
        count: ideaCount,
        enableImageSearch,
        ...(resolveIdeationApiModel() ? { model: resolveIdeationApiModel() } : {}),
      });
    },
    onMutate: () => {
      setGenerateError(null);
      setIdeationJobId(null);
    },
    onSuccess: (start) => {
      setIdeationJobId(start.jobId);
    },
    onError: (err: Error) => setGenerateError(err.message),
  });

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
      });
    },
    onMutate: () => {
      setVaultGenerateError(null);
      setVaultJobId(null);
    },
    onSuccess: (start) => {
      setVaultJobId(start.jobId);
    },
    onError: (err: Error) => setVaultGenerateError(err.message),
  });

  const rejectIdeaMutation = useMutation({
    mutationFn: ({ ideaId, feedbackText }: { ideaId: string; feedbackText: string | null }) =>
      personalBrandingService.rejectContentIdea(ideaId, {
        feedbackText: feedbackText ?? undefined,
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

  return {
    activeTab,
    setActiveTab,
    contentQ,
    ideasQ,
    contentNodes,
    ideas,
    ideationIdeas,
    vaultIdeas,
    trendIdeas,
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
    deleteDraftMutation,
    publishMutation,
    unpublishMutation,
    approveIdeaMutation,
    rejectIdeaMutation,
    assetPromptsMutation,
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
    setTargetPlatform,
    seedIdeas,
    setSeedIdeas,
    enableImageSearch,
    setEnableImageSearch,
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
