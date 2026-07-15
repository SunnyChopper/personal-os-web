import type { ApiResponse } from '@/types/api-contracts';

export type ContentStatus = 'DRAFT' | 'FINALIZED' | 'PIPELINED' | 'PUBLISHED' | 'SKIPPED';
export type ContentSourceType = 'RADAR_INGESTED' | 'ON_DEMAND_AI' | 'MANUAL' | 'VAULT_EXTRACTED';
export type ContentType = 'DEEP_DIVE_BLOG' | 'SOCIAL_THREAD' | 'VIDEO_SCRIPT';
export type ContentIdeaStatus = 'GENERATED' | 'APPROVED' | 'REJECTED' | 'DRAFTED';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  DEEP_DIVE_BLOG: 'Deep-Dive Blog',
  SOCIAL_THREAD: 'Social Thread',
  VIDEO_SCRIPT: 'Video Script',
};
export type BrandPlatform = 'linkedin' | 'x' | 'medium' | 'youtube' | 'instagram' | 'newsletter';
export type RepurposeJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type ContentVariantStatus = 'generated' | 'rejected' | 'sent_to_sandbox';
export type ContentVariantDistributionStatus = 'DRAFT' | 'SCHEDULED' | 'DEPLOYED';

export const CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS: Record<
  ContentVariantDistributionStatus,
  string
> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  DEPLOYED: 'Deployed',
};
export type RadarSourceType = 'RSS' | 'API' | 'GITHUB_REPO';
export type RadarAuthScheme = 'BEARER' | 'HEADER' | 'QUERY' | 'NONE';
export type RadarSyncCadence = 'EVERY_N_HOURS' | 'DAILY' | 'WEEKLY' | 'MANUAL_ONLY';
export type RadarItemType =
  | 'ARTICLE'
  | 'REPOSITORY'
  | 'COMMIT'
  | 'RELEASE'
  | 'ISSUE'
  | 'PULL_REQUEST';
export type RadarGithubEventType = 'COMMITS' | 'RELEASES' | 'ISSUES' | 'PULL_REQUESTS';
export type RadarGithubReleaseFilter = 'ALL' | 'MAJOR_ONLY' | 'MINOR_AND_ABOVE';

export const RADAR_SYNC_CADENCE_LABELS: Record<RadarSyncCadence, string> = {
  EVERY_N_HOURS: 'Every x hours',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MANUAL_ONLY: 'Manual only',
};

export const RADAR_SYNC_WEEKDAY_LABELS: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

export const RADAR_SOURCE_TYPE_LABELS: Record<RadarSourceType, string> = {
  RSS: 'RSS feed',
  API: 'API endpoint',
  GITHUB_REPO: 'GitHub repository',
};

export const RADAR_ITEM_TYPE_LABELS: Record<RadarItemType, string> = {
  ARTICLE: 'Article',
  REPOSITORY: 'Repository',
  COMMIT: 'Commit',
  RELEASE: 'Release',
  ISSUE: 'Issue',
  PULL_REQUEST: 'Pull request',
};

export const RADAR_GITHUB_EVENT_TYPE_LABELS: Record<RadarGithubEventType, string> = {
  COMMITS: 'Commits',
  RELEASES: 'Releases',
  ISSUES: 'Issues',
  PULL_REQUESTS: 'Pull requests',
};

export const RADAR_GITHUB_RELEASE_FILTER_LABELS: Record<RadarGithubReleaseFilter, string> = {
  ALL: 'All releases',
  MAJOR_ONLY: 'Major releases only',
  MINOR_AND_ABOVE: 'Minor and major releases',
};

export const RADAR_AUTH_SCHEME_LABELS: Record<RadarAuthScheme, string> = {
  BEARER: 'Bearer token',
  HEADER: 'Custom header',
  QUERY: 'Query parameter',
  NONE: 'None',
};
export type BrandProfileStatus = 'draft' | 'active' | 'extracting';
export type ExtractionJobStatus =
  | 'uploading'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'succeeded_with_warnings'
  | 'failed';

export type ExtractionJobStage =
  | 'queued'
  | 'uploading'
  | 'reading_sources'
  | 'parsing_sources'
  | 'analyzing_sources'
  | 'analyzing'
  | 'reducing'
  | 'saving'
  | 'succeeded'
  | 'failed';

export type ExtractionSourceRunStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export const BRAND_PLATFORM_LABELS: Record<BrandPlatform, string> = {
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  medium: 'Medium',
  youtube: 'YouTube',
  instagram: 'Instagram',
  newsletter: 'Newsletter',
};

export interface PaginatedPersonalBranding<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BrandConfig {
  pillars: string[];
  targetAudience?: string | null;
  toneMetrics: Record<string, unknown>;
  bannedPhrases: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  description?: string | null;
  pillars: string[];
  targetAudience?: string | null;
  toneMetrics: Record<string, number | unknown>;
  bannedPhrases: string[];
  status: BrandProfileStatus;
  extractionJobId?: string | null;
  activeVersionId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandProfileInput {
  name: string;
  description?: string | null;
  pillars?: string[];
  targetAudience?: string | null;
  toneMetrics?: Record<string, number>;
  bannedPhrases?: string[];
  status?: BrandProfileStatus;
}

export interface UpdateBrandProfileInput {
  name?: string;
  description?: string | null;
  pillars?: string[];
  targetAudience?: string | null;
  toneMetrics?: Record<string, number> | null;
  bannedPhrases?: string[];
  status?: BrandProfileStatus;
}

export type ProfileExtractionSourceType = 'text' | 'url' | 'pdf' | 'x_profile';

export interface ProfileExtractionSourceInput {
  title?: string | null;
  url?: string | null;
  text?: string | null;
  xUsername?: string | null;
  sourceType?: ProfileExtractionSourceType;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  textTruncated?: boolean | null;
}

export interface CreateProfileExtractionInput {
  name?: string | null;
  sources: ProfileExtractionSourceInput[];
  provider?: string | null;
  model?: string | null;
}

/** Submit payload for extraction dialog (JSON and/or PDF uploads). */
export interface StartProfileExtractionInput {
  name?: string | null;
  sources?: ProfileExtractionSourceInput[];
  files?: File[];
  xUsername?: string | null;
  provider?: string | null;
  model?: string | null;
}

export interface ProfileExtractionJob {
  jobId: string;
  profileId: string;
  status: ExtractionJobStatus;
  stage?: ExtractionJobStage | null;
  message?: string | null;
  sourceCount?: number | null;
  processedSourceCount?: number | null;
  succeededSourceCount?: number | null;
  failedSourceCount?: number | null;
  totalChunkCount?: number | null;
  processedChunkCount?: number | null;
  pollAfterMs?: number | null;
  error?: string | null;
  provider?: string | null;
  model?: string | null;
  executionArn?: string | null;
  manifestS3Key?: string | null;
  coverageFingerprint?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ProfileExtractionUploadSlot {
  sourceId: string;
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  clientUploadId?: string | null;
}

export interface ProfileExtractionSourceRun {
  sourceId: string;
  status: ExtractionSourceRunStatus;
  stage?: string | null;
  title?: string | null;
  fileName?: string | null;
  sourceType?: ProfileExtractionSourceType | null;
  chunkCount?: number | null;
  processedChunkCount?: number | null;
  pageCount?: number | null;
  error?: string | null;
  attemptCount?: number | null;
}

export type ProfileExtractionSourceRunListResponse =
  PaginatedPersonalBranding<ProfileExtractionSourceRun>;

export interface ProfileExtractionSource {
  id: string;
  sourceType: ProfileExtractionSourceType;
  title?: string | null;
  url?: string | null;
  textExcerpt?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  textTruncated?: boolean | null;
  contentHash?: string | null;
  downloadFileName?: string | null;
  downloadUrl?: string | null;
  downloadUrlExpiresAt?: string | null;
  createdAt: string;
}

export interface BrandProfileDetail extends BrandProfile {
  sources?: ProfileExtractionSource[];
}

export type BrandProfileVersionOrigin = 'manual' | 'initial_extraction' | 'rerun_extraction';

export interface BrandProfileVersion {
  id: string;
  profileId: string;
  label?: string | null;
  origin: BrandProfileVersionOrigin;
  sourceJobId?: string | null;
  description?: string | null;
  pillars: string[];
  targetAudience?: string | null;
  toneMetrics: Record<string, number | unknown>;
  bannedPhrases: string[];
  status: BrandProfileStatus;
  provider?: string | null;
  model?: string | null;
  inputFingerprint?: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  activatedAt?: string | null;
}

export interface BrandProfileVersionListResponse {
  data: BrandProfileVersion[];
  total: number;
}

export interface BrandProfileOutputTest {
  id: string;
  profileId: string;
  profileVersionId?: string | null;
  topic: string;
  contentType: ContentType;
  platform: BrandPlatform;
  title: string;
  body: string;
  confidence?: number | null;
  provider?: string | null;
  model?: string | null;
  cached: boolean;
  userId: string;
  createdAt: string;
}

export interface BrandProfileOutputTestListResponse {
  data: BrandProfileOutputTest[];
  total: number;
}

export interface GenerateProfileOutputTestInput {
  topic: string;
  contentType: ContentType;
  platform: BrandPlatform;
  provider?: string;
  model?: string;
}

export interface StartProfileExtractionRerunInput {
  provider?: string | null;
  model?: string | null;
  versionLabel?: string | null;
}

export interface CreateProfileExtractionAccepted {
  jobId: string;
  profileId: string;
  status: ExtractionJobStatus;
}

export type RhetoricalModeId =
  | 'narrative'
  | 'descriptive'
  | 'expository'
  | 'argumentative'
  | 'persuasive'
  | 'instructional';

export type RhetoricalStrength = 'subtle' | 'light' | 'moderate' | 'strong' | 'dominant';

export type RhetoricalDeviceId =
  | 'metaphor'
  | 'simile'
  | 'analogy'
  | 'anecdote'
  | 'rhetoricalQuestion'
  | 'anaphora'
  | 'antithesis'
  | 'parallelism'
  | 'ruleOfThree'
  | 'hyperbole';

export interface RhetoricalModeSetting {
  mode: RhetoricalModeId;
  strength: RhetoricalStrength;
}

export interface PlatformRuleCatalogEntry {
  id: string;
  label: string;
  definition: string;
  enabledEffect: string;
  disabledEffect: string;
}

export interface PlatformRuleCatalog {
  modes: PlatformRuleCatalogEntry[];
  devices: PlatformRuleCatalogEntry[];
  strengths: RhetoricalStrength[];
  wordsPerMinute: number;
}

export interface ResolvedPlatformPolicy {
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  wordLimit?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements: string;
  appliedRuleIds: string[];
}

export interface PlatformRules {
  platform: BrandPlatform;
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements?: string | null;
  needsReview: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformRuleRecord {
  id: string;
  platform: BrandPlatform;
  name?: string | null;
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements?: string | null;
  needsReview: boolean;
  profileIds: string[];
  isUniversal: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformRuleInput {
  platform: BrandPlatform;
  name?: string | null;
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes?: RhetoricalModeSetting[];
  rhetoricalDevices?: RhetoricalDeviceId[];
  requirements: string;
  profileIds?: string[];
}

export interface UpdatePlatformRuleInput {
  platform?: BrandPlatform;
  name?: string | null;
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes?: RhetoricalModeSetting[] | null;
  rhetoricalDevices?: RhetoricalDeviceId[] | null;
  requirements?: string | null;
  profileIds?: string[] | null;
}

export interface EffectivePlatformRules {
  platform: BrandPlatform;
  profileId?: string | null;
  rules: PlatformRuleRecord[];
  resolvedPolicy: ResolvedPlatformPolicy;
}

export interface ContentNode {
  id: string;
  title: string;
  body?: string | null;
  status: ContentStatus;
  sourceType: ContentSourceType;
  sourceRefId?: string | null;
  sourceIdeaId?: string | null;
  contentType?: ContentType | null;
  assetPrompts?: Record<string, unknown> | null;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentNodeInput {
  title: string;
  body?: string | null;
  status?: ContentStatus;
  sourceType?: ContentSourceType;
  sourceRefId?: string | null;
  sourceIdeaId?: string | null;
  contentType?: ContentType | null;
  tags?: string[];
}

export interface UpdateContentNodeInput {
  title?: string;
  body?: string | null;
  status?: ContentStatus;
  contentType?: ContentType | null;
  assetPrompts?: Record<string, unknown> | null;
  tags?: string[] | null;
}

export interface ContentIdea {
  id: string;
  title: string;
  summary?: string | null;
  angle?: string | null;
  rationale?: string | null;
  contentType: ContentType;
  sourceType: ContentSourceType;
  sourceRefId?: string | null;
  targetPlatform?: BrandPlatform | null;
  tags: string[];
  status: ContentIdeaStatus;
  draftNodeId?: string | null;
  vaultItemIds?: string[] | null;
  radarItemIds?: string[] | null;
  radarItemSnapshots?: RadarItemSnapshot[] | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentIdeaInput {
  title: string;
  summary?: string | null;
  angle?: string | null;
  rationale?: string | null;
  contentType?: ContentType;
  sourceType?: ContentSourceType;
  sourceRefId?: string | null;
  targetPlatform?: BrandPlatform | null;
  tags?: string[];
}

export interface RejectContentIdeaInput {
  feedbackText?: string | null;
  feedbackCategory?: string | null;
}

export interface GenerateContentIdeasInput {
  brandProfileId: string;
  targetPlatform: BrandPlatform;
  seedIdeas?: string | null;
  count?: number;
  provider?: string | null;
  model?: string | null;
}

export interface GenerateVaultIdeasInput {
  brandProfileId: string;
  vaultItemIds: string[];
  targetPlatform: BrandPlatform;
  count?: number;
  provider?: string | null;
  model?: string | null;
}

export interface RadarItemSnapshot {
  id: string;
  title: string;
  url?: string | null;
  sourceName?: string | null;
}

export interface GenerateRadarIdeasInput {
  brandProfileId: string;
  radarItemIds: string[];
  targetPlatform: BrandPlatform;
  templateIds?: string[] | null;
  count?: number;
  provider?: string | null;
  model?: string | null;
}

export interface ContentIdeaGenerationContextStats {
  rejectedFeedbackCount: number;
  existingGeneratedCount: number;
  targetPlatform: BrandPlatform;
  referencedPublishedCount: number;
}

export interface GenerateContentIdeasResult {
  ideas: ContentIdea[];
  contextStats: ContentIdeaGenerationContextStats;
}

export interface GenerateTopicSuggestionsInput {
  pillars: string[];
  targetAudience?: string | null;
  platform: BrandPlatform;
  count?: number;
  provider?: string | null;
  model?: string | null;
}

export interface GenerateTopicSuggestionsResult {
  topics: string[];
}

export interface RejectedIdeaFeedback {
  id: string;
  ideaId: string;
  feedbackText: string;
  feedbackCategory?: string | null;
  ideaSnapshot: Record<string, unknown>;
  contentType?: ContentType | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveContentIdeaInput {
  brandProfileId: string;
  templateId?: string;
  platform?: BrandPlatform;
}

export interface ApproveContentIdeaResult {
  idea: ContentIdea;
  draft: ContentNode;
}

export type ContentTemplateSourceType = 'MANUAL' | 'EXTRACTED' | 'BRAINSTORMED';
export type TemplateSourceKind = 'GENERIC_URL' | 'MEDIUM_ARTICLE';
export type ContentTemplateCandidateStatus = 'GENERATED' | 'APPROVED' | 'REJECTED';

export interface ContentTemplate {
  id: string;
  title: string;
  description?: string | null;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  templateBody: string;
  tags: string[];
  sourceType: ContentTemplateSourceType;
  sourceUrl?: string | null;
  sourceKind?: TemplateSourceKind | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentTemplateInput {
  title: string;
  description?: string | null;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  templateBody: string;
  tags?: string[];
}

export interface UpdateContentTemplateInput {
  title?: string;
  description?: string | null;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  templateBody?: string;
  tags?: string[];
}

export interface ContentTemplateCandidate {
  id: string;
  title: string;
  description?: string | null;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  templateBody: string;
  tags: string[];
  status: ContentTemplateCandidateStatus;
  sourceType?: ContentTemplateSourceType | null;
  extractionNotes?: string | null;
  sourceUrl?: string | null;
  sourceKind?: TemplateSourceKind | null;
  sourceExcerpt?: string | null;
  rejectionFeedback?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveContentTemplateCandidateInput {
  title?: string;
  description?: string | null;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  templateBody?: string;
  tags?: string[];
}

export interface RejectContentTemplateCandidateInput {
  feedbackText?: string | null;
  feedbackCategory?: string | null;
}

export interface RejectedContentTemplateFeedback {
  id: string;
  candidateId: string;
  feedbackText: string;
  feedbackCategory?: string | null;
  candidateSnapshot: Record<string, unknown>;
  contentType?: ContentType | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveContentTemplateCandidateResult {
  candidate: ContentTemplateCandidate;
  template: ContentTemplate;
}

export interface ExtractContentTemplatesInput {
  sourceKind: TemplateSourceKind;
  sourceUrl: string;
  count?: number;
  provider?: string | null;
  model?: string | null;
}

export interface ContentTemplateExtractionContextStats {
  rejectedFeedbackCount: number;
  existingGeneratedCount: number;
  sourceKind: TemplateSourceKind;
}

export interface ExtractContentTemplatesResult {
  candidates: ContentTemplateCandidate[];
  contextStats: ContentTemplateExtractionContextStats;
}

export interface BrainstormContentTemplatesInput {
  brandProfileId: string;
  brief?: string | null;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  count?: number;
  provider?: string | null;
  model?: string | null;
}

export interface ContentTemplateBrainstormContextStats {
  rejectedFeedbackCount: number;
  existingGeneratedCount: number;
  brandProfileId: string;
}

export interface BrainstormContentTemplatesResult {
  candidates: ContentTemplateCandidate[];
  contextStats: ContentTemplateBrainstormContextStats;
}

export interface RetryContentTemplateCandidateInput {
  feedbackText: string;
  provider?: string | null;
  model?: string | null;
}

export interface ContentTemplateSettings {
  hasMediumApiKey: boolean;
}

export interface UpdateContentTemplateSettingsInput {
  mediumApiKey?: string | null;
}

export interface BlogImagePromptRow {
  placement: string;
  prompt: string;
  styleNotes?: string | null;
}

export interface VideoBrollPromptRow {
  timecode: string;
  description: string;
  visualHook?: string | null;
}

export interface AssetPromptsResult {
  contentType: ContentType;
  blogPrompts?: BlogImagePromptRow[];
  videoPrompts?: VideoBrollPromptRow[];
  socialNotes?: string | null;
}

export interface GenerateDraftInput {
  topic: string;
  contentType: ContentType;
  platform: BrandPlatform;
  brandProfileId: string;
  templateId?: string | null;
  provider?: string | null;
  model?: string | null;
}

export interface ContentDraftGenerationResult {
  title: string;
  body: string;
  contentType: ContentType;
}

export interface CritiqueEntry {
  critique: string;
  createdAt: string;
}

export interface StartRepurposeInput {
  brandProfileId: string;
  targetPlatforms: BrandPlatform[];
  provider?: string | null;
  model?: string | null;
}

export interface StartRepurposeAccepted {
  jobId: string;
  sourceContentId: string;
  status: RepurposeJobStatus;
}

export interface RepurposeJob {
  jobId: string;
  sourceContentId: string;
  brandProfileId: string;
  targetPlatforms: BrandPlatform[];
  status: RepurposeJobStatus;
  stage?: string | null;
  message?: string | null;
  error?: string | null;
  provider?: string | null;
  model?: string | null;
  variantIds: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ContentVariant {
  id: string;
  sourceContentId: string;
  jobId: string;
  brandProfileId: string;
  platform: BrandPlatform;
  title: string;
  body: string;
  status: ContentVariantStatus;
  distributionStatus: ContentVariantDistributionStatus;
  generationAttempt: number;
  characterCount: number;
  characterLimit?: number | null;
  critiqueHistory: CritiqueEntry[];
  referencedContentIds: string[];
  confidence?: number | null;
  provider?: string | null;
  model?: string | null;
  cached: boolean;
  createdDraftContentId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVariantList {
  data: ContentVariant[];
  total: number;
}

export interface RejectVariantInput {
  critique: string;
}

export interface UpdateVariantDistributionStatusInput {
  distributionStatus: ContentVariantDistributionStatus;
}

export interface SendToSandboxResult {
  variantId: string;
  draftContent: ContentNode;
}

export interface RadarGithubConfig {
  owner: string;
  repo: string;
  eventTypes: RadarGithubEventType[];
  releaseFilter: RadarGithubReleaseFilter;
  aiFilterEnabled: boolean;
  aiFilterInstructions?: string | null;
}

export interface RadarSource {
  id: string;
  name: string;
  sourceType: RadarSourceType;
  endpoint: string;
  httpMethod: string;
  requestParams: Record<string, unknown>;
  headers: Record<string, string>;
  authScheme: RadarAuthScheme;
  authHeaderName?: string | null;
  authQueryParamName?: string | null;
  secretRef?: string | null;
  hasSecret: boolean;
  enabled: boolean;
  cadence?: string | null;
  cadenceIntervalHours?: number | null;
  lastScrapedAt?: string | null;
  githubConfig?: RadarGithubConfig | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRadarSourceInput {
  name: string;
  sourceType: RadarSourceType;
  endpoint: string;
  httpMethod?: string;
  requestParams?: Record<string, unknown>;
  headers?: Record<string, string>;
  authScheme?: RadarAuthScheme;
  authHeaderName?: string | null;
  authQueryParamName?: string | null;
  /** Write-only; stored in Secrets Manager, never returned. */
  secretToken?: string | null;
  enabled?: boolean;
  cadence?: string | null;
  cadenceIntervalHours?: number | null;
  githubConfig?: RadarGithubConfig | null;
}

export interface UpdateRadarSourceInput {
  name?: string;
  sourceType?: RadarSourceType;
  endpoint?: string;
  httpMethod?: string;
  requestParams?: Record<string, unknown>;
  headers?: Record<string, string>;
  authScheme?: RadarAuthScheme;
  authHeaderName?: string | null;
  authQueryParamName?: string | null;
  /** Write-only; explicit null clears stored secret. */
  secretToken?: string | null;
  enabled?: boolean;
  cadence?: string | null;
  cadenceIntervalHours?: number | null;
  githubConfig?: RadarGithubConfig | null;
}

export interface RadarSettings {
  syncCadence: RadarSyncCadence;
  syncStartTime: string;
  syncTimezone: string;
  syncIntervalHours?: number | null;
  syncDayOfWeek?: number | null;
  hasTavilyKey: boolean;
  scheduledSyncEligible: boolean;
  lastRunAt?: string | null;
  nextDueAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRadarSettingsInput {
  syncCadence?: RadarSyncCadence;
  syncStartTime?: string | null;
  syncTimezone?: string | null;
  syncIntervalHours?: number | null;
  syncDayOfWeek?: number | null;
  /** Write-only; explicit null removes stored key. */
  tavilyApiKey?: string | null;
}

export interface RadarSourceCadenceSuggestion {
  sourceId: string;
  sourceName: string;
  enoughData: boolean;
  sampleSize: number;
  medianGapHours?: number | null;
  suggestedCadence?: RadarSyncCadence | null;
  suggestedIntervalHours?: number | null;
  message: string;
}

export interface RadarSuggestedCadences {
  suggestions: RadarSourceCadenceSuggestion[];
}

export interface RadarItem {
  id: string;
  sourceId?: string | null;
  sourceName?: string | null;
  itemType: RadarItemType;
  title: string;
  summary?: string | null;
  url?: string | null;
  repositoryUrl?: string | null;
  publishedAt?: string | null;
  relevanceScore: number;
  matchedPillars: string[];
  aiRelevant?: boolean | null;
  aiRelevanceScore?: number | null;
  aiRationale?: string | null;
  userRelevant?: boolean | null;
  userRelevanceMarkedAt?: string | null;
  metadata?: Record<string, unknown>;
  userId: string;
  createdAt: string;
}

export interface RadarRunStartAccepted {
  runId: string;
  status: string;
  trigger: string;
}

export interface RadarRunSourceResult {
  sourceId: string;
  sourceName: string;
  status: 'succeeded' | 'failed';
  itemsDiscovered: number;
  itemsCreated: number;
  error?: string | null;
}

export interface RadarRunSummary {
  id: string;
  status: string;
  trigger: string;
  runKind: string;
  sourcesTotal: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  itemsDiscovered: number;
  itemsCreated: number;
  errorSummary?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RadarRunDetail = RadarRunSummary & {
  sourceResults: RadarRunSourceResult[];
};

export type RadarDiscoveryRunStatus =
  | 'queued'
  | 'running'
  | 'pausing'
  | 'paused'
  | 'cancelling'
  | 'cancelled'
  | 'completed'
  | 'failed';

export type RadarDiscoveryCandidateVerdict = 'relevant' | 'not_relevant';

export type RadarDiscoveryCandidateStatus =
  | 'pending'
  | 'evaluating'
  | 'completed'
  | 'failed'
  | 'saved';

export interface RadarDiscoveryProfileSelectionInput {
  profileId: string;
  pillars: string[];
}

export interface StartRadarDiscoveryRunInput {
  profileSelections: RadarDiscoveryProfileSelectionInput[];
  customTopics: string[];
}

export interface RadarDiscoveryProfileSnapshot {
  profileId: string;
  profileName: string;
  activeVersionId?: string | null;
  description?: string | null;
  targetAudience?: string | null;
  selectedPillars: string[];
}

export interface RadarDiscoveryProgress {
  queriesTotal: number;
  queriesCompleted: number;
  candidatesDiscovered: number;
  candidatesEvaluated: number;
  candidatesRelevant: number;
  candidatesNotRelevant: number;
  candidatesFailed: number;
}

export interface RadarDiscoveryRunSummary {
  runId: string;
  status: RadarDiscoveryRunStatus;
  phase: string;
  pollAfterMs?: number | null;
  progress: RadarDiscoveryProgress;
  effectiveTopics: string[];
  profileNames: string[];
  currentActivity?: string | null;
  error?: string | null;
  heartbeatAt?: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  pausedAt?: string | null;
  completedAt?: string | null;
  deadlineAt?: string | null;
}

export type RadarDiscoveryRun = RadarDiscoveryRunSummary & {
  profileSnapshots: RadarDiscoveryProfileSnapshot[];
  customTopics: string[];
  generatedQueries: string[];
  userId?: string;
};

export interface RadarDiscoveryCandidate {
  id: string;
  runId: string;
  status: RadarDiscoveryCandidateStatus;
  title: string;
  url: string;
  snippet?: string | null;
  verdict?: RadarDiscoveryCandidateVerdict | null;
  rationale?: string | null;
  confidence?: number | null;
  matchedTopics: string[];
  sourceType?: RadarSourceType | null;
  endpoint?: string | null;
  suggestedName?: string | null;
  duplicateStatus: string;
  error?: string | null;
  savedSourceId?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  evaluatedAt?: string | null;
  savedAt?: string | null;
}

export interface RadarDiscoveryCandidateFilters {
  status?: string;
  verdict?: RadarDiscoveryCandidateVerdict;
}

export type RelationshipPriority = 'strategic' | 'active' | 'nurture' | 'watch';
export type RelationshipStage = 'target' | 'aware' | 'warm' | 'active' | 'collaborator' | 'paused';
export type RelationshipType =
  | 'creator'
  | 'founder'
  | 'operator'
  | 'investor'
  | 'engineer'
  | 'potentialCustomer'
  | 'partner'
  | 'mentor'
  | 'recruiter'
  | 'other';

export const RELATIONSHIP_PRIORITY_LABELS: Record<RelationshipPriority, string> = {
  strategic: 'Strategic',
  active: 'Active',
  nurture: 'Nurture',
  watch: 'Watch',
};

export const RELATIONSHIP_STAGE_LABELS: Record<RelationshipStage, string> = {
  target: 'Target',
  aware: 'Aware',
  warm: 'Warm',
  active: 'Active',
  collaborator: 'Collaborator',
  paused: 'Paused',
};

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  creator: 'Creator',
  founder: 'Founder',
  operator: 'Operator',
  investor: 'Investor',
  engineer: 'Engineer',
  potentialCustomer: 'Potential customer',
  partner: 'Partner',
  mentor: 'Mentor',
  recruiter: 'Recruiter',
  other: 'Other',
};

export interface CreatorConnection {
  id: string;
  name: string;
  targetProfileUrl?: string | null;
  handles: Record<string, string>;
  /** @deprecated Legacy; use relationshipPriority */
  tier?: string | null;
  relationshipPriority?: RelationshipPriority | null;
  relationshipStage?: RelationshipStage | null;
  relationshipType?: RelationshipType | null;
  desiredOutcome?: string | null;
  valueExchange?: string | null;
  followUpCadenceDays?: number | null;
  nextFollowUpAt?: string | null;
  nextAction?: string | null;
  conversationAngles: string[];
  personalContext?: string | null;
  tags: string[];
  lastInteractedAt?: string | null;
  notes?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionInteractionLog {
  id: string;
  connectionId: string;
  interactionType: string;
  channel?: string | null;
  interactionAt: string;
  evidenceUrl?: string | null;
  description?: string | null;
  creatorText?: string | null;
  responseVectorId?: string | null;
  platform?: string | null;
  platformPostId?: string | null;
  metadata: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
  connectionName?: string;
  targetProfileUrl?: string;
}

export interface TrackingMetric {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  growthMetricId?: string | null;
  unit?: string | null;
  direction: string;
  targetValue?: number | null;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionMetricLinks {
  connectionId: string;
  trackingMetricIds: string[];
  userId: string;
}

export interface RolodexMetricLinks {
  links: Record<string, string>;
  userId: string;
}

export interface RolodexResponseVectorItem {
  id: string;
  label: string;
  angle: string;
  draftText: string;
  rationale: string;
}

export interface RolodexResponseVectorsResult {
  vectors: RolodexResponseVectorItem[];
  confidence: number;
  provider?: string | null;
  model?: string | null;
  cached: boolean;
}

export interface CreateCreatorConnectionInput {
  name: string;
  targetProfileUrl?: string | null;
  handles?: Record<string, string>;
  tier?: string | null;
  relationshipPriority?: RelationshipPriority | null;
  relationshipStage?: RelationshipStage | null;
  relationshipType?: RelationshipType | null;
  desiredOutcome?: string | null;
  valueExchange?: string | null;
  followUpCadenceDays?: number | null;
  nextFollowUpAt?: string | null;
  nextAction?: string | null;
  conversationAngles?: string[];
  personalContext?: string | null;
  tags?: string[];
  lastInteractedAt?: string | null;
  notes?: string | null;
}

export interface UpdateCreatorConnectionInput {
  name?: string;
  targetProfileUrl?: string | null;
  handles?: Record<string, string>;
  tier?: string | null;
  relationshipPriority?: RelationshipPriority | null;
  relationshipStage?: RelationshipStage | null;
  relationshipType?: RelationshipType | null;
  desiredOutcome?: string | null;
  valueExchange?: string | null;
  followUpCadenceDays?: number | null;
  nextFollowUpAt?: string | null;
  nextAction?: string | null;
  conversationAngles?: string[];
  personalContext?: string | null;
  tags?: string[];
  lastInteractedAt?: string | null;
  notes?: string | null;
}

export interface CreateConnectionInteractionInput {
  interactionType?: string;
  channel?: string | null;
  interactionAt?: string | null;
  evidenceUrl?: string | null;
  description?: string | null;
  creatorText?: string | null;
  responseVectorId?: string | null;
  nextFollowUpAt?: string | null;
  platform?: string | null;
  platformPostId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateTrackingMetricInput {
  slug: string;
  name: string;
  description?: string | null;
  growthMetricId?: string | null;
  unit?: string | null;
  direction?: string;
  targetValue?: number | null;
}

export interface UpdateTrackingMetricInput {
  slug?: string;
  name?: string;
  description?: string | null;
  growthMetricId?: string | null;
  unit?: string | null;
  direction?: string;
  targetValue?: number | null;
  status?: string;
}

export interface RolodexResponseVectorInput {
  connectionId: string;
  creatorText: string;
  platform: BrandPlatform;
  profileId?: string | null;
  interactionIntent?: string | null;
}

export type ContentOpportunityStatus = 'SUGGESTED' | 'DISMISSED' | 'ACTIONED' | 'SUPERSEDED';

export type ContentOpportunitySearchOutcome =
  | 'found'
  | 'inactive'
  | 'exhausted'
  | 'noWorthy'
  | 'missingApiKey'
  | 'missingHandle'
  | 'unsupportedPlatform';

export interface ContentOpportunity {
  id: string;
  connectionId: string;
  platform: string;
  platformPostId: string;
  postUrl?: string | null;
  postText: string;
  authorUsername?: string | null;
  postedAt?: string | null;
  socialCapitalAngle?: string | null;
  rationale?: string | null;
  recommendedAction?: string | null;
  relevanceScore?: number | null;
  confidence?: number | null;
  status: ContentOpportunityStatus;
  searchRunId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentOpportunitySearchInput {
  platform?: string;
  profileId?: string | null;
}

export interface ContentOpportunitySearchResult {
  outcome: ContentOpportunitySearchOutcome;
  platform: string;
  reason?: string | null;
  newestPostAt?: string | null;
  candidatesConsidered: number;
  candidatesExcluded: number;
  opportunity?: ContentOpportunity | null;
  provider?: string | null;
  model?: string | null;
  confidence?: number | null;
  cached?: boolean | null;
}

export type ContentOpportunityListResponse = ApiResponse<
  PaginatedPersonalBranding<ContentOpportunity>
>;

export type ReconPostStatus = 'NEW' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';
export type ReconFollowSuggestionStatus = 'NEW' | 'ADDED' | 'DISMISSED';

export const RECON_POST_STATUS_LABELS: Record<ReconPostStatus, string> = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  ACTIONED: 'Actioned',
  DISMISSED: 'Dismissed',
};

export const RECON_RECOMMENDED_ACTION_LABELS: Record<string, string> = {
  reply: 'Reply',
  quote: 'Quote',
  like: 'Like',
  monitor: 'Monitor',
  skip: 'Skip',
};

export interface ReconFeedSettings {
  enabled: boolean;
  minRelevanceScore: number;
  maxPostsPerConnection: number;
  hasRapidApiKey: boolean;
  lastRunAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReconFeedSettingsInput {
  enabled?: boolean;
  minRelevanceScore?: number;
  maxPostsPerConnection?: number;
  rapidApiKey?: string | null;
}

export interface ReconPost {
  id: string;
  connectionId: string;
  connectionName?: string | null;
  platformPostId: string;
  authorUsername?: string | null;
  text: string;
  url?: string | null;
  postedAt?: string | null;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  relevanceScore?: number | null;
  relevanceRationale?: string | null;
  recommendedAction?: string | null;
  confidence?: number | null;
  status: ReconPostStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowSuggestion {
  id: string;
  xUsername: string;
  displayName?: string | null;
  bio?: string | null;
  followersCount?: number | null;
  profileUrl?: string | null;
  rationale?: string | null;
  confidence?: number | null;
  sharedConnectionIds: string[];
  status: ReconFollowSuggestionStatus;
  runId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconRunSummary {
  id: string;
  status: string;
  trigger: string;
  connectionsTotal: number;
  connectionsSucceeded: number;
  connectionsFailed: number;
  postsDiscovered: number;
  postsScored: number;
  followSuggestionsCreated: number;
  apiCallsUsed: number;
  errorSummary?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReconRunStartAccepted {
  runId: string;
  status: string;
  trigger: string;
}

export interface UpdateReconPostInput {
  status: ReconPostStatus;
}

export interface UpdateFollowSuggestionInput {
  status: ReconFollowSuggestionStatus;
}

export type BrandConfigResponse = ApiResponse<BrandConfig>;
export type BrandProfileListResponse = ApiResponse<PaginatedPersonalBranding<BrandProfile>>;
export type BrandProfileResponse = ApiResponse<BrandProfile>;
export type BrandProfileDetailResponse = ApiResponse<BrandProfileDetail>;
export type ProfileExtractionJobResponse = ApiResponse<ProfileExtractionJob>;
export type CreateProfileExtractionAcceptedResponse = ApiResponse<CreateProfileExtractionAccepted>;
export type PlatformRulesListResponse = ApiResponse<PaginatedPersonalBranding<PlatformRuleRecord>>;
export type PlatformRuleRecordResponse = ApiResponse<PlatformRuleRecord>;
export type PlatformRuleCatalogResponse = ApiResponse<PlatformRuleCatalog>;
export type EffectivePlatformRulesResponse = ApiResponse<EffectivePlatformRules>;
export type ContentNodeListResponse = ApiResponse<PaginatedPersonalBranding<ContentNode>>;
export type ContentNodeResponse = ApiResponse<ContentNode>;
export type ContentIdeaListResponse = ApiResponse<PaginatedPersonalBranding<ContentIdea>>;
export type ContentIdeaResponse = ApiResponse<ContentIdea>;
export type ApproveContentIdeaResponse = ApiResponse<ApproveContentIdeaResult>;
export type RejectedIdeaFeedbackListResponse = ApiResponse<
  PaginatedPersonalBranding<RejectedIdeaFeedback>
>;
export type ContentTemplateListResponse = ApiResponse<PaginatedPersonalBranding<ContentTemplate>>;
export type ContentTemplateResponse = ApiResponse<ContentTemplate>;
export type ContentTemplateCandidateListResponse = ApiResponse<
  PaginatedPersonalBranding<ContentTemplateCandidate>
>;
export type ApproveContentTemplateCandidateResponse =
  ApiResponse<ApproveContentTemplateCandidateResult>;
export type ContentTemplateSettingsApiResponse = ApiResponse<ContentTemplateSettings>;
export type RadarSourceListResponse = ApiResponse<PaginatedPersonalBranding<RadarSource>>;
export type RadarSourceResponse = ApiResponse<RadarSource>;
export type RadarSettingsResponse = ApiResponse<RadarSettings>;
export type RadarItemListResponse = ApiResponse<PaginatedPersonalBranding<RadarItem>>;
export type RadarRunStartAcceptedResponse = ApiResponse<RadarRunStartAccepted>;
export type RadarRunListResponse = ApiResponse<PaginatedPersonalBranding<RadarRunSummary>>;
export type RadarRunDetailResponse = ApiResponse<RadarRunDetail>;
export type RadarDiscoveryRunResponse = ApiResponse<RadarDiscoveryRun>;
export type RadarDiscoveryRunListResponse = ApiResponse<
  PaginatedPersonalBranding<RadarDiscoveryRun>
>;
export type RadarDiscoveryCandidateListResponse = ApiResponse<
  PaginatedPersonalBranding<RadarDiscoveryCandidate>
>;
export type CreatorConnectionListResponse = ApiResponse<
  PaginatedPersonalBranding<CreatorConnection>
>;
export type CreatorConnectionResponse = ApiResponse<CreatorConnection>;
export type ConnectionInteractionListResponse = ApiResponse<
  PaginatedPersonalBranding<ConnectionInteractionLog>
>;
export type ConnectionInteractionBoardListResponse = ApiResponse<
  PaginatedPersonalBranding<ConnectionInteractionLog>
>;
export type ConnectionInteractionLogResponse = ApiResponse<ConnectionInteractionLog>;
export type TrackingMetricListResponse = ApiResponse<PaginatedPersonalBranding<TrackingMetric>>;
export type TrackingMetricResponse = ApiResponse<TrackingMetric>;
export type ConnectionMetricLinksResponse = ApiResponse<ConnectionMetricLinks>;
export type RolodexMetricLinksResponse = ApiResponse<RolodexMetricLinks>;
export type ReconFeedSettingsResponse = ApiResponse<ReconFeedSettings>;
export type ReconPostListResponse = ApiResponse<PaginatedPersonalBranding<ReconPost>>;
export type ReconPostResponse = ApiResponse<ReconPost>;
export type FollowSuggestionListResponse = ApiResponse<PaginatedPersonalBranding<FollowSuggestion>>;
export type FollowSuggestionResponse = ApiResponse<FollowSuggestion>;
export type ReconRunStartAcceptedResponse = ApiResponse<ReconRunStartAccepted>;
export type ReconRunListResponse = ApiResponse<PaginatedPersonalBranding<ReconRunSummary>>;
export type ReconRunSummaryResponse = ApiResponse<ReconRunSummary>;
export type RolodexResponseVectorsPayload = {
  result: RolodexResponseVectorsResult;
  confidence: number;
  provider?: string | null;
  model?: string | null;
  cached: boolean;
};
