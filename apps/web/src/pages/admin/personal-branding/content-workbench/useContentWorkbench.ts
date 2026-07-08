import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  AssetPromptsResult,
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaGenerationContextStats,
  ContentNode,
  ContentStatus,
  ContentType,
} from '@/types/api/personal-branding.dto';
import { isBrandProfileReadyForIdeation } from './content-workbench-helpers';
import type { NewDraftAiRequest, NewDraftTemplateResult } from './NewDraftWizardModal';
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
  const [assetPrompts, setAssetPrompts] = useState<AssetPromptsResult | null>(null);
  const [rejectingIdea, setRejectingIdea] = useState<ContentIdea | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<BrandPlatform>('linkedin');
  const [seedIdeas, setSeedIdeas] = useState('');
  const [selectedVaultItemIds, setSelectedVaultItemIds] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [vaultGenerateError, setVaultGenerateError] = useState<string | null>(null);
  const [lastGenerationStats, setLastGenerationStats] =
    useState<ContentIdeaGenerationContextStats | null>(null);
  const [lastVaultGenerationStats, setLastVaultGenerationStats] =
    useState<ContentIdeaGenerationContextStats | null>(null);
  const [vaultItemLabels, setVaultItemLabels] = useState<Record<string, string>>({});
  const [newDraftWizardOpen, setNewDraftWizardOpen] = useState(false);
  const [titlePromptOpen, setTitlePromptOpen] = useState(false);

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

  const contentNodes = useMemo(() => {
    const items = contentQ.data?.data?.data ?? [];
    return items
      .filter((n) => n.status !== 'SKIPPED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [contentQ.data]);

  const ideas = ideasQ.data?.data ?? [];

  const ideationIdeas = useMemo(
    () => ideas.filter((idea) => idea.sourceType !== 'VAULT_EXTRACTED'),
    [ideas]
  );

  const vaultIdeas = useMemo(
    () => ideas.filter((idea) => idea.sourceType === 'VAULT_EXTRACTED'),
    [ideas]
  );

  const loadDraft = useCallback((node: ContentNode) => {
    setActiveDraftId(node.id);
    setActiveContentStatus(node.status);
    setEditorTitle(node.title);
    setEditorBody(node.body ?? '');
    setContentType(node.contentType ?? 'DEEP_DIVE_BLOG');
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
    mutationFn: async () => {
      if (!activeDraftId) {
        const saved = await saveDraftMutation.mutateAsync(undefined);
        return personalBrandingService.updateContentNode(saved.id, { status: 'PUBLISHED' });
      }
      return personalBrandingService.updateContentNode(activeDraftId, { status: 'PUBLISHED' });
    },
    onSuccess: () => {
      setActiveContentStatus('PUBLISHED');
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

  const approveIdeaMutation = useMutation({
    mutationFn: (ideaId: string) => personalBrandingService.approveContentIdea(ideaId),
    onSuccess: ({ draft }) => {
      loadDraft(draft);
      setActiveTab('sandbox');
      void invalidateWorkbench();
    },
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
      });
    },
    onMutate: () => setGenerateError(null),
    onSuccess: (result) => {
      setLastGenerationStats(result.contextStats);
      void invalidateWorkbench();
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
    onMutate: () => setVaultGenerateError(null),
    onSuccess: (result) => {
      setLastVaultGenerationStats(result.contextStats);
      void invalidateWorkbench();
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
    rejectingIdea,
    setRejectingIdea,
    profilesQ,
    brandProfiles,
    selectedProfileId,
    setSelectedProfileId,
    targetPlatform,
    setTargetPlatform,
    seedIdeas,
    setSeedIdeas,
    selectedVaultItemIds,
    setSelectedVaultItemIds,
    generateError,
    generateIdeasMutation,
    lastGenerationStats,
    vaultGenerateError,
    generateVaultIdeasMutation,
    lastVaultGenerationStats,
    vaultItemLabels,
    setVaultItemLabels,
  };
}
