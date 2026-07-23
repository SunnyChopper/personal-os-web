import { apiClient } from '@/lib/api-client';
import { uploadToS3WithProgress } from '@/lib/upload-to-s3-with-progress';
import { formatApiFailure } from '@/utils/api-error-formatter';
import type {
  ApproveContentIdeaInput,
  ApproveContentIdeaResult,
  ApplyPerformanceSuggestionResult,
  ApproveContentTemplateCandidateInput,
  ApproveContentTemplateCandidateResult,
  AssetPromptsResult,
  BrandPlatform,
  BrandConfigResponse,
  BrandProfile,
  BrandProfileDetail,
  BrandProfileListResponse,
  BrandProfileOutputTest,
  BrandProfileOutputTestListResponse,
  BrandProfileVersionListResponse,
  GenerateProfileOutputTestInput,
  StartProfileExtractionRerunInput,
  PaginatedPersonalBranding,
  ContentIdea,
  ContentIdeationJob,
  ContentIdeationJobStart,
  ContentImageInjectJob,
  ContentImageInjectJobStart,
  ContentKeywordOptimizationJob,
  ContentKeywordOptimizationJobStart,
  ContentNode,
  ContentNodeListResponse,
  ContentStatus,
  ContentType,
  ContentDraftGenerationResult,
  ContentTemplate,
  ContentTemplateAiJob,
  ContentTemplateAiJobStart,
  ContentTemplateCandidate,
  ContentTemplateSettings,
  ContentAdaptations,
  ContentVariant,
  ContentVariantList,
  CreateBrandProfileInput,
  CreateConnectionInteractionInput,
  CreateContentIdeaInput,
  CreateContentNodeInput,
  CreateContentTemplateInput,
  CreateCreatorConnectionInput,
  CreatePlatformRuleInput,
  CreateProfileExtractionAccepted,
  CreateProfileExtractionInput,
  StartProfileExtractionInput,
  ProfileExtractionClientProgress,
  ProfileExtractionSourceType,
  CreateRadarSourceInput,
  CreateRadarSavedViewInput,
  CreateTrackingMetricInput,
  ConnectionInteractionBoardListResponse,
  ConnectionInteractionListResponse,
  ConnectionInteractionLog,
  ConnectionMetricLinks,
  ContentOpportunity,
  ContentOpportunityListResponse,
  ContentOpportunitySearchInput,
  ContentOpportunitySearchResult,
  ContentOpportunityStatus,
  UpdateContentOpportunityInput,
  CreatorConnection,
  CreatorConnectionListResponse,
  EffectivePlatformRules,
  PlatformRuleCatalog,
  PlatformRuleRecord,
  PlatformRulesListResponse,
  ProfileExtractionJob,
  ProfileExtractionSourceRunListResponse,
  ProfileExtractionUploadSlot,
  RadarDiscoveryCandidate,
  RadarDiscoveryCandidateFilters,
  RadarDiscoveryCandidateListResponse,
  RadarDiscoveryParseJob,
  RadarDiscoveryParseJobStart,
  RadarDiscoveryRun,
  RadarDiscoveryRunListResponse,
  RadarItem,
  RadarItemListResponse,
  RadarSavedView,
  RadarSavedViewListResponse,
  RadarUserIrrelevanceReason,
  RadarRunDetail,
  RadarRunListResponse,
  RadarRunOutcomeDisposition,
  RadarRunOutcomeDropReason,
  RadarRunOutcomeListResponse,
  RadarRunStartAccepted,
  RadarSettings,
  RadarSource,
  RadarSourceHealthDetails,
  RadarFeedbackStats,
  RadarSourcePreview,
  RadarSourcePreviewInput,
  RadarSourceListResponse,
  RadarSuggestedCadences,
  StartRadarDiscoveryRunInput,
  FollowSuggestion,
  FollowSuggestionConnectionDraft,
  FollowSuggestionListResponse,
  ReconFeedSettings,
  ReconPost,
  ReconPostListResponse,
  ReconRunListResponse,
  ReconRunStartAccepted,
  ReconRunSummary,
  UpdateFollowSuggestionInput,
  SubmitFollowConfidenceFeedbackInput,
  UpdateReconFeedSettingsInput,
  UpdateReconPostInput,
  GenerateContentIdeasInput,
  InjectContentImagesInput,
  GenerateTopicSuggestionsInput,
  GenerateTopicSuggestionsResult,
  PlatformRuleSetPreviewInput,
  PlatformRuleSetPreviewResult,
  SuggestPlatformFitInput,
  PlatformFitSuggestionsResult,
  GenerateVaultIdeasInput,
  GenerateRadarIdeasInput,
  ExtractContentTemplatesInput,
  BrainstormContentTemplatesInput,
  RejectContentIdeaInput,
  RejectContentTemplateCandidateInput,
  RetryContentTemplateCandidateInput,
  RejectVariantInput,
  RegenerateVariantWithTweaksInput,
  SuggestVariantImprovementsInput,
  SuggestVariantImprovementsResult,
  SaveVariantVersionInput,
  RejectedIdeaFeedback,
  RepurposeJob,
  RepurposeJobList,
  SendToSandboxResult,
  StartRepurposeAccepted,
  StartRepurposeInput,
  PublishQueueList,
  UpdateVariantDistributionStatusInput,
  VariantPerformanceInsights,
  RolodexMetricLinksResponse,
  RolodexResponseVectorInput,
  RolodexResponseVectorsResult,
  CreateReplyRunInput,
  ReplyRun,
  ReplySuggestion,
  UpdateReplySuggestionInput,
  TrackingMetric,
  TrackingMetricListResponse,
  UpdateBrandProfileInput,
  UpdateContentNodeInput,
  UpdateContentTemplateInput,
  UpdateCreatorConnectionInput,
  UpdatePlatformRuleInput,
  UpdateRadarSettingsInput,
  UpdateRadarSourceInput,
  UpdateRadarSavedViewInput,
  UpdateTrackingMetricInput,
} from '@/types/api/personal-branding.dto';

function unwrap<T>(res: { success: boolean; data?: T; error?: { message?: string } }): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message ?? 'Request failed');
  }
  return res.data;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
}

const UPLOAD_SLOT_BATCH = 50;
const UPLOAD_CONCURRENCY = 4;

const EXTRACTION_SOURCE_TYPE_ORDER: ProfileExtractionSourceType[] = [
  'pdf',
  'text',
  'url',
  'x_profile',
];

function buildExtractionSourceTypesHint(
  filesCount: number,
  pasted: StartProfileExtractionInput['sources'],
  xUsername: string
): ProfileExtractionSourceType[] {
  const types = new Set<ProfileExtractionSourceType>();
  if (filesCount > 0) types.add('pdf');
  if (xUsername) types.add('x_profile');
  for (const source of pasted ?? []) {
    types.add(source.url?.trim() ? 'url' : 'text');
  }
  return EXTRACTION_SOURCE_TYPE_ORDER.filter((type) => types.has(type));
}

export const personalBrandingService = {
  getBrandConfig: async (): Promise<BrandConfigResponse> =>
    apiClient.get('/personal-branding/brand-config'),

  listProfiles: async (page = 1, pageSize = 50): Promise<BrandProfileListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/profiles?${q}`);
  },

  createProfile: async (body: CreateBrandProfileInput): Promise<BrandProfile> =>
    unwrap(await apiClient.post<BrandProfile>('/personal-branding/profiles', body)),

  getProfile: async (profileId: string): Promise<BrandProfileDetail> =>
    unwrap(await apiClient.get<BrandProfileDetail>(`/personal-branding/profiles/${profileId}`)),

  updateProfile: async (profileId: string, body: UpdateBrandProfileInput): Promise<BrandProfile> =>
    unwrap(await apiClient.patch<BrandProfile>(`/personal-branding/profiles/${profileId}`, body)),

  deleteProfile: async (profileId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/profiles/${profileId}`);
  },

  startProfileExtraction: async (
    body: CreateProfileExtractionInput
  ): Promise<CreateProfileExtractionAccepted> =>
    unwrap(
      await apiClient.post<CreateProfileExtractionAccepted>(
        '/personal-branding/profile-extractions',
        body
      )
    ),

  startProfileExtractionUpload: async (
    input: StartProfileExtractionInput
  ): Promise<CreateProfileExtractionAccepted> => {
    const form = new FormData();
    for (const file of input.files ?? []) {
      form.append('files', file);
    }
    if (input.name?.trim()) form.append('name', input.name.trim());
    if (input.provider?.trim()) form.append('provider', input.provider.trim());
    if (input.model?.trim()) form.append('model', input.model.trim());
    const pasted = (input.sources ?? []).filter((s) => (s.text ?? '').trim());
    if (pasted.length) {
      form.append(
        'sourcesJson',
        JSON.stringify(
          pasted.map((s) => ({
            title: s.title?.trim() || null,
            url: s.url?.trim() || null,
            text: (s.text ?? '').trim(),
          }))
        )
      );
    }
    const res = await apiClient.postFormData<CreateProfileExtractionAccepted>(
      '/personal-branding/profile-extractions/uploads',
      form
    );
    return unwrap(res);
  },

  startProfileExtractionFromDialog: async (
    input: StartProfileExtractionInput,
    options?: { onProgress?: (progress: ProfileExtractionClientProgress) => void }
  ): Promise<CreateProfileExtractionAccepted> => {
    const pasted = (input.sources ?? []).filter((s) => (s.text ?? '').trim());
    const files = input.files ?? [];
    const xUsername = (input.xUsername ?? '').trim().replace(/^@+/, '');
    if (!files.length && !pasted.length && !xUsername) {
      throw new Error('Add at least one PDF, pasted snippet, or X username.');
    }

    const onProgress = options?.onProgress;
    const bytesTotal = files.reduce((sum, file) => sum + file.size, 0);
    const fileBytesLoaded = new Array(files.length).fill(0);
    let filesCompleted = 0;
    let jobId = '';
    let profileId = '';
    const sourceTypesHint = buildExtractionSourceTypesHint(files.length, pasted, xUsername);

    const emitProgress = (
      phase: ProfileExtractionClientProgress['phase'],
      overrides: Partial<ProfileExtractionClientProgress> = {}
    ) => {
      onProgress?.({
        phase,
        filesCompleted,
        filesTotal: files.length,
        bytesUploaded: fileBytesLoaded.reduce((sum, value) => sum + value, 0),
        bytesTotal,
        jobId: jobId || undefined,
        profileId: profileId || undefined,
        sourceTypesHint,
        ...overrides,
      });
    };

    const session = unwrap(
      await apiClient.post<ProfileExtractionJob>(
        '/personal-branding/profile-extractions/sessions',
        {
          name: input.name,
          provider: input.provider,
          model: input.model,
        }
      )
    );
    jobId = session.jobId;
    profileId = session.profileId;

    if (files.length > 0) {
      emitProgress('uploading');
    }

    let globalFileIndex = 0;
    for (const batch of chunkArray(files, UPLOAD_SLOT_BATCH)) {
      const batchStartIndex = globalFileIndex;
      const slotRes = await apiClient.post<{ slots: ProfileExtractionUploadSlot[] }>(
        `/personal-branding/profile-extractions/${jobId}/upload-urls`,
        {
          files: batch.map((file, index) => ({
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            fileSizeBytes: file.size,
            clientUploadId: `${file.name}-${file.size}-${index}`,
          })),
        }
      );
      const slots = unwrap(slotRes).slots;
      const byClientId = new Map(
        slots.map((slot) => [slot.clientUploadId ?? slot.sourceId, slot] as const)
      );

      await mapWithConcurrency(batch, UPLOAD_CONCURRENCY, async (file, index) => {
        const globalIndex = batchStartIndex + index;
        const clientId = `${file.name}-${file.size}-${index}`;
        const slot = byClientId.get(clientId) ?? slots[index];
        if (!slot) throw new Error(`Missing upload slot for ${file.name}`);

        await uploadToS3WithProgress(slot.uploadUrl, file, (pct) => {
          fileBytesLoaded[globalIndex] = Math.round((pct / 100) * file.size);
          emitProgress('uploading');
        });

        fileBytesLoaded[globalIndex] = file.size;
        filesCompleted += 1;
        emitProgress('uploading');
      });

      globalFileIndex += batch.length;

      await apiClient.post(`/personal-branding/profile-extractions/${jobId}/uploads/complete`, {
        sourceIds: slots.map((slot) => slot.sourceId),
      });
    }

    if (pasted.length || xUsername) {
      emitProgress('registering_sources', {
        filesCompleted: files.length,
        bytesUploaded: bytesTotal,
      });
    }

    for (const batch of chunkArray(pasted, UPLOAD_SLOT_BATCH)) {
      await apiClient.post(`/personal-branding/profile-extractions/${jobId}/sources`, {
        sources: batch.map((s) => ({
          title: s.title?.trim() || null,
          url: s.url?.trim() || null,
          text: (s.text ?? '').trim(),
        })),
      });
    }

    if (xUsername) {
      await apiClient.post(`/personal-branding/profile-extractions/${jobId}/sources`, {
        sources: [
          {
            sourceType: 'x_profile',
            xUsername,
            title: `@${xUsername}`,
            url: `https://x.com/${xUsername}`,
          },
        ],
      });
    }

    emitProgress('starting', {
      filesCompleted: files.length,
      bytesUploaded: bytesTotal,
    });

    const started = unwrap(
      await apiClient.post<ProfileExtractionJob>(
        `/personal-branding/profile-extractions/${jobId}/start`,
        {
          provider: input.provider,
          model: input.model,
        }
      )
    );

    emitProgress('done', {
      filesCompleted: files.length,
      bytesUploaded: bytesTotal,
    });

    return {
      jobId: started.jobId,
      profileId: started.profileId,
      status: started.status,
    };
  },

  listProfileExtractionSources: async (
    jobId: string,
    page = 1,
    pageSize = 50,
    status?: string
  ): Promise<ProfileExtractionSourceRunListResponse> => {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) q.set('status', status);
    return unwrap(
      await apiClient.get<ProfileExtractionSourceRunListResponse>(
        `/personal-branding/profile-extractions/${jobId}/sources?${q}`
      )
    );
  },

  getProfileExtraction: async (jobId: string): Promise<ProfileExtractionJob> =>
    unwrap(
      await apiClient.get<ProfileExtractionJob>(`/personal-branding/profile-extractions/${jobId}`)
    ),

  cancelProfileExtraction: async (jobId: string): Promise<ProfileExtractionJob> =>
    unwrap(
      await apiClient.post<ProfileExtractionJob>(
        `/personal-branding/profile-extractions/${jobId}/cancel`,
        {}
      )
    ),

  listProfileVersions: async (profileId: string): Promise<BrandProfileVersionListResponse> =>
    unwrap(
      await apiClient.get<BrandProfileVersionListResponse>(
        `/personal-branding/profiles/${profileId}/versions`
      )
    ),

  rerunProfileExtraction: async (
    profileId: string,
    body: StartProfileExtractionRerunInput = {}
  ): Promise<CreateProfileExtractionAccepted> =>
    unwrap(
      await apiClient.post<CreateProfileExtractionAccepted>(
        `/personal-branding/profiles/${profileId}/extraction-reruns`,
        body
      )
    ),

  activateProfileVersion: async (
    profileId: string,
    versionId: string
  ): Promise<BrandProfileDetail> =>
    unwrap(
      await apiClient.post<BrandProfileDetail>(
        `/personal-branding/profiles/${profileId}/versions/${versionId}/activate`,
        {}
      )
    ),

  generateProfileOutputTest: async (
    profileId: string,
    body: GenerateProfileOutputTestInput
  ): Promise<BrandProfileOutputTest> =>
    unwrap(
      await apiClient.post<BrandProfileOutputTest>(
        `/personal-branding/profiles/${profileId}/output-tests`,
        body
      )
    ),

  listProfileOutputTests: async (profileId: string): Promise<BrandProfileOutputTestListResponse> =>
    unwrap(
      await apiClient.get<BrandProfileOutputTestListResponse>(
        `/personal-branding/profiles/${profileId}/output-tests`
      )
    ),

  listPlatformRules: async (page = 1, pageSize = 50): Promise<PlatformRulesListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/platform-rules?${q}`);
  },

  createPlatformRule: async (body: CreatePlatformRuleInput): Promise<PlatformRuleRecord> =>
    unwrap(await apiClient.post<PlatformRuleRecord>('/personal-branding/platform-rules', body)),

  getPlatformRule: async (ruleId: string): Promise<PlatformRuleRecord> =>
    unwrap(
      await apiClient.get<PlatformRuleRecord>(`/personal-branding/platform-rules/rules/${ruleId}`)
    ),

  updatePlatformRule: async (
    ruleId: string,
    body: UpdatePlatformRuleInput
  ): Promise<PlatformRuleRecord> =>
    unwrap(
      await apiClient.patch<PlatformRuleRecord>(
        `/personal-branding/platform-rules/rules/${ruleId}`,
        body
      )
    ),

  deletePlatformRule: async (ruleId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/platform-rules/rules/${ruleId}`);
  },

  getPlatformRuleCatalog: async (): Promise<PlatformRuleCatalog> =>
    unwrap(await apiClient.get<PlatformRuleCatalog>('/personal-branding/platform-rules/catalog')),

  getEffectivePlatformRules: async (
    platform: string,
    profileId?: string
  ): Promise<EffectivePlatformRules> => {
    const q = new URLSearchParams({ platform });
    if (profileId) q.set('profileId', profileId);
    return unwrap(
      await apiClient.get<EffectivePlatformRules>(
        `/personal-branding/platform-rules/effective?${q}`
      )
    );
  },

  listContentNodes: async (
    page = 1,
    pageSize = 50,
    status?: ContentStatus
  ): Promise<ContentNodeListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) q.set('status', status);
    return apiClient.get(`/personal-branding/content?${q}`);
  },

  getContentNode: async (contentId: string): Promise<ContentNode> =>
    unwrap(await apiClient.get<ContentNode>(`/personal-branding/content/${contentId}`)),

  createContentNode: async (body: CreateContentNodeInput): Promise<ContentNode> =>
    unwrap(await apiClient.post<ContentNode>('/personal-branding/content', body)),

  updateContentNode: async (
    contentId: string,
    body: UpdateContentNodeInput
  ): Promise<ContentNode> =>
    unwrap(await apiClient.patch<ContentNode>(`/personal-branding/content/${contentId}`, body)),

  deleteContentNode: async (contentId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/content/${contentId}`);
  },

  startRepurpose: async (
    contentId: string,
    body: StartRepurposeInput
  ): Promise<StartRepurposeAccepted> =>
    unwrap(
      await apiClient.post<StartRepurposeAccepted>(
        `/personal-branding/content/${contentId}/repurpose`,
        body
      )
    ),

  listRepurposeJobs: async (contentId: string, status?: string): Promise<RepurposeJob[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiClient.get<RepurposeJobList>(
      `/personal-branding/content/${contentId}/repurpose-jobs${query}`
    );
    return unwrap(res).data;
  },

  getRepurposeJob: async (contentId: string, jobId: string): Promise<RepurposeJob> =>
    unwrap(
      await apiClient.get<RepurposeJob>(
        `/personal-branding/content/${contentId}/repurpose-jobs/${jobId}`
      )
    ),

  cancelRepurposeJobs: async (contentId: string): Promise<RepurposeJob[]> =>
    unwrap(
      await apiClient.post<{ jobs: RepurposeJob[] }>(
        `/personal-branding/content/${contentId}/repurpose-jobs/cancel`,
        {}
      )
    ).jobs,

  listContentVariants: async (contentId: string, activeOnly = true): Promise<ContentVariant[]> => {
    const q = new URLSearchParams({ activeOnly: String(activeOnly) });
    const res = await apiClient.get<ContentVariantList>(
      `/personal-branding/content/${contentId}/variants?${q}`
    );
    return unwrap(res).data;
  },

  getContentAdaptations: async (contentId: string): Promise<ContentAdaptations> =>
    unwrap(
      await apiClient.get<ContentAdaptations>(`/personal-branding/content/${contentId}/adaptations`)
    ),

  listVariantVersions: async (variantId: string): Promise<ContentVariant[]> => {
    const res = await apiClient.get<ContentVariantList>(
      `/personal-branding/variants/${variantId}/versions`
    );
    return unwrap(res).data;
  },

  saveVariantVersion: async (
    variantId: string,
    body: SaveVariantVersionInput
  ): Promise<ContentVariant> =>
    unwrap(
      await apiClient.post<ContentVariant>(
        `/personal-branding/variants/${variantId}/save-version`,
        body
      )
    ),

  activateVariantVersion: async (variantId: string): Promise<ContentVariant> =>
    unwrap(
      await apiClient.post<ContentVariant>(`/personal-branding/variants/${variantId}/activate`, {})
    ),

  rejectContentVariant: async (
    variantId: string,
    body: RejectVariantInput
  ): Promise<ContentVariant> =>
    unwrap(
      await apiClient.post<ContentVariant>(`/personal-branding/variants/${variantId}/reject`, body)
    ),

  regenerateVariantWithTweaks: async (
    variantId: string,
    body: RegenerateVariantWithTweaksInput
  ): Promise<StartRepurposeAccepted> =>
    unwrap(
      await apiClient.post<StartRepurposeAccepted>(
        `/personal-branding/variants/${variantId}/regenerate`,
        body
      )
    ),

  suggestVariantImprovements: async (
    variantId: string,
    body: SuggestVariantImprovementsInput = {}
  ): Promise<SuggestVariantImprovementsResult> =>
    unwrap(
      await apiClient.post<SuggestVariantImprovementsResult>(
        `/personal-branding/variants/${variantId}/improvement-suggestions`,
        body
      )
    ),

  updateVariantDistributionStatus: async (
    variantId: string,
    body: UpdateVariantDistributionStatusInput
  ): Promise<ContentVariant> =>
    unwrap(
      await apiClient.patch<ContentVariant>(
        `/personal-branding/variants/${variantId}/distribution-status`,
        body
      )
    ),

  getVariantPerformanceInsights: async (variantId: string): Promise<VariantPerformanceInsights> =>
    unwrap(
      await apiClient.get<VariantPerformanceInsights>(
        `/personal-branding/variants/${variantId}/performance-insights`
      )
    ),

  applyVariantPerformanceSuggestion: async (
    variantId: string,
    suggestionId: string
  ): Promise<ApplyPerformanceSuggestionResult> =>
    unwrap(
      await apiClient.post<ApplyPerformanceSuggestionResult>(
        `/personal-branding/variants/${variantId}/performance-suggestions/${suggestionId}/apply`,
        {}
      )
    ),

  listPublishQueue: async (): Promise<PublishQueueList> =>
    unwrap(await apiClient.get<PublishQueueList>('/personal-branding/publish-queue')),

  sendVariantToSandbox: async (variantId: string): Promise<SendToSandboxResult> =>
    unwrap(
      await apiClient.post<SendToSandboxResult>(
        `/personal-branding/variants/${variantId}/send-to-sandbox`,
        {}
      )
    ),

  listContentIdeas: async (
    page = 1,
    pageSize = 50,
    status = 'GENERATED'
  ): Promise<PaginatedPersonalBranding<ContentIdea>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize), status });
    return unwrap(
      await apiClient.get<PaginatedPersonalBranding<ContentIdea>>(
        `/personal-branding/content-ideas?${q}`
      )
    );
  },

  createContentIdea: async (body: CreateContentIdeaInput): Promise<ContentIdea> =>
    unwrap(await apiClient.post<ContentIdea>('/personal-branding/content-ideas', body)),

  approveContentIdea: async (
    ideaId: string,
    body: ApproveContentIdeaInput
  ): Promise<ApproveContentIdeaResult> =>
    unwrap(
      await apiClient.post<ApproveContentIdeaResult>(
        `/personal-branding/content-ideas/${ideaId}/approve`,
        body
      )
    ),

  rejectContentIdea: async (ideaId: string, body: RejectContentIdeaInput): Promise<void> => {
    unwrap(await apiClient.post<null>(`/personal-branding/content-ideas/${ideaId}/reject`, body));
  },

  listRejectedIdeasFeedback: async (
    page = 1,
    pageSize = 50
  ): Promise<PaginatedPersonalBranding<RejectedIdeaFeedback>> =>
    unwrap(
      await apiClient.get<PaginatedPersonalBranding<RejectedIdeaFeedback>>(
        `/personal-branding/rejected-ideas-feedback?${new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        })}`
      )
    ),

  generateContentIdeas: async (
    body: GenerateContentIdeasInput
  ): Promise<ContentIdeationJobStart> => {
    const res = await apiClient.post<ContentIdeationJobStart>(
      '/ai/personal-branding/content-ideas/generate',
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start content ideation'));
    }
    return res.data;
  },

  generateTopicSuggestions: async (
    body: GenerateTopicSuggestionsInput
  ): Promise<GenerateTopicSuggestionsResult> => {
    const res = await apiClient.post<{ data: { result: GenerateTopicSuggestionsResult } }>(
      '/ai/personal-branding/topic-suggestions',
      body
    );
    if (!res.success || !res.data?.data?.result) {
      throw new Error(res.error?.message ?? 'Failed to brainstorm topics');
    }
    return res.data.data.result;
  },

  previewPlatformRuleSet: async (
    body: PlatformRuleSetPreviewInput
  ): Promise<PlatformRuleSetPreviewResult> => {
    const res = await apiClient.post<{ data: { result: PlatformRuleSetPreviewResult } }>(
      '/ai/personal-branding/platform-rule-set-preview',
      body
    );
    if (!res.success || !res.data?.data?.result) {
      throw new Error(res.error?.message ?? 'Failed to preview rule set');
    }
    return res.data.data.result;
  },

  suggestPlatformFit: async (
    body: SuggestPlatformFitInput
  ): Promise<PlatformFitSuggestionsResult> => {
    const res = await apiClient.post<{ data: { result: PlatformFitSuggestionsResult } }>(
      '/ai/personal-branding/platform-fit-suggestions',
      body
    );
    if (!res.success || !res.data?.data?.result) {
      throw new Error(res.error?.message ?? 'Failed to suggest platforms');
    }
    return res.data.data.result;
  },

  generateVaultExtractedIdeas: async (
    body: GenerateVaultIdeasInput
  ): Promise<ContentIdeationJobStart> => {
    const res = await apiClient.post<ContentIdeationJobStart>(
      '/ai/personal-branding/content-ideas/generate-from-vault',
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start vault content ideation'));
    }
    return res.data;
  },

  generateRadarExtractedIdeas: async (
    body: GenerateRadarIdeasInput
  ): Promise<ContentIdeationJobStart> => {
    const res = await apiClient.post<ContentIdeationJobStart>(
      '/ai/personal-branding/content-ideas/generate-from-radar',
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start Trend Stream content ideation'));
    }
    return res.data;
  },

  getContentIdeationJob: async (jobId: string): Promise<ContentIdeationJob> =>
    unwrap(
      await apiClient.get<ContentIdeationJob>(`/personal-branding/content-ideas/jobs/${jobId}`)
    ),

  injectContentImages: async (
    body: InjectContentImagesInput
  ): Promise<ContentImageInjectJobStart> => {
    const res = await apiClient.post<ContentImageInjectJobStart>(
      '/ai/personal-branding/content/inject-images',
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start image injection'));
    }
    return res.data;
  },

  getContentImageInjectJob: async (jobId: string): Promise<ContentImageInjectJob> =>
    unwrap(
      await apiClient.get<ContentImageInjectJob>(
        `/personal-branding/content/image-inject-jobs/${jobId}`
      )
    ),

  startKeywordOptimizationJob: async (
    contentId: string
  ): Promise<ContentKeywordOptimizationJobStart> => {
    const res = await apiClient.post<ContentKeywordOptimizationJobStart>(
      `/personal-branding/content/${contentId}/keyword-optimization-jobs`
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start keyword optimization'));
    }
    return res.data;
  },

  getKeywordOptimizationJob: async (
    contentId: string,
    jobId: string
  ): Promise<ContentKeywordOptimizationJob> =>
    unwrap(
      await apiClient.get<ContentKeywordOptimizationJob>(
        `/personal-branding/content/${contentId}/keyword-optimization-jobs/${jobId}`
      )
    ),

  generateAssetPrompts: async (body: {
    title: string;
    body: string;
    contentType: ContentType;
    model?: string;
  }): Promise<AssetPromptsResult> => {
    const res = await apiClient.post<{ data: { result: AssetPromptsResult } }>(
      '/ai/personal-branding/asset-prompts',
      body
    );
    if (!res.success || !res.data?.data?.result) {
      throw new Error(res.error?.message ?? 'Failed to generate asset prompts');
    }
    return res.data.data.result;
  },

  generateDraft: async (body: {
    topic: string;
    contentType: ContentType;
    platform: BrandPlatform;
    brandProfileId: string;
    templateId?: string;
    model?: string;
  }): Promise<ContentDraftGenerationResult> => {
    const res = await apiClient.post<{ data: { result: ContentDraftGenerationResult } }>(
      '/ai/personal-branding/generate-draft',
      body
    );
    if (!res.success || !res.data?.data?.result) {
      throw new Error(res.error?.message ?? 'Failed to generate draft');
    }
    return res.data.data.result;
  },

  listContentTemplates: async (
    page = 1,
    pageSize = 50
  ): Promise<PaginatedPersonalBranding<ContentTemplate>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return unwrap(
      await apiClient.get<PaginatedPersonalBranding<ContentTemplate>>(
        `/personal-branding/content-templates?${q}`
      )
    );
  },

  createContentTemplate: async (body: CreateContentTemplateInput): Promise<ContentTemplate> =>
    unwrap(await apiClient.post<ContentTemplate>('/personal-branding/content-templates', body)),

  updateContentTemplate: async (
    templateId: string,
    body: UpdateContentTemplateInput
  ): Promise<ContentTemplate> =>
    unwrap(
      await apiClient.patch<ContentTemplate>(
        `/personal-branding/content-templates/${templateId}`,
        body
      )
    ),

  deleteContentTemplate: async (templateId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/content-templates/${templateId}`);
  },

  listContentTemplateCandidates: async (
    page = 1,
    pageSize = 50,
    status = 'GENERATED'
  ): Promise<PaginatedPersonalBranding<ContentTemplateCandidate>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize), status });
    return unwrap(
      await apiClient.get<PaginatedPersonalBranding<ContentTemplateCandidate>>(
        `/personal-branding/content-template-candidates?${q}`
      )
    );
  },

  approveContentTemplateCandidate: async (
    candidateId: string,
    body: ApproveContentTemplateCandidateInput = {}
  ): Promise<ApproveContentTemplateCandidateResult> =>
    unwrap(
      await apiClient.post<ApproveContentTemplateCandidateResult>(
        `/personal-branding/content-template-candidates/${candidateId}/approve`,
        body
      )
    ),

  rejectContentTemplateCandidate: async (
    candidateId: string,
    body: RejectContentTemplateCandidateInput
  ): Promise<void> => {
    unwrap(
      await apiClient.post<null>(
        `/personal-branding/content-template-candidates/${candidateId}/reject`,
        body
      )
    );
  },

  extractContentTemplates: async (
    body: ExtractContentTemplatesInput
  ): Promise<ContentTemplateAiJobStart> => {
    const res = await apiClient.post<ContentTemplateAiJobStart>(
      '/ai/personal-branding/content-templates/extract',
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start template extraction'));
    }
    return res.data;
  },

  brainstormContentTemplates: async (
    body: BrainstormContentTemplatesInput
  ): Promise<ContentTemplateAiJobStart> => {
    const res = await apiClient.post<ContentTemplateAiJobStart>(
      '/ai/personal-branding/content-templates/brainstorm',
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start template brainstorm'));
    }
    return res.data;
  },

  retryContentTemplateCandidate: async (
    candidateId: string,
    body: RetryContentTemplateCandidateInput
  ): Promise<ContentTemplateAiJobStart> => {
    const res = await apiClient.post<ContentTemplateAiJobStart>(
      `/ai/personal-branding/content-template-candidates/${candidateId}/retry`,
      body
    );
    if (!res.success || !res.data?.jobId) {
      throw new Error(formatApiFailure(res.error, 'Failed to start template retry'));
    }
    return res.data;
  },

  getContentTemplateAiJob: async (jobId: string): Promise<ContentTemplateAiJob> =>
    unwrap(
      await apiClient.get<ContentTemplateAiJob>(
        `/personal-branding/content-templates/jobs/${jobId}`
      )
    ),

  getContentTemplateSettings: async (): Promise<ContentTemplateSettings> =>
    unwrap(
      await apiClient.get<ContentTemplateSettings>('/personal-branding/content-template-settings')
    ),

  listRadarSources: async (page = 1, pageSize = 50): Promise<RadarSourceListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/radar-sources?${q}`);
  },

  getRadarSource: async (sourceId: string): Promise<RadarSource> =>
    unwrap(await apiClient.get<RadarSource>(`/personal-branding/radar-sources/${sourceId}`)),

  getRadarSourceHealthDetails: async (sourceId: string): Promise<RadarSourceHealthDetails> =>
    unwrap(
      await apiClient.get<RadarSourceHealthDetails>(
        `/personal-branding/radar-sources/${sourceId}/health-details`
      )
    ),

  getRadarFeedbackStats: async (): Promise<RadarFeedbackStats> =>
    unwrap(await apiClient.get<RadarFeedbackStats>('/personal-branding/radar-feedback-stats')),

  createRadarSource: async (body: CreateRadarSourceInput): Promise<RadarSource> =>
    unwrap(await apiClient.post<RadarSource>('/personal-branding/radar-sources', body)),

  previewRadarSource: async (body: RadarSourcePreviewInput): Promise<RadarSourcePreview> =>
    unwrap(
      await apiClient.post<RadarSourcePreview>('/personal-branding/radar-sources/preview', body)
    ),

  updateRadarSource: async (sourceId: string, body: UpdateRadarSourceInput): Promise<RadarSource> =>
    unwrap(
      await apiClient.patch<RadarSource>(`/personal-branding/radar-sources/${sourceId}`, body)
    ),

  deleteRadarSource: async (sourceId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/radar-sources/${sourceId}`);
  },

  getRadarSuggestedCadences: async (): Promise<RadarSuggestedCadences> =>
    unwrap(
      await apiClient.get<RadarSuggestedCadences>(
        '/personal-branding/radar-sources/suggested-cadences'
      )
    ),

  getRadarSettings: async (): Promise<RadarSettings> =>
    unwrap(await apiClient.get<RadarSettings>('/personal-branding/radar-settings')),

  updateRadarSettings: async (body: UpdateRadarSettingsInput): Promise<RadarSettings> =>
    unwrap(await apiClient.put<RadarSettings>('/personal-branding/radar-settings', body)),

  listRadarItems: async (
    filters: {
      page?: number;
      pageSize?: number;
      includeFiltered?: boolean;
      q?: string;
      dateFrom?: string;
      dateTo?: string;
      sourceIds?: string[];
      minAiRelevanceScore?: number;
      tags?: string[];
      viewId?: string;
    } = {}
  ): Promise<RadarItemListResponse> => {
    const {
      page = 1,
      pageSize = 50,
      includeFiltered = false,
      q,
      dateFrom,
      dateTo,
      sourceIds,
      minAiRelevanceScore,
      tags,
      viewId,
    } = filters;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      includeFiltered: String(includeFiltered),
    });
    if (q?.trim()) params.set('q', q.trim());
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sourceIds?.length) params.set('sourceIds', sourceIds.join(','));
    if (minAiRelevanceScore != null) {
      params.set('minAiRelevanceScore', String(minAiRelevanceScore));
    }
    if (tags?.length) params.set('tags', tags.join(','));
    if (viewId) params.set('viewId', viewId);
    return apiClient.get(`/personal-branding/radar-items?${params}`);
  },

  listRadarViews: async (): Promise<RadarSavedViewListResponse> =>
    unwrap(await apiClient.get<RadarSavedViewListResponse>('/personal-branding/radar-views')),

  createRadarView: async (body: CreateRadarSavedViewInput): Promise<RadarSavedView> =>
    unwrap(await apiClient.post<RadarSavedView>('/personal-branding/radar-views', body)),

  updateRadarView: async (
    viewId: string,
    body: UpdateRadarSavedViewInput
  ): Promise<RadarSavedView> =>
    unwrap(await apiClient.patch<RadarSavedView>(`/personal-branding/radar-views/${viewId}`, body)),

  deleteRadarView: async (viewId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/radar-views/${viewId}`);
  },

  updateRadarItemRelevance: async (
    itemId: string,
    relevant: boolean,
    reason?: RadarUserIrrelevanceReason,
    overrideAiFilter?: boolean
  ): Promise<RadarItem> =>
    unwrap(
      await apiClient.patch<RadarItem>(`/personal-branding/radar-items/${itemId}/relevance`, {
        relevant,
        ...(reason ? { reason } : {}),
        ...(overrideAiFilter ? { overrideAiFilter: true } : {}),
      })
    ),

  explainRadarItemRelevance: async (itemId: string): Promise<RadarItem> =>
    unwrap(
      await apiClient.post<RadarItem>(
        `/personal-branding/radar-items/${itemId}/explain-relevance`,
        {}
      )
    ),

  startRadarRun: async (): Promise<RadarRunStartAccepted> =>
    unwrap(await apiClient.post<RadarRunStartAccepted>('/personal-branding/radar-runs', {})),

  listRadarRuns: async (page = 1, pageSize = 50): Promise<RadarRunListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/radar-runs?${q}`);
  },

  getRadarRun: async (runId: string): Promise<RadarRunDetail> =>
    unwrap(await apiClient.get<RadarRunDetail>(`/personal-branding/radar-runs/${runId}`)),

  listRadarRunOutcomes: async (
    runId: string,
    params: {
      disposition?: RadarRunOutcomeDisposition;
      dropReason?: RadarRunOutcomeDropReason;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<RadarRunOutcomeListResponse> => {
    const { disposition, dropReason, page = 1, pageSize = 50 } = params;
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (disposition) q.set('disposition', disposition);
    if (dropReason) q.set('dropReason', dropReason);
    return apiClient.get(`/personal-branding/radar-runs/${runId}/outcomes?${q}`);
  },

  startRadarDiscoveryRun: async (body: StartRadarDiscoveryRunInput): Promise<RadarDiscoveryRun> =>
    unwrap(
      await apiClient.post<RadarDiscoveryRun>('/personal-branding/radar-discovery/runs', body)
    ),

  listRadarDiscoveryRuns: async (
    page = 1,
    pageSize = 20
  ): Promise<RadarDiscoveryRunListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/radar-discovery/runs?${q}`);
  },

  getRadarDiscoveryRun: async (runId: string): Promise<RadarDiscoveryRun> =>
    unwrap(
      await apiClient.get<RadarDiscoveryRun>(`/personal-branding/radar-discovery/runs/${runId}`)
    ),

  listRadarDiscoveryCandidates: async (
    runId: string,
    page = 1,
    pageSize = 20,
    filters: RadarDiscoveryCandidateFilters = {}
  ): Promise<RadarDiscoveryCandidateListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters.status) q.set('status', filters.status);
    if (filters.verdict) q.set('verdict', filters.verdict);
    return apiClient.get(`/personal-branding/radar-discovery/runs/${runId}/candidates?${q}`);
  },

  pauseRadarDiscoveryRun: async (runId: string): Promise<RadarDiscoveryRun> =>
    unwrap(
      await apiClient.post<RadarDiscoveryRun>(
        `/personal-branding/radar-discovery/runs/${runId}/pause`,
        {}
      )
    ),

  resumeRadarDiscoveryRun: async (runId: string): Promise<RadarDiscoveryRun> =>
    unwrap(
      await apiClient.post<RadarDiscoveryRun>(
        `/personal-branding/radar-discovery/runs/${runId}/resume`,
        {}
      )
    ),

  cancelRadarDiscoveryRun: async (runId: string): Promise<RadarDiscoveryRun> =>
    unwrap(
      await apiClient.post<RadarDiscoveryRun>(
        `/personal-branding/radar-discovery/runs/${runId}/cancel`,
        {}
      )
    ),

  deleteRadarDiscoveryRun: async (runId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/radar-discovery/runs/${runId}`);
  },

  saveRadarDiscoveryCandidate: async (runId: string, candidateId: string): Promise<RadarSource> =>
    unwrap(
      await apiClient.post<RadarSource>(
        `/personal-branding/radar-discovery/runs/${runId}/candidates/${candidateId}/save`,
        {}
      )
    ),

  addRadarDiscoveryCandidateAsItem: async (
    runId: string,
    candidateId: string
  ): Promise<RadarItem> =>
    unwrap(
      await apiClient.post<RadarItem>(
        `/personal-branding/radar-discovery/runs/${runId}/candidates/${candidateId}/add-as-item`,
        {}
      )
    ),

  markRadarDiscoveryCandidateNotASource: async (
    runId: string,
    candidateId: string
  ): Promise<RadarDiscoveryCandidate> =>
    unwrap(
      await apiClient.post<RadarDiscoveryCandidate>(
        `/personal-branding/radar-discovery/runs/${runId}/candidates/${candidateId}/not-a-source`,
        {}
      )
    ),

  dismissRadarDiscoveryCandidate: async (
    runId: string,
    candidateId: string
  ): Promise<RadarDiscoveryCandidate> =>
    unwrap(
      await apiClient.post<RadarDiscoveryCandidate>(
        `/personal-branding/radar-discovery/runs/${runId}/candidates/${candidateId}/dismiss`,
        {}
      )
    ),

  startRadarDiscoveryCandidateParseSources: async (
    runId: string,
    candidateId: string
  ): Promise<RadarDiscoveryParseJobStart> =>
    unwrap(
      await apiClient.post<RadarDiscoveryParseJobStart>(
        `/personal-branding/radar-discovery/runs/${runId}/candidates/${candidateId}/parse-sources`,
        {}
      )
    ),

  getRadarDiscoveryParseJob: async (jobId: string): Promise<RadarDiscoveryParseJob> =>
    unwrap(
      await apiClient.get<RadarDiscoveryParseJob>(
        `/personal-branding/radar-discovery/parse-jobs/${jobId}`
      )
    ),

  listCreatorConnections: async (
    page = 1,
    pageSize = 50
  ): Promise<CreatorConnectionListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/connections?${q}`);
  },

  getCreatorConnection: async (connectionId: string): Promise<CreatorConnection> =>
    unwrap(
      await apiClient.get<CreatorConnection>(`/personal-branding/connections/${connectionId}`)
    ),

  createCreatorConnection: async (body: CreateCreatorConnectionInput): Promise<CreatorConnection> =>
    unwrap(await apiClient.post<CreatorConnection>('/personal-branding/connections', body)),

  updateCreatorConnection: async (
    connectionId: string,
    body: UpdateCreatorConnectionInput
  ): Promise<CreatorConnection> =>
    unwrap(
      await apiClient.patch<CreatorConnection>(
        `/personal-branding/connections/${connectionId}`,
        body
      )
    ),

  deleteCreatorConnection: async (connectionId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/connections/${connectionId}`);
  },

  listInteractionsBoard: async (
    page = 1,
    pageSize = 50
  ): Promise<ConnectionInteractionBoardListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/interactions?${q}`);
  },

  listConnectionInteractions: async (
    connectionId: string,
    page = 1,
    pageSize = 50
  ): Promise<ConnectionInteractionListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/connections/${connectionId}/interactions?${q}`);
  },

  createConnectionInteraction: async (
    connectionId: string,
    body: CreateConnectionInteractionInput
  ): Promise<ConnectionInteractionLog> =>
    unwrap(
      await apiClient.post<ConnectionInteractionLog>(
        `/personal-branding/connections/${connectionId}/interactions`,
        body
      )
    ),

  listTrackingMetrics: async (page = 1, pageSize = 50): Promise<TrackingMetricListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/rolodex/tracking-metrics?${q}`);
  },

  createTrackingMetric: async (body: CreateTrackingMetricInput): Promise<TrackingMetric> =>
    unwrap(
      await apiClient.post<TrackingMetric>('/personal-branding/rolodex/tracking-metrics', body)
    ),

  updateTrackingMetric: async (
    metricId: string,
    body: UpdateTrackingMetricInput
  ): Promise<TrackingMetric> =>
    unwrap(
      await apiClient.patch<TrackingMetric>(
        `/personal-branding/rolodex/tracking-metrics/${metricId}`,
        body
      )
    ),

  deleteTrackingMetric: async (metricId: string): Promise<void> => {
    await apiClient.delete(`/personal-branding/rolodex/tracking-metrics/${metricId}`);
  },

  getRolodexMetricLinks: async (): Promise<RolodexMetricLinksResponse> =>
    apiClient.get('/personal-branding/rolodex/metric-links'),

  setRolodexMetricLinks: async (links: Record<string, string | null>) =>
    unwrap(
      await apiClient.put<RolodexMetricLinksResponse>('/personal-branding/rolodex/metric-links', {
        links,
      })
    ),

  getConnectionMetricLinks: async (connectionId: string): Promise<ConnectionMetricLinks> =>
    unwrap(
      await apiClient.get<ConnectionMetricLinks>(
        `/personal-branding/connections/${connectionId}/metric-links`
      )
    ),

  setConnectionMetricLinks: async (
    connectionId: string,
    trackingMetricIds: string[]
  ): Promise<ConnectionMetricLinks> =>
    unwrap(
      await apiClient.put<ConnectionMetricLinks>(
        `/personal-branding/connections/${connectionId}/metric-links`,
        { trackingMetricIds }
      )
    ),

  generateRolodexResponseVectors: async (
    body: RolodexResponseVectorInput
  ): Promise<RolodexResponseVectorsResult> => {
    const res = await apiClient.post<RolodexResponseVectorsResult>(
      '/personal-branding/rolodex/response-vectors',
      body
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? 'Failed to generate response vectors');
    }
    return res.data;
  },

  startReplyRun: async (body: CreateReplyRunInput): Promise<ReplyRun> => {
    const res = await apiClient.post<{ result?: ReplyRun } & ReplyRun>(
      '/personal-branding/rolodex/reply-runs',
      body
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? 'Failed to start reply generation');
    }
    const payload = res.data;
    if ('result' in payload && payload.result) {
      return payload.result;
    }
    return payload as ReplyRun;
  },

  getReplyRun: async (runId: string): Promise<ReplyRun> =>
    unwrap(await apiClient.get<ReplyRun>(`/personal-branding/rolodex/reply-runs/${runId}`)),

  listReplyRuns: async (
    params: {
      status?: string;
      connectionId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedPersonalBranding<ReplyRun>> => {
    const q = new URLSearchParams();
    q.set('page', String(params.page ?? 1));
    q.set('pageSize', String(params.pageSize ?? 20));
    if (params.status) q.set('status', params.status);
    if (params.connectionId) q.set('connectionId', params.connectionId);
    return unwrap(
      await apiClient.get<PaginatedPersonalBranding<ReplyRun>>(
        `/personal-branding/rolodex/reply-runs?${q}`
      )
    );
  },

  updateReplySuggestion: async (
    suggestionId: string,
    body: UpdateReplySuggestionInput
  ): Promise<ReplySuggestion> =>
    unwrap(
      await apiClient.patch<ReplySuggestion>(
        `/personal-branding/rolodex/reply-suggestions/${suggestionId}`,
        body
      )
    ),

  searchConnectionContentOpportunity: async (
    connectionId: string,
    body: ContentOpportunitySearchInput = {}
  ): Promise<ContentOpportunitySearchResult> =>
    unwrap(
      await apiClient.post<ContentOpportunitySearchResult>(
        `/personal-branding/connections/${connectionId}/content-opportunities/search`,
        body
      )
    ),

  listConnectionContentOpportunities: async (
    connectionId: string,
    page = 1,
    pageSize = 20,
    status?: ContentOpportunityStatus
  ): Promise<ContentOpportunityListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) q.set('status', status);
    return apiClient.get(
      `/personal-branding/connections/${connectionId}/content-opportunities?${q}`
    );
  },

  listRolodexContentOpportunities: async (
    status: ContentOpportunityStatus = 'SUGGESTED',
    page = 1,
    pageSize = 100
  ): Promise<ContentOpportunityListResponse> => {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status,
    });
    return apiClient.get(`/personal-branding/rolodex/content-opportunities?${q}`);
  },

  updateContentOpportunity: async (
    opportunityId: string,
    input: UpdateContentOpportunityInput
  ): Promise<ContentOpportunity> =>
    unwrap(
      await apiClient.patch<ContentOpportunity>(
        `/personal-branding/content-opportunities/${opportunityId}`,
        {
          status: input.status,
          feedbackText: input.feedbackText ?? undefined,
          feedbackCategory: input.feedbackCategory ?? undefined,
        }
      )
    ),

  getReconFeedSettings: async (): Promise<ReconFeedSettings> =>
    unwrap(
      await apiClient.get<ReconFeedSettings>('/personal-branding/rolodex/recon-feed/settings')
    ),

  updateReconFeedSettings: async (body: UpdateReconFeedSettingsInput): Promise<ReconFeedSettings> =>
    unwrap(
      await apiClient.patch<ReconFeedSettings>(
        '/personal-branding/rolodex/recon-feed/settings',
        body
      )
    ),

  listReconPosts: async (
    page = 1,
    pageSize = 50,
    filters?: {
      connectionId?: string;
      status?: string;
      minScore?: number;
      postedAfter?: string;
      sortBy?: 'relevanceScore' | 'postedAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ReconPostListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters?.connectionId) q.set('connectionId', filters.connectionId);
    if (filters?.status) q.set('status', filters.status);
    if (filters?.minScore !== undefined) q.set('minScore', String(filters.minScore));
    if (filters?.postedAfter) q.set('postedAfter', filters.postedAfter);
    if (filters?.sortBy) q.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) q.set('sortOrder', filters.sortOrder);
    return apiClient.get(`/personal-branding/rolodex/recon-feed/posts?${q}`);
  },

  updateReconPost: async (postId: string, body: UpdateReconPostInput): Promise<ReconPost> =>
    unwrap(
      await apiClient.patch<ReconPost>(
        `/personal-branding/rolodex/recon-feed/posts/${postId}`,
        body
      )
    ),

  listFollowSuggestions: async (
    page = 1,
    pageSize = 50,
    status?: string
  ): Promise<FollowSuggestionListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) q.set('status', status);
    return apiClient.get(`/personal-branding/rolodex/recon-feed/follow-suggestions?${q}`);
  },

  updateFollowSuggestion: async (
    suggestionId: string,
    body: UpdateFollowSuggestionInput
  ): Promise<FollowSuggestion> =>
    unwrap(
      await apiClient.patch<FollowSuggestion>(
        `/personal-branding/rolodex/recon-feed/follow-suggestions/${suggestionId}`,
        body
      )
    ),

  proposeFollowSuggestionConnection: async (
    suggestionId: string
  ): Promise<FollowSuggestionConnectionDraft> =>
    unwrap(
      await apiClient.post<FollowSuggestionConnectionDraft>(
        `/personal-branding/rolodex/recon-feed/follow-suggestions/${suggestionId}/propose-connection`,
        {}
      )
    ),

  explainFollowSuggestionConfidence: async (suggestionId: string): Promise<FollowSuggestion> =>
    unwrap(
      await apiClient.post<FollowSuggestion>(
        `/personal-branding/rolodex/recon-feed/follow-suggestions/${suggestionId}/explain-confidence`,
        {}
      )
    ),

  submitFollowSuggestionConfidenceFeedback: async (
    suggestionId: string,
    body: SubmitFollowConfidenceFeedbackInput
  ): Promise<FollowSuggestion> =>
    unwrap(
      await apiClient.post<FollowSuggestion>(
        `/personal-branding/rolodex/recon-feed/follow-suggestions/${suggestionId}/confidence-feedback`,
        body
      )
    ),

  startReconRun: async (): Promise<ReconRunStartAccepted> =>
    unwrap(await apiClient.post<ReconRunStartAccepted>('/personal-branding/recon-runs', {})),

  listReconRuns: async (page = 1, pageSize = 20): Promise<ReconRunListResponse> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/personal-branding/recon-runs?${q}`);
  },

  getReconRun: async (runId: string): Promise<ReconRunSummary> =>
    unwrap(await apiClient.get<ReconRunSummary>(`/personal-branding/recon-runs/${runId}`)),

  pauseReconRun: async (runId: string): Promise<ReconRunSummary> =>
    unwrap(
      await apiClient.post<ReconRunSummary>(`/personal-branding/recon-runs/${runId}/pause`, {})
    ),

  resumeReconRun: async (runId: string): Promise<ReconRunSummary> =>
    unwrap(
      await apiClient.post<ReconRunSummary>(`/personal-branding/recon-runs/${runId}/resume`, {})
    ),

  cancelReconRun: async (runId: string): Promise<ReconRunSummary> =>
    unwrap(
      await apiClient.post<ReconRunSummary>(`/personal-branding/recon-runs/${runId}/cancel`, {})
    ),
};
