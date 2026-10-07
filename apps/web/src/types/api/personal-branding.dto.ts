import type { ApiResponse } from '@/types/api-contracts';

export type ContentStatus = 'DRAFT' | 'FINALIZED' | 'PIPELINED' | 'PUBLISHED' | 'SKIPPED';
export type ContentSourceType =
  | 'RADAR_INGESTED'
  | 'ON_DEMAND_AI'
  | 'MANUAL'
  | 'VAULT_EXTRACTED'
  | 'GOAL_COMPLETED'
  | 'WEEKLY_REVIEW_QUICK_WIN';
export type ContentType = 'DEEP_DIVE_BLOG' | 'SOCIAL_THREAD' | 'VIDEO_SCRIPT';
export type ContentIdeaStatus = 'GENERATED' | 'APPROVED' | 'REJECTED' | 'DRAFTED';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  DEEP_DIVE_BLOG: 'Deep-Dive Blog',
  SOCIAL_THREAD: 'Social Thread',
  VIDEO_SCRIPT: 'Video Script',
};
export type BrandPlatform = 'linkedin' | 'x' | 'medium' | 'youtube' | 'instagram' | 'newsletter';

export type PlatformFormat =
  | 'simple_post'
  | 'carousel'
  | 'reel'
  | 'long_form'
  | 'short'
  | 'single_post'
  | 'article'
  | 'thread'
  | 'deep_dive'
  | 'briefing';
export type RepurposeJobStatus =
  | 'queued'
  | 'running'
  | 'cancelling'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

/** Documented Content Pipeline job stages (free-string on wire; UI maps labels). */
export type RepurposeJobStage =
  | 'queued'
  | 'loading_context'
  | 'searching_references'
  | 'waiting_keyword_research'
  | 'loading_platform_rules'
  | 'generating'
  | 'persisting'
  | 'complete'
  | 'failed'
  | string;

export const REPURPOSE_JOB_STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  loading_context: 'Loading context',
  searching_references: 'Searching references',
  waiting_keyword_research: 'Waiting for keyword research',
  loading_platform_rules: 'Loading platform rules',
  generating: 'Generating',
  persisting: 'Saving variant',
  complete: 'Complete',
  failed: 'Failed',
  cancelling: 'Cancelling',
  cancelled: 'Cancelled',
};
export type ContentVariantStatus = 'generated' | 'rejected' | 'sent_to_sandbox';
export type ContentVariantVersionOrigin = 'generation' | 'regenerate' | 'tweaks' | 'manual_save';
export type ContentVariantDistributionStatus = 'DRAFT' | 'READY' | 'SCHEDULED' | 'DEPLOYED';

export const CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS: Record<
  ContentVariantDistributionStatus,
  string
> = {
  DRAFT: 'Draft',
  READY: 'Ready',
  SCHEDULED: 'Scheduled',
  DEPLOYED: 'Published',
};

export interface ContentVariantEngagement {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
}

export interface ContentVariantGenerationSnapshot {
  toneMetrics: Record<string, number>;
  rhetoricalModes: Array<{ mode: string; strength: string }>;
  rhetoricalDevices: string[];
  appliedRuleIds: string[];
  tweakInstructions?: string | null;
}

export type PerformanceSuggestionType =
  | 'outperformed_baseline'
  | 'promote_tone_metrics'
  | 'promote_platform_rhetoric';

export interface PerformanceSuggestion {
  id: string;
  type: PerformanceSuggestionType;
  summary: string;
  winnerVariantId: string;
  baselineVariantId?: string | null;
  applied: boolean;
  proposedToneMetrics?: Record<string, number> | null;
  proposedRhetoricalModes?: Array<{ mode: string; strength: string }> | null;
  proposedRhetoricalDevices?: string[] | null;
  proposedRequirementsAppend?: string | null;
  targetRuleId?: string | null;
}

export interface VariantPerformanceCohortEntry {
  variantId: string;
  score: number;
  engagement?: ContentVariantEngagement | null;
  isBaseline: boolean;
  isWinner: boolean;
}

export interface VariantPerformanceInsights {
  sourceContentId: string;
  platform?: string | null;
  baselineVariantId?: string | null;
  winnerVariantId?: string | null;
  cohort: VariantPerformanceCohortEntry[];
  suggestions: PerformanceSuggestion[];
}

export interface ContentPerformanceInsights {
  sourceContentId: string;
  platforms: VariantPerformanceInsights[];
}

export interface ApplyPerformanceSuggestionResult {
  suggestionId: string;
  variantId: string;
  profileId?: string | null;
  ruleId?: string | null;
  appliedAt: string;
}

export interface ContentVariantSandboxContent {
  id: string;
  status: ContentStatus;
  title: string;
}

export interface ContentAdaptationSourceSummary {
  id: string;
  title: string;
  platform?: BrandPlatform | null;
  status: ContentStatus;
}

export interface CrossPostLink {
  variantId: string;
  platform: BrandPlatform;
  title: string;
  status: ContentVariantStatus;
  distributionStatus: ContentVariantDistributionStatus;
  platformUrl?: string | null;
  postedAt?: string | null;
  isActive: boolean;
}

export interface ContentAdaptations {
  sourceContent: ContentAdaptationSourceSummary;
  adaptations: CrossPostLink[];
  total: number;
}

export type RadarSourceType = 'RSS' | 'API' | 'GITHUB_REPO';
export type RadarResponseFormat = 'JSON' | 'XML';
export type RadarAuthScheme = 'BEARER' | 'HEADER' | 'QUERY' | 'NONE';
export type SyncCadence = 'EVERY_N_HOURS' | 'DAILY' | 'WEEKLY' | 'MANUAL_ONLY';
export type RadarSyncCadence = SyncCadence;
export type RadarItemType =
  | 'ARTICLE'
  | 'REPOSITORY'
  | 'COMMIT'
  | 'RELEASE'
  | 'ISSUE'
  | 'PULL_REQUEST';

export type RadarUserIrrelevanceReason =
  | 'offBrand'
  | 'duplicate'
  | 'tooBasic'
  | 'outdated'
  | 'wrongAudience'
  | 'other';
export type RadarGithubEventType = 'COMMITS' | 'RELEASES' | 'ISSUES' | 'PULL_REQUESTS';
export type RadarGithubReleaseFilter = 'ALL' | 'MAJOR_ONLY' | 'MINOR_AND_ABOVE';

export const SYNC_CADENCE_LABELS: Record<SyncCadence, string> = {
  EVERY_N_HOURS: 'Every x hours',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MANUAL_ONLY: 'Manual only',
};

export const RADAR_SYNC_CADENCE_LABELS: Record<RadarSyncCadence, string> = SYNC_CADENCE_LABELS;

export const SYNC_WEEKDAY_LABELS: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

export const RADAR_SYNC_WEEKDAY_LABELS: Record<number, string> = SYNC_WEEKDAY_LABELS;

export const RADAR_SOURCE_TYPE_LABELS: Record<RadarSourceType, string> = {
  RSS: 'RSS feed',
  API: 'API endpoint',
  GITHUB_REPO: 'GitHub repository',
};

export const RADAR_RESPONSE_FORMAT_LABELS: Record<RadarResponseFormat, string> = {
  JSON: 'JSON',
  XML: 'XML',
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
  | 'cancelling'
  | 'succeeded'
  | 'succeeded_with_warnings'
  | 'failed'
  | 'cancelled';

export type ExtractionJobStage =
  | 'queued'
  | 'uploading'
  | 'reading_sources'
  | 'parsing_sources'
  | 'analyzing_sources'
  | 'analyzing'
  | 'reducing'
  | 'saving'
  | 'cancelling'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ExtractionSourceRunStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export type ExtractionSourceFreshness = 'never' | 'fresh' | 'aging' | 'stale';

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
  platforms?: BrandPlatform[];
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
  platforms?: BrandPlatform[];
}

export interface UpdateBrandProfileInput {
  name?: string;
  description?: string | null;
  pillars?: string[];
  targetAudience?: string | null;
  toneMetrics?: Record<string, number> | null;
  bannedPhrases?: string[];
  status?: BrandProfileStatus;
  platforms?: BrandPlatform[] | null;
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

/** Client-side telemetry while starting an extraction session (S3 upload phase). */
export interface ProfileExtractionClientProgress {
  phase: 'uploading' | 'registering_sources' | 'starting' | 'done';
  filesCompleted: number;
  filesTotal: number;
  bytesUploaded: number;
  bytesTotal: number;
  jobId?: string;
  profileId?: string;
  sourceTypesHint?: ProfileExtractionSourceType[];
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
  sourceTypes?: ProfileExtractionSourceType[] | null;
  sourceCount?: number | null;
  processedSourceCount?: number | null;
  parsedSourceCount?: number | null;
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
  lastExtractedAt?: string | null;
  lastExtractionStatus?: ExtractionSourceRunStatus | null;
  freshness?: ExtractionSourceFreshness;
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
  platformFormat?: PlatformFormat | null;
  title: string;
  body: string;
  confidence?: number | null;
  provider?: string | null;
  model?: string | null;
  cached: boolean;
  toneScores?: Record<string, number> | null;
  overallToneMatch?: number | null;
  toneBiasKey?: string | null;
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
  platformFormat?: PlatformFormat;
  provider?: string;
  model?: string;
  toneBiasKey?: string;
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
  example: string;
  enabledEffect: string;
  disabledEffect: string;
}

export interface PlatformLimitDefault {
  characterLimit: number;
  readTimeLimitMinutes: number;
}

export interface PlatformRuleCatalog {
  modes: PlatformRuleCatalogEntry[];
  devices: PlatformRuleCatalogEntry[];
  strengths: RhetoricalStrength[];
  wordsPerMinute: number;
  limitDefaults: Partial<Record<BrandPlatform, PlatformLimitDefault>>;
  ideaCountDefaults?: Partial<Record<BrandPlatform, number>>;
  ideaCountSoftMax?: Partial<Record<BrandPlatform, number>>;
}

export interface ResolvedPlatformPolicy {
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  wordMinimum?: number | null;
  wordLimit?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements?: string[] | string | null;
  appliedRuleIds: string[];
}

export interface PlatformRules {
  platform: BrandPlatform;
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements?: string[] | string | null;
  needsReview: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformRuleRecord {
  id: string;
  platform: BrandPlatform;
  name?: string | null;
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements?: string[] | string | null;
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
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes?: RhetoricalModeSetting[];
  rhetoricalDevices?: RhetoricalDeviceId[];
  requirements: string[] | string;
  profileIds?: string[];
}

export interface UpdatePlatformRuleInput {
  platform?: BrandPlatform;
  name?: string | null;
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes?: RhetoricalModeSetting[] | null;
  rhetoricalDevices?: RhetoricalDeviceId[] | null;
  requirements?: string[] | string | null;
  profileIds?: string[] | null;
}

export interface EffectivePlatformRules {
  platform: BrandPlatform;
  profileId?: string | null;
  rules: PlatformRuleRecord[];
  resolvedPolicy: ResolvedPlatformPolicy;
  ideaCountDefault?: number;
  ideaCountSoftMax?: number;
}

export interface PlatformRuleSetPreviewInput {
  platform: BrandPlatform;
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  requirements?: string[] | string;
  rhetoricalModes?: RhetoricalModeSetting[];
  rhetoricalDevices?: RhetoricalDeviceId[];
  brandProfileId?: string | null;
  brandProfileIds?: string[];
  sampleText?: string | null;
  provider?: string | null;
  model?: string | null;
}

export type PlatformRuleSetPreviewValidationSeverity = 'warning' | 'info';

export interface PlatformRuleSetPreviewValidationIssue {
  id: string;
  code: string;
  severity: PlatformRuleSetPreviewValidationSeverity;
  message: string;
  requirementLine?: string | null;
}

export interface PlatformRuleSetPreviewResult {
  sampleText: string;
  body: string;
  appliedPolicy: ResolvedPlatformPolicy;
  validationIssues?: PlatformRuleSetPreviewValidationIssue[];
  appliedInfluences?: PlatformRuleSetInfluenceItem[];
}

export type PlatformRulePreviewJobStatus =
  | 'queued'
  | 'drafting'
  | 'critiquing'
  | 'polishing'
  | 'validating'
  | 'succeeded'
  | 'failed'
  | 'cancelling'
  | 'cancelled';

export interface PlatformRulePreviewJobStart {
  jobId: string;
  status: PlatformRulePreviewJobStatus;
  pollAfterMs: number;
}

export interface PlatformRulePreviewJob {
  jobId: string;
  status: PlatformRulePreviewJobStatus;
  stage?: string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  provider?: string | null;
  model?: string | null;
  fingerprint?: string | null;
  result?: PlatformRuleSetPreviewResult | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export type PlatformRuleSetInfluenceKind = 'mode' | 'device' | 'requirement' | 'limit';

export interface PlatformRuleSetInfluenceItem {
  kind: PlatformRuleSetInfluenceKind;
  id: string;
  summary: string;
  previewExcerpt: string;
  sampleExcerpt?: string | null;
}

export interface PlatformRuleSetInfluenceInput {
  platform: BrandPlatform;
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  requirements?: string[] | string;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  brandProfileId?: string | null;
  brandProfileIds?: string[];
  sampleText: string;
  body: string;
  provider?: string | null;
  model?: string | null;
}

export interface PlatformRuleSetInfluenceResult {
  appliedInfluences: PlatformRuleSetInfluenceItem[];
}

export type KeywordResearchStatus = 'validated' | 'unavailable';

export interface KeywordMetricSnapshot {
  keyword: string;
  searchVolume?: number | null;
  competition?: number | null;
  competitionLevel?: string | null;
  cpc?: number | null;
  hasData?: boolean;
}

export interface KeywordResearchEvidence {
  status: KeywordResearchStatus;
  primaryKeyword?: string | null;
  secondaryKeywords?: string[];
  metrics?: KeywordMetricSnapshot[];
  locationCode: number;
  languageCode: string;
  researchedAt: string;
  cacheHitCount?: number;
  warning?: string | null;
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
  platform?: BrandPlatform | null;
  canonicalUrl?: string | null;
  assetPrompts?: Record<string, unknown> | null;
  tags: string[];
  pillars: string[];
  keywordResearch?: KeywordResearchEvidence | null;
  crossPostLinks?: CrossPostLink[];
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
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
  platform?: BrandPlatform | null;
  canonicalUrl?: string | null;
  tags?: string[];
  pillars?: string[];
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
}

export interface UpdateContentNodeInput {
  title?: string;
  body?: string | null;
  status?: ContentStatus;
  contentType?: ContentType | null;
  platform?: BrandPlatform | null;
  canonicalUrl?: string | null;
  assetPrompts?: Record<string, unknown> | null;
  tags?: string[] | null;
  pillars?: string[] | null;
  linkedGoalIds?: string[] | null;
  linkedTaskIds?: string[] | null;
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
  enableImageSearch?: boolean;
  status: ContentIdeaStatus;
  draftNodeId?: string | null;
  vaultItemIds?: string[] | null;
  vaultItemSnapshots?: VaultItemSnapshot[] | null;
  radarItemIds?: string[] | null;
  radarItemSnapshots?: RadarItemSnapshot[] | null;
  keywordResearch?: KeywordResearchEvidence | null;
  linkedGoalIds?: string[];
  linkedTaskIds?: string[];
  matchedPillars?: string[];
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

export type ContentIdeaRejectFeedbackCategory =
  | 'offBrand'
  | 'tooGeneric'
  | 'duplicate'
  | 'wrongPlatform'
  | 'lowLeverage';

export const CONTENT_IDEA_REJECT_CATEGORY_LABELS: Record<
  ContentIdeaRejectFeedbackCategory,
  string
> = {
  offBrand: 'Off-brand',
  tooGeneric: 'Too generic',
  duplicate: 'Duplicate',
  wrongPlatform: 'Wrong platform',
  lowLeverage: 'Low leverage',
};

export const CONTENT_IDEA_REJECT_CATEGORIES: {
  id: ContentIdeaRejectFeedbackCategory;
  label: string;
}[] = (
  Object.entries(CONTENT_IDEA_REJECT_CATEGORY_LABELS) as [
    ContentIdeaRejectFeedbackCategory,
    string,
  ][]
).map(([id, label]) => ({ id, label }));

export interface GenerateContentIdeasInput {
  brandProfileId: string;
  targetPlatform: BrandPlatform;
  seedIdeas?: string | null;
  boostFromRecentPublishes?: boolean;
  count?: number;
  enableImageSearch?: boolean;
  enableKeywordResearch?: boolean;
  provider?: string | null;
  model?: string | null;
  idempotencyKey?: string;
}

export interface GenerateVaultIdeasInput {
  brandProfileId: string;
  vaultItemIds: string[];
  targetPlatform: BrandPlatform;
  count?: number;
  enableImageSearch?: boolean;
  provider?: string | null;
  model?: string | null;
  idempotencyKey?: string;
}

export interface RadarItemSnapshot {
  id: string;
  title: string;
  url?: string | null;
  sourceName?: string | null;
}

export interface VaultItemSnapshot {
  id: string;
  title: string;
  type: string;
}

export interface GenerateRadarIdeasInput {
  brandProfileId: string;
  radarItemIds: string[];
  targetPlatform: BrandPlatform;
  templateIds?: string[] | null;
  count?: number;
  imageIdeaCount?: number;
  provider?: string | null;
  model?: string | null;
  idempotencyKey?: string;
}

export interface ReferencedPublishedHint {
  contentNodeId: string;
  title: string;
  adaptedPlatforms: BrandPlatform[];
}

export type ContentIdeaReferenceSearchMode = 'semantic' | 'recentBoost' | 'none';

export interface ContentIdeaGenerationContextStats {
  rejectedFeedbackCount: number;
  rejectedCategoryCounts?: Record<string, number>;
  existingGeneratedCount: number;
  existingDraftedCount?: number;
  targetPlatform: BrandPlatform;
  referencedPublishedCount: number;
  referenceSearchMode?: ContentIdeaReferenceSearchMode;
  referencedPublishedHints?: ReferencedPublishedHint[];
  publishedOutcomesCount?: number;
  similarityDroppedCount?: number;
  similarityGateApplied?: boolean;
  refineApplied?: boolean;
  refineCritiqueRounds?: number;
  refinePolishRounds?: number;
  refineWarning?: string | null;
}

export interface GenerateContentIdeasResult {
  ideas: ContentIdea[];
  contextStats: ContentIdeaGenerationContextStats;
}

export type ContentIdeationJobStatus =
  | 'queued'
  | 'running'
  | 'cancelling'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ContentIdeationJobStage =
  | 'queued'
  | 'validating'
  | 'loading_context'
  | 'searching_references'
  | 'waiting_keyword_research'
  | 'generating'
  | 'persisting'
  | 'succeeded'
  | 'failed';

export type ContentIdeationJobSource = 'manual' | 'vault' | 'radar';

export interface ContentIdeationJobStart {
  jobId: string;
  status: ContentIdeationJobStatus;
  pollAfterMs: number;
  countEffective: number;
  countRequested?: number | null;
  countAdjustmentWarning?: string | null;
}

export interface ContentIdeationJob {
  jobId: string;
  status: ContentIdeationJobStatus;
  source?: ContentIdeationJobSource | null;
  stage?: ContentIdeationJobStage | string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  provider?: string | null;
  model?: string | null;
  result?: GenerateContentIdeasResult | null;
  keywordResearchStage?: string | null;
  keywordResearchWarning?: string | null;
  keywordResearchEvidence?: KeywordResearchEvidence | null;
  keywordResearchCandidates?: string[] | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export type SocialCapitalAngle =
  | 'knowledge'
  | 'perspective'
  | 'humor'
  | 'joinConnections'
  | 'warmth'
  | 'other';

export const SOCIAL_CAPITAL_ANGLE_LABELS: Record<SocialCapitalAngle, string> = {
  knowledge: 'Knowledge',
  perspective: 'Perspective',
  humor: 'Humor',
  joinConnections: 'Join connections',
  warmth: 'Warmth',
  other: 'Other',
};

export type SocialCurrencyAngle =
  | 'humor'
  | 'practicalValue'
  | 'identitySignal'
  | 'emotion'
  | 'hotTake'
  | 'authority'
  | 'trendHijack'
  | 'storyHook';

export const SOCIAL_CURRENCY_ANGLE_LABELS: Record<SocialCurrencyAngle, string> = {
  humor: 'Humor',
  practicalValue: 'Practical value',
  identitySignal: 'Identity signal',
  emotion: 'Emotion',
  hotTake: 'Hot take',
  authority: 'Authority',
  trendHijack: 'Trend hijack',
  storyHook: 'Story hook',
};

export type ContentStreamMemeFormat = 'imageMacro' | 'reaction' | 'situation';

export interface ContentStreamMemeSuggestion {
  concept: string;
  visualBrief: string;
  suggestedCaption?: string | null;
  format: ContentStreamMemeFormat;
  formatId?: string | null;
  formatName?: string | null;
}

export interface MemeFormatCatalogEntry {
  id: string;
  name: string;
  category: ContentStreamMemeFormat;
  description: string;
  visualTemplate: string;
  exampleHooks: string[];
  source: string;
  active: boolean;
  lastSeenAt?: string | null;
  sampleUrls: string[];
}

export interface MemeFormatCatalogListResponse {
  formats: MemeFormatCatalogEntry[];
  lastRefreshedAt?: string | null;
  sourceCounts: Record<string, number>;
}

export type ContentStreamMediaKind = 'image' | 'shortVideo' | 'carousel';

export interface ContentStreamMediaBrief {
  kind: ContentStreamMediaKind;
  concept: string;
  visualBrief: string;
  altText?: string | null;
  captionHook?: string | null;
  carouselSlides?: string[] | null;
}

export interface ContentStreamEngagementScores {
  replyBait: number;
  questionHook: number;
  bookmarkValue: number;
  shareability: number;
  overall: number;
}

export type ContentStreamPostStatus = 'pending' | 'kept' | 'discarded';

export type ContentStreamFeedback = 'up' | 'down';

export type ContentStreamJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ContentStreamSettings {
  platform: BrandPlatform;
  enabled: boolean;
  xUsername?: string | null;
  brandProfileId?: string | null;
  postsPerDay: number;
  syncCadence: SyncCadence;
  syncStartTime: string;
  syncEndTime?: string | null;
  syncTimezone: string;
  syncIntervalHours?: number | null;
  nextDueAt?: string | null;
  lastRunAt?: string | null;
  lastJobId?: string | null;
  lastErrorSummary?: string | null;
  dailyBudgetDate?: string | null;
  dailyGeneratedCount: number;
  remainingDailyBudget: number;
  hasRapidApiKey: boolean;
  liveNowFetchedAt?: string | null;
  liveNowSignalCount?: number;
  liveNowDiagnostics?: Record<string, unknown> | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentStreamSourceKind = 'recon' | 'radar' | 'vault' | 'now' | 'growth';

export interface ContentStreamPrimarySource {
  kind: ContentStreamSourceKind;
  id: string;
  label?: string | null;
  url?: string | null;
}

export interface ContentStreamThemeSource {
  themeKey: string;
  conceptName: string;
  postCount: number;
  authorCount: number;
  stanceSummary: string;
  contributingPostIds: string[];
}

export interface ContentStreamThemeSourcePost {
  id: string;
  authorUsername?: string | null;
  text: string;
  url?: string | null;
  postedAt?: string | null;
  claimText?: string | null;
  stance?: string | null;
  evidenceKind?: string | null;
}

export interface ContentStreamThemeSourcesResponse {
  posts: ContentStreamThemeSourcePost[];
}

export interface ContentStreamPost {
  id: string;
  platform: BrandPlatform;
  platformFormat: string;
  title?: string | null;
  body: string;
  socialCurrencyAngle: SocialCurrencyAngle;
  angleRationale: string;
  memeSuggestion?: ContentStreamMemeSuggestion | null;
  mediaBrief?: ContentStreamMediaBrief | null;
  primarySource?: ContentStreamPrimarySource | null;
  themeSource?: ContentStreamThemeSource | null;
  engagementScores?: ContentStreamEngagementScores | null;
  engagementRewritten?: boolean;
  status: ContentStreamPostStatus;
  feedbackAt?: string | null;
  pillars: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStreamJobStart {
  jobId: string;
  status: ContentStreamJobStatus;
  pollAfterMs: number;
}

export interface ContentStreamJob {
  jobId: string;
  status: ContentStreamJobStatus;
  stage?: string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  provider?: string | null;
  model?: string | null;
  createdPostIds: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ContentImageInsertion {
  query: string;
  imageUrl: string;
  alt: string;
  sourcePageUrl?: string | null;
  placementHint?: string | null;
}

export interface ContentImageInjectResult {
  contentId?: string | null;
  body: string;
  insertions: ContentImageInsertion[];
}

export type ContentImageInjectJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type ContentImageInjectJobStage =
  | 'queued'
  | 'planning'
  | 'searching'
  | 'ranking'
  | 'applying'
  | 'persisting'
  | 'succeeded'
  | 'failed';

export interface ContentImageInjectJobStart {
  jobId: string;
  status: ContentImageInjectJobStatus;
  pollAfterMs: number;
}

export interface ContentImageInjectJob {
  jobId: string;
  status: ContentImageInjectJobStatus;
  stage?: ContentImageInjectJobStage | string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  provider?: string | null;
  model?: string | null;
  result?: ContentImageInjectResult | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface InjectContentImagesInput {
  title: string;
  body: string;
  contentId?: string | null;
  contentType?: ContentType | null;
  provider?: string | null;
  model?: string | null;
}

export type ContentKeywordOptimizationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ContentKeywordOptimizationResult {
  applied: boolean;
  title?: string | null;
  body?: string | null;
  keywordResearch?: KeywordResearchEvidence | null;
  warning?: string | null;
}

export interface ContentKeywordOptimizationJobStart {
  jobId: string;
  status: ContentKeywordOptimizationJobStatus;
  pollAfterMs: number;
}

export interface ContentKeywordOptimizationJob {
  jobId: string;
  contentId: string;
  status: ContentKeywordOptimizationJobStatus;
  stage?: string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  result?: ContentKeywordOptimizationResult | null;
  warning?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface TopicSuggestion {
  topic: string;
  why: string;
  matchedPillars: string[];
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
  topics: TopicSuggestion[];
}

export type PlatformFitTier = 'high' | 'medium' | 'low';

export interface PlatformFitFactorScore {
  score: number;
  detail: string;
}

export interface PlatformFitPillarFactor extends PlatformFitFactorScore {
  matchedPillars: string[];
}

export interface PlatformFitRulesFactor extends PlatformFitFactorScore {
  appliedRuleIds: string[];
  characterLimit?: number | null;
  wordLimit?: number | null;
}

export interface PlatformFitFactors {
  lengthFit: PlatformFitFactorScore;
  structureFit: PlatformFitFactorScore;
  pillarFit: PlatformFitPillarFactor;
  rulesFit: PlatformFitRulesFactor;
}

export interface PlatformFitRecommendation {
  platform: BrandPlatform;
  score: number;
  fitTier: PlatformFitTier;
  rationale: string;
  factors: PlatformFitFactors;
}

export interface PlatformFitStructureSignals {
  headingCount: number;
  paragraphCount: number;
  listItemCount: number;
  threadable: boolean;
  longForm?: boolean;
  averageParagraphWords?: number;
}

export interface PlatformFitContentAnalysis {
  characterCount: number;
  wordCount: number;
  contentType?: ContentType | null;
  structureSignals: PlatformFitStructureSignals;
  matchedPillars: string[];
}

export interface PlatformFitSuggestionsResult {
  contentAnalysis: PlatformFitContentAnalysis;
  recommendations: PlatformFitRecommendation[];
  excludedSourcePlatform?: BrandPlatform | null;
}

export interface SuggestPlatformFitInput {
  contentId: string;
  brandProfileId: string;
  provider?: string | null;
  model?: string | null;
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
  pillars?: string[];
  idempotencyKey?: string;
}

export type ContentIdeaApproveJobStatus =
  | 'queued'
  | 'running'
  | 'cancelling'
  | 'succeeded'
  | 'failed';

export interface ContentIdeaApproveJobStart {
  jobId: string;
  status: ContentIdeaApproveJobStatus;
  pollAfterMs: number;
}

export type TemplateAdherenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface TemplateApplied {
  templateId: string;
  templateTitle: string;
  adherence: TemplateAdherenceLevel;
  note: string;
}

export interface ApproveContentIdeaResult {
  idea: ContentIdea;
  draft: ContentNode;
  templateApplied?: TemplateApplied | null;
}

export interface ContentIdeaApproveJob {
  jobId: string;
  ideaId: string;
  status: ContentIdeaApproveJobStatus;
  stage?: string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  provider?: string | null;
  model?: string | null;
  result?: ApproveContentIdeaResult | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
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

export type ContentTemplateAiJobKind = 'brainstorm' | 'extract' | 'retry';
export type ContentTemplateAiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ContentTemplateAiJobStart {
  jobId: string;
  status: ContentTemplateAiJobStatus;
  pollAfterMs: number;
}

export interface ContentTemplateAiJob {
  jobId: string;
  kind: ContentTemplateAiJobKind;
  status: ContentTemplateAiJobStatus;
  stage?: string | null;
  message?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  provider?: string | null;
  model?: string | null;
  result?:
    | BrainstormContentTemplatesResult
    | ExtractContentTemplatesResult
    | ContentTemplateCandidate
    | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ContentTemplateSettings {
  hasMediumApiKey: boolean;
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
  templateApplied?: TemplateApplied | null;
}

export interface ContentBodyEditInput {
  title: string;
  body: string;
  contentType: ContentType;
  platform?: BrandPlatform | null;
  pillars?: string[] | null;
  brandProfileId?: string | null;
  provider?: string | null;
  model?: string | null;
}

export interface ContentBodyEditResult {
  body: string;
  title?: string | null;
}

export interface CritiqueEntry {
  critique: string;
  createdAt: string;
}

export interface RepurposeTarget {
  platform: BrandPlatform;
  brandProfileId: string;
}

export interface StartRepurposeInput {
  targets: RepurposeTarget[];
  provider?: string | null;
  model?: string | null;
}

export interface StartRepurposeJobAccepted {
  jobId: string;
  platform: BrandPlatform;
  status: RepurposeJobStatus;
}

export interface StartRepurposeAccepted {
  sourceContentId: string;
  jobs: StartRepurposeJobAccepted[];
}

export interface RepurposeJobList {
  data: RepurposeJob[];
  total: number;
}

export interface RepurposeJob {
  jobId: string;
  sourceContentId: string;
  brandProfileId: string;
  platform: BrandPlatform;
  targetPlatforms: BrandPlatform[];
  status: RepurposeJobStatus;
  stage?: RepurposeJobStage | null;
  message?: string | null;
  error?: string | null;
  provider?: string | null;
  model?: string | null;
  variantIds: string[];
  keywordResearchStage?: string | null;
  keywordResearchWarning?: string | null;
  keywordResearchEvidence?: KeywordResearchEvidence | null;
  regenerateMode?: string | null;
  parentVariantId?: string | null;
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
  platformUrl?: string | null;
  postedAt?: string | null;
  engagement?: ContentVariantEngagement | null;
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
  sandboxContent?: ContentVariantSandboxContent | null;
  keywordResearch?: KeywordResearchEvidence | null;
  parentVariantId?: string | null;
  isActive?: boolean;
  versionOrigin?: ContentVariantVersionOrigin | null;
  queuedAt?: string | null;
  scheduledPublishAt?: string | null;
  publishReminderSentAt?: string | null;
  generationSnapshot?: ContentVariantGenerationSnapshot | null;
  appliedPerformanceSuggestionIds?: string[];
  performanceAppliedAt?: string | null;
  sourceContent?: ContentAdaptationSourceSummary | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVariantList {
  data: ContentVariant[];
  total: number;
}

export interface SaveVariantVersionInput {
  title: string;
  body: string;
}

export interface RejectVariantInput {
  critique: string;
}

export interface RegenerateVariantWithTweaksInput {
  toneMetrics?: Record<string, number>;
  rhetoricalModes?: RhetoricalModeSetting[];
  rhetoricalDevices?: RhetoricalDeviceId[];
  tweakInstructions?: string;
  provider?: string | null;
  model?: string | null;
}

export type VariantImprovementKind =
  | 'sharpen_hook'
  | 'tighten_opening'
  | 'increase_contrast'
  | 'strengthen_cta'
  | 'cut_fluff'
  | 'clarify_payoff';

export interface VariantImprovementSuggestion {
  id: string;
  kind: VariantImprovementKind;
  label: string;
  rationale: string;
  tweakInstructions: string;
}

export interface SuggestVariantImprovementsInput {
  provider?: string | null;
  model?: string | null;
}

export interface SuggestVariantImprovementsResult {
  variantId: string;
  suggestions: VariantImprovementSuggestion[];
}

export interface UpdateVariantDistributionStatusInput {
  distributionStatus?: ContentVariantDistributionStatus;
  scheduledPublishAt?: string | null;
  platformUrl?: string | null;
  postedAt?: string | null;
  engagement?: ContentVariantEngagement | null;
}

export interface PublishQueueList {
  data: ContentVariant[];
  total: number;
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

export type RadarSourceHealth = 'healthy' | 'degraded' | 'unhealthy' | 'paused';

export interface RadarSource {
  id: string;
  name: string;
  sourceType: RadarSourceType;
  endpoint: string;
  httpMethod: string;
  responseFormat?: RadarResponseFormat;
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
  lastScrapeStatus?: string | null;
  lastScrapeError?: string | null;
  lastItemsDiscovered?: number;
  lastItemsCreated?: number;
  lastItemsAlreadyAdded?: number;
  lastItemsFiltered?: number;
  health?: RadarSourceHealth;
  healthReason?: string;
  githubConfig?: RadarGithubConfig | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type RadarSourceYield = 'low' | 'neutral' | 'high';

export interface RadarSourceHealthWindowStats {
  itemsIngested: number;
  itemsRelevant: number;
}

export interface RadarSourceUserFeedbackStats {
  last7Days: number;
  last30Days: number;
}

export interface RadarSourceHealthWindows {
  last7Days: RadarSourceHealthWindowStats;
  last30Days: RadarSourceHealthWindowStats;
}

export interface RadarSourceAverageAiRelevance {
  score?: number | null;
  sampleSize: number;
}

export interface RadarSourceFailureRate {
  rate: number;
  failed: number;
  attempted: number;
}

export interface RadarSourceBrainstormContribution {
  windowSize: number;
  sessionsConsidered: number;
  sessionsContributed: number;
  ideasFromSource: number;
}

export interface RadarSourceProposedCadenceBump {
  cadence: RadarSyncCadence | string;
  cadenceIntervalHours?: number | null;
}

export interface RadarSourceHealthDetails {
  sourceId: string;
  sourceName: string;
  health: RadarSourceHealth;
  healthReason?: string;
  enabled: boolean;
  cadence?: string | null;
  cadenceIntervalHours?: number | null;
  windows: RadarSourceHealthWindows;
  userFeedback: RadarSourceUserFeedbackStats;
  averageAiRelevance: RadarSourceAverageAiRelevance;
  failureRate: RadarSourceFailureRate;
  brainstormContribution: RadarSourceBrainstormContribution;
  yield: RadarSourceYield;
  suggestedCadence: RadarSourceCadenceSuggestion;
  proposedCadenceBump: RadarSourceProposedCadenceBump;
}

export interface RadarFeedbackStats {
  irrelevantSignalsLast7Days: number;
  trainingExampleCount: number;
  trainingExampleLimit: number;
}

export interface CreateRadarSourceInput {
  name: string;
  sourceType: RadarSourceType;
  endpoint: string;
  httpMethod?: string;
  responseFormat?: RadarResponseFormat;
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
  responseFormat?: RadarResponseFormat;
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
  autoIdeationEnabled: boolean;
  autoIdeationTopN: number;
  autoIdeationStartTime: string;
  autoIdeationBrandProfileId?: string | null;
  autoIdeationBrandProfileIds: string[];
  autoIdeationTargetPlatform?: BrandPlatform | null;
  autoIdeationCount: number;
  autoIdeationImageIdeaCount: number;
  autoIdeationTemplateIds: string[];
  autoIdeationNotifyEmail: boolean;
  autoIdeationMinAiRelevanceScore?: number | null;
  autoIdeationExcludeSourceIds: string[];
  autoIdeationLastRunAt?: string | null;
  autoIdeationNextDueAt?: string | null;
  autoIdeationLastJobId?: string | null;
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
  autoIdeationEnabled?: boolean;
  autoIdeationTopN?: number;
  autoIdeationStartTime?: string | null;
  autoIdeationBrandProfileId?: string | null;
  autoIdeationBrandProfileIds?: string[] | null;
  autoIdeationTargetPlatform?: BrandPlatform | null;
  autoIdeationCount?: number;
  autoIdeationImageIdeaCount?: number;
  autoIdeationTemplateIds?: string[];
  autoIdeationNotifyEmail?: boolean;
  autoIdeationMinAiRelevanceScore?: number | null;
  autoIdeationExcludeSourceIds?: string[];
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

export interface RadarSourcePreviewItem {
  title: string;
  summary?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  itemType: RadarItemType;
  repositoryUrl?: string | null;
}

export interface RadarSourcePreviewInput {
  endpoint: string;
  /** Write-only; for protected feeds during create/edit. */
  secretToken?: string | null;
  /** Existing source; uses stored secret when hasSecret is true. */
  sourceId?: string | null;
}

export interface RadarSourcePreview {
  rawXml: string;
  rawXmlTruncated: boolean;
  contentType?: string | null;
  itemCount: number;
  items: RadarSourcePreviewItem[];
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
  userRelevanceReason?: RadarUserIrrelevanceReason | null;
  topicTags?: string[];
  matchedViewIds?: string[];
  metadata?: Record<string, unknown>;
  userId: string;
  createdAt: string;
}

export type RadarTagMatchMode = 'any' | 'all';

export interface RadarSavedViewFilters {
  q?: string | null;
  sourceIds?: string[] | null;
  minAiRelevanceScore?: number | null;
  tags?: string[] | null;
  tagMatch?: RadarTagMatchMode;
  publishedWithinDays?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  includeFiltered?: boolean;
}

export interface RadarSavedView {
  id: string;
  name: string;
  filters: RadarSavedViewFilters;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RadarSavedViewListResponse {
  data: RadarSavedView[];
}

export interface CreateRadarSavedViewInput {
  name: string;
  filters: RadarSavedViewFilters;
}

export interface UpdateRadarSavedViewInput {
  name?: string;
  filters?: RadarSavedViewFilters;
  enabled?: boolean;
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
  itemsAlreadyAdded: number;
  itemsCreated: number;
  itemsFiltered: number;
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
  itemsAlreadyAdded: number;
  itemsCreated: number;
  itemsFiltered: number;
  outcomesTruncated?: boolean;
  errorSummary?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RadarRunDetail = RadarRunSummary & {
  sourceResults: RadarRunSourceResult[];
};

export type RadarRunOutcomeDisposition = 'filtered' | 'alreadyAdded';

export type RadarRunOutcomeDropReason = 'aiFiltered' | 'alreadyAdded';

export interface RadarRunOutcome {
  id: string;
  runId: string;
  disposition: RadarRunOutcomeDisposition;
  dropReason: RadarRunOutcomeDropReason | string;
  sourceId: string;
  sourceName?: string | null;
  title?: string | null;
  url?: string | null;
  itemType?: string | null;
  fingerprint?: string | null;
  relevanceScore?: number | null;
  aiRelevanceScore?: number | null;
  aiRationale?: string | null;
  itemId?: string | null;
  createdAt: string;
}

export type RadarDiscoveryRunStatus =
  | 'queued'
  | 'running'
  | 'pausing'
  | 'paused'
  | 'cancelling'
  | 'cancelled'
  | 'completed'
  | 'failed';

export type RadarDiscoveryProbeStatus =
  | 'unprobed'
  | 'verified_feed'
  | 'verified_api'
  | 'no_feed'
  | 'error';

export type RadarDiscoveryContentKind = 'feed' | 'api' | 'article' | 'unknown';

export type RadarDiscoveryExtractionStatus =
  | 'skipped'
  | 'extracted'
  | 'failed'
  | 'budget_exhausted';

export interface RadarDiscoveryExtractedEndpoint {
  url: string;
  sourceType: RadarSourceType;
  label?: string | null;
  verified: boolean;
}

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
  resolvedEndpoint?: string | null;
  suggestedName?: string | null;
  contentKind?: RadarDiscoveryContentKind | null;
  probeStatus?: RadarDiscoveryProbeStatus | null;
  extractedEndpoints?: RadarDiscoveryExtractedEndpoint[];
  extractionStatus?: RadarDiscoveryExtractionStatus | null;
  duplicateStatus: string;
  error?: string | null;
  savedSourceId?: string | null;
  savedItemId?: string | null;
  userNotASource?: boolean | null;
  userNotASourceMarkedAt?: string | null;
  userDismissed?: boolean | null;
  userDismissedAt?: string | null;
  parentCandidateId?: string | null;
  origin?: string | null;
  latestParseJobId?: string | null;
  parseStatus?: string | null;
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

export type RadarDiscoveryParseJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type RadarDiscoveryParseJobPhase =
  | 'queued'
  | 'loading_page'
  | 'extracting'
  | 'probing'
  | 'persisting'
  | 'succeeded'
  | 'failed';

export interface RadarDiscoveryParseJobStart {
  jobId: string;
  status: RadarDiscoveryParseJobStatus;
  pollAfterMs: number;
}

export interface RadarDiscoveryParseJob {
  jobId: string;
  runId: string;
  candidateId: string;
  pageUrl: string;
  status: RadarDiscoveryParseJobStatus;
  phase?: RadarDiscoveryParseJobPhase | null;
  currentActivity?: string | null;
  pollAfterMs?: number | null;
  error?: string | null;
  extractedEndpoints?: RadarDiscoveryExtractedEndpoint[];
  createdCandidateIds: string[];
  proposedCount: number;
  verifiedCount: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  heartbeatAt?: string | null;
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
  preferredSocialCapitalAngles?: SocialCapitalAngle[];
  personalContext?: string | null;
  tags: string[];
  lastInteractedAt?: string | null;
  lastReconPostedAt?: string | null;
  notes?: string | null;
  replyVoiceGuidance?: string | null;
  replyVoiceGuidanceUpdatedAt?: string | null;
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
  preferredSocialCapitalAngles?: SocialCapitalAngle[];
  personalContext?: string | null;
  tags?: string[];
  lastInteractedAt?: string | null;
  notes?: string | null;
  replyVoiceGuidance?: string | null;
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
  preferredSocialCapitalAngles?: SocialCapitalAngle[];
  personalContext?: string | null;
  tags?: string[];
  lastInteractedAt?: string | null;
  notes?: string | null;
  replyVoiceGuidance?: string | null;
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
  | 'tooOld'
  | 'missingApiKey'
  | 'missingHandle'
  | 'unsupportedPlatform'
  | 'fetchFailed'
  | 'rankingFailed';

export interface ContentOpportunity {
  id: string;
  connectionId: string;
  platform: string;
  platformPostId: string;
  postUrl?: string | null;
  postText: string;
  authorUsername?: string | null;
  postedAt?: string | null;
  socialCapitalAngle?: SocialCapitalAngle | null;
  rationale?: string | null;
  rationaleBullets?: string[] | null;
  recommendedAction?: string | null;
  relevanceScore?: number | null;
  confidence?: number | null;
  status: ContentOpportunityStatus;
  searchRunId: string;
  dismissalFeedbackText?: string | null;
  dismissalFeedbackCategory?: string | null;
  suggestedReplyParams?: SuggestedReplyParams | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type ReplyGenerationMode = 'SIMPLE' | 'AGENT';

export type QuestionFirstBias = 'off' | 'on' | 'auto';

export type ReplyRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'PARTIAL' | 'FAILED';

export type ReplySuggestionStatus = 'SUGGESTED' | 'ACCEPTED' | 'REJECTED';

export type ReplyRejectionFeedbackCategory =
  | 'tooGeneric'
  | 'wrongTone'
  | 'tooCorporate'
  | 'wrongAngle'
  | 'wrongLength'
  | 'factualMiss'
  | 'mismatchedContext'
  | 'other';

export const REPLY_REJECT_CATEGORY_LABELS: Record<ReplyRejectionFeedbackCategory, string> = {
  tooGeneric: 'Too generic',
  wrongTone: 'Wrong tone / off-brand',
  tooCorporate: 'Too corporate / AI-polished',
  wrongAngle: 'Wrong angle',
  wrongLength: 'Wrong length',
  factualMiss: 'Factual miss / unsupported claim',
  mismatchedContext: 'Mismatched to post / relationship',
  other: 'Other',
};

export const REPLY_REJECT_CATEGORIES: { id: ReplyRejectionFeedbackCategory; label: string }[] = (
  Object.entries(REPLY_REJECT_CATEGORY_LABELS) as [ReplyRejectionFeedbackCategory, string][]
).map(([id, label]) => ({ id, label }));

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface SuggestedReplyParams {
  mode: ReplyGenerationMode;
  researchEnabled: boolean;
  vaultGroundingEnabled?: boolean;
  intelligenceTier?: string;
  reasoningEffort?: ReasoningEffort | string | null;
  suggestionCount: number;
  provider?: string | null;
  model?: string | null;
  settingsRationale?: string | null;
}

export interface CreateReplyRunInput {
  connectionId: string;
  opportunityId?: string | null;
  reconPostId?: string | null;
  platform: BrandPlatform;
  creatorText: string;
  platformPostId?: string | null;
  evidenceUrl?: string | null;
  profileId?: string | null;
  interactionIntent?: string | null;
  mode: ReplyGenerationMode;
  researchEnabled?: boolean;
  vaultGroundingEnabled?: boolean;
  includeOperatorBriefing?: boolean;
  provider?: string | null;
  model?: string | null;
  reasoningEffort?: string | null;
  suggestionCount?: number;
  questionFirstBias?: QuestionFirstBias;
  suggestedParamsJson?: Record<string, unknown> | null;
  platformFormat?: PlatformFormat | null;
  allowFullGenerationOnSparseText?: boolean;
}

export interface ResolveXContentInput {
  url?: string;
  authorUsername?: string;
  platformPostId?: string;
}

export interface ResolveXContentResult {
  authorUsername: string;
  displayName?: string | null;
  profileUrl?: string | null;
  bio?: string | null;
  evidenceUrl?: string | null;
  platformPostId?: string | null;
  creatorText?: string | null;
  matchedInTimeline: boolean;
  source: 'rapidapi' | 'metadata_only';
  warning?: string | null;
}

export interface ReplySuggestion {
  id: string;
  runId: string;
  connectionId: string;
  label: string;
  angle: string;
  draftText: string;
  rationale: string;
  researchCitationsJson?: unknown;
  mediaBrief?: ContentStreamMediaBrief | null;
  memeSuggestion?: ContentStreamMemeSuggestion | null;
  status: ReplySuggestionStatus;
  rejectionFeedbackText?: string | null;
  rejectionFeedbackCategory?: ReplyRejectionFeedbackCategory | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorBriefingSource {
  kind: 'vault';
  id: string;
  label?: string | null;
  url?: string | null;
}

export interface OperatorBriefing {
  markdown: string;
  mode: 'retrieved' | 'generated' | 'mixed';
  sourceVaultItemIds?: string[];
  sources?: OperatorBriefingSource[];
  generatedAt: string;
  forced?: boolean;
  learningCost?: ReconLearningCostTier | null;
  vaultItemId?: string | null;
}

export interface ReplyRun {
  id: string;
  connectionId: string;
  opportunityId?: string | null;
  platform: string;
  creatorText: string;
  platformPostId?: string | null;
  evidenceUrl?: string | null;
  interactionIntent?: string | null;
  mode: ReplyGenerationMode;
  researchEnabled: boolean;
  vaultGroundingEnabled: boolean;
  operatorBriefing?: OperatorBriefing | null;
  provider?: string | null;
  model?: string | null;
  reasoningEffort?: string | null;
  suggestionCount: number;
  questionFirstBias?: QuestionFirstBias;
  questionFirstApplied?: boolean;
  suggestedParamsJson?: Record<string, unknown> | null;
  platformFormat?: PlatformFormat | null;
  status: ReplyRunStatus;
  error?: string | null;
  confidence?: number | null;
  providerUsed?: string | null;
  modelUsed?: string | null;
  startedAt?: string | null;
  heartbeatAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  suggestions: ReplySuggestion[];
}

export type ReplyRunListResponse = ApiResponse<PaginatedPersonalBranding<ReplyRun>>;

export interface UpdateReplySuggestionInput {
  status: Extract<ReplySuggestionStatus, 'ACCEPTED' | 'REJECTED'>;
  feedbackText?: string | null;
  feedbackCategory?: ReplyRejectionFeedbackCategory | null;
}

export interface ReplyGenerationDraft {
  profileId: string;
  mode: ReplyGenerationMode;
  researchEnabled: boolean;
  vaultGroundingEnabled: boolean;
  includeOperatorBriefing: boolean;
  catalogModelId: string;
  reasoningEffort?: string | null;
  suggestionCount: number;
  questionFirstBias: QuestionFirstBias;
  platformFormat: PlatformFormat;
  allowFullGenerationOnSparseText?: boolean;
}

export interface UpdateContentOpportunityInput {
  status: Extract<ContentOpportunityStatus, 'DISMISSED' | 'ACTIONED'>;
  feedbackText?: string | null;
  feedbackCategory?: string | null;
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
  opportunities: ContentOpportunity[];
  provider?: string | null;
  model?: string | null;
  confidence?: number | null;
  cached?: boolean | null;
}

export type ContentOpportunityListResponse = ApiResponse<
  PaginatedPersonalBranding<ContentOpportunity>
>;

export type ReconPostStatus = 'NEW' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED' | 'EXPIRED';
export type ReconPostFeedbackVerdict = 'GOOD' | 'BAD';
export type ReconPostFeedbackCategory =
  | 'offTopic'
  | 'wrongAudience'
  | 'lowEngagementPotential'
  | 'staleOrNewsCycle'
  | 'authorNotWorthEngaging'
  | 'lowQualityPost'
  | 'alreadyCovered'
  | 'other';
export type ReconFollowSuggestionStatus = 'NEW' | 'ADDED' | 'DISMISSED';
export type ReconEntityType = 'person' | 'company' | 'product' | 'community' | 'media' | 'other';

export type FollowConfidenceVerdict = 'REJECTED' | 'CONFIRMED';

export interface FollowConfidenceFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface FollowConfidenceExplanation {
  summary: string;
  factors: FollowConfidenceFactor[];
  method: string;
  generatedAt: string;
}

export interface FollowConfidenceFeedback {
  verdict: FollowConfidenceVerdict;
  feedbackText?: string | null;
  suggestedConfidence?: number | null;
  createdAt: string;
}

export const RECON_POST_STATUS_LABELS: Record<ReconPostStatus, string> = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  ACTIONED: 'Actioned',
  DISMISSED: 'Dismissed',
  EXPIRED: 'Expired',
};

export const RECON_RECOMMENDED_ACTION_LABELS: Record<string, string> = {
  reply: 'Reply',
  quote: 'Quote',
  like: 'Like',
  monitor: 'Monitor',
  skip: 'Skip',
};

export type ReconLearningCostTier = 'low' | 'medium' | 'high' | 'max';

export const RECON_LEARNING_COST_LABELS: Record<ReconLearningCostTier, string> = {
  low: 'Easy',
  medium: 'Stretch',
  high: 'Hard',
  max: 'Expert',
};

export const RECON_ENTITY_TYPE_LABELS: Record<ReconEntityType, string> = {
  person: 'Person',
  company: 'Company',
  product: 'Product',
  community: 'Community',
  media: 'Media',
  other: 'Other',
};

export const RECON_DISMISS_CATEGORY_LABELS: Record<ReconPostFeedbackCategory, string> = {
  offTopic: 'Off-topic',
  wrongAudience: 'Wrong audience',
  lowEngagementPotential: 'Low engagement potential',
  staleOrNewsCycle: 'Stale / news cycle',
  authorNotWorthEngaging: 'Author not worth engaging',
  lowQualityPost: 'Low-quality post',
  alreadyCovered: 'Already covered',
  other: 'Other',
};

export const RECON_DISMISS_CATEGORIES: { id: ReconPostFeedbackCategory; label: string }[] = (
  Object.entries(RECON_DISMISS_CATEGORY_LABELS) as [ReconPostFeedbackCategory, string][]
).map(([id, label]) => ({ id, label }));

export interface ReconFeedSettings {
  enabled: boolean;
  syncCadence: SyncCadence;
  syncStartTime: string;
  syncEndTime?: string | null;
  syncTimezone: string;
  syncIntervalHours?: number | null;
  syncDayOfWeek?: number | null;
  minRelevanceScore: number;
  maxPostsPerConnection: number;
  maxPostAgeDays: number;
  trendStreamResearchEnabled: boolean;
  selectionGuidance?: string | null;
  selectionGuidanceUpdatedAt?: string | null;
  hasRapidApiKey: boolean;
  lastRunAt?: string | null;
  lastSuccessfulRunAt?: string | null;
  lastRunId?: string | null;
  lastRunStatus?: string | null;
  lastErrorSummary?: string | null;
  nextDueAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReconFeedSettingsInput {
  enabled?: boolean;
  syncCadence?: SyncCadence;
  syncStartTime?: string | null;
  syncEndTime?: string | null;
  syncTimezone?: string | null;
  syncIntervalHours?: number | null;
  syncDayOfWeek?: number | null;
  minRelevanceScore?: number;
  maxPostsPerConnection?: number;
  maxPostAgeDays?: number;
  trendStreamResearchEnabled?: boolean;
  selectionGuidance?: string | null;
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
  relevanceRationaleBullets?: string[] | null;
  recommendedAction?: string | null;
  suggestedAngle?: string | null;
  learningCost?: ReconLearningCostTier | null;
  socialCapitalAngle?: SocialCapitalAngle | null;
  confidence?: number | null;
  status: ReconPostStatus;
  feedbackVerdict?: ReconPostFeedbackVerdict | null;
  feedbackCategory?: ReconPostFeedbackCategory | string | null;
  feedbackText?: string | null;
  feedbackAt?: string | null;
  ingestSource?: 'recon' | 'live_now' | 'live_now_timeline' | null;
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
  confidenceExplanation?: FollowConfidenceExplanation | null;
  confidenceFeedback?: FollowConfidenceFeedback | null;
  sharedConnectionIds: string[];
  entityType?: ReconEntityType | null;
  status: ReconFollowSuggestionStatus;
  runId?: string | null;
  dismissalFeedbackText?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconRunActivityEntry {
  at: string;
  kind: string;
  connectionId?: string | null;
  handle?: string | null;
  platformPostId?: string | null;
  score?: number | null;
  rationale?: string | null;
  rationaleBullets?: string[] | null;
  message?: string | null;
  handles?: string[] | null;
  ingestFilterSummary?: ReconIngestFilterSummary | null;
  orphanAdoptionSummary?: ReconOrphanAdoptionSummary | null;
}

export interface ReconIngestFilterSummary {
  fetched: number;
  skippedCursor: number;
  skippedAge: number;
  skippedMissingPostedAt: number;
  skippedKnown: number;
  skippedFingerprint: number;
}

export interface ReconOrphanAdoptionSummary {
  candidates: number;
  adopted: number;
  skippedNoConnection: number;
  skippedAge: number;
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
  emailSentAt?: string | null;
  emailDigestItemCount?: number | null;
  phase?: string | null;
  currentActivity?: string | null;
  heartbeatAt?: string | null;
  pausedAt?: string | null;
  activityLog?: ReconRunActivityEntry[];
  ingestFilterSummary?: ReconIngestFilterSummary | null;
  orphanAdoptionSummary?: ReconOrphanAdoptionSummary | null;
  pollAfterMs?: number;
  cursorConnectionIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReconRunStartAccepted {
  runId: string;
  status: string;
  trigger: string;
}

export interface UpdateReconPostInput {
  status?: ReconPostStatus;
  feedbackVerdict?: ReconPostFeedbackVerdict | null;
  feedbackCategory?: ReconPostFeedbackCategory | null;
  feedbackText?: string | null;
}

export interface DistillSelectionGuidanceResult {
  proposedGuidance: string;
  sampleSize: number;
  provider?: string | null;
  model?: string | null;
}

export type DistillSelectionGuidanceResponse = ApiResponse<DistillSelectionGuidanceResult>;

export interface DistillReplyVoiceGuidanceResult {
  proposedGuidance: string;
  sampleSize: number;
  provider?: string | null;
  model?: string | null;
}

export type DistillReplyVoiceGuidanceResponse = ApiResponse<DistillReplyVoiceGuidanceResult>;

export interface UpdateFollowSuggestionInput {
  status: ReconFollowSuggestionStatus;
  feedbackText?: string | null;
  connection?: CreateCreatorConnectionInput | null;
}

export interface FollowSuggestionConnectionDraft {
  suggestionId: string;
  draft: CreateCreatorConnectionInput;
  draftSummary?: string | null;
  source: 'ai' | 'heuristic';
}

export type FollowSuggestionConnectionDraftResponse = ApiResponse<FollowSuggestionConnectionDraft>;

export interface SubmitFollowConfidenceFeedbackInput {
  verdict: FollowConfidenceVerdict;
  feedbackText?: string | null;
  suggestedConfidence?: number | null;
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
export type PlatformRulePreviewJobStartResponse = ApiResponse<PlatformRulePreviewJobStart>;
export type PlatformRulePreviewJobResponse = ApiResponse<PlatformRulePreviewJob>;
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
export type RadarRunOutcomeListResponse = ApiResponse<PaginatedPersonalBranding<RadarRunOutcome>>;
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

// --- In-Person Events ---

export type InPersonEventType =
  | 'conference'
  | 'meetup'
  | 'workshop'
  | 'networking'
  | 'hackathon'
  | 'talk'
  | 'other';

export type InPersonEventStatus =
  | 'NEW'
  | 'INTERESTED'
  | 'REGISTERED'
  | 'ATTENDED'
  | 'SKIPPED'
  | 'DISMISSED';

export type InPersonEventDateConfidence = 'exact' | 'approx' | 'unknown';

export type InPersonEventIrrelevanceReason =
  | 'offBrand'
  | 'wrongLocation'
  | 'wrongDate'
  | 'tooExpensive'
  | 'virtualOnly'
  | 'duplicate'
  | 'other';

export type EventDiscoveryRunStatus =
  | 'queued'
  | 'running'
  | 'cancelling'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface EventLocationStint {
  id: string;
  label: string;
  city: string;
  region?: string | null;
  country?: string | null;
  timezone: string;
  startDate: string;
  endDate: string;
  radiusMiles: number;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventDiscoverySettings {
  syncCadence: SyncCadence;
  syncStartTime: string;
  syncTimezone: string;
  syncIntervalHours?: number | null;
  syncDayOfWeek?: number | null;
  syncEndTime?: string | null;
  hasTavilyKey: boolean;
  lastRunAt?: string | null;
  lastSuccessfulRunAt?: string | null;
  lastRunId?: string | null;
  lastRunStatus?: string | null;
  lastErrorSummary?: string | null;
  nextDueAt?: string | null;
  interests: string[];
  eventTypes: InPersonEventType[];
  excludeKeywords: string[];
  lookaheadDays: number;
  maxPriceUsd?: number | null;
  minFitScore: number;
  createGrowthTaskEnabled: boolean;
  createTaskMinFitScore: number;
  brandProfileIds: string[];
  digestEmailEnabled: boolean;
}

export interface InPersonEvent {
  id: string;
  title: string;
  summary?: string | null;
  url?: string | null;
  sourceUrl?: string | null;
  organizer?: string | null;
  venueName?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  dateConfidence: InPersonEventDateConfidence;
  priceText?: string | null;
  eventType: InPersonEventType;
  topicTags: string[];
  aiFitScore?: number | null;
  aiFitRationale?: string | null;
  aiRelevant?: boolean | null;
  stintId?: string | null;
  status: InPersonEventStatus;
  userRelevant?: boolean | null;
  userRelevanceReason?: InPersonEventIrrelevanceReason | null;
  userRelevanceMarkedAt?: string | null;
  discoveryRunId?: string | null;
  growthTaskId?: string | null;
  manuallyAdded: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventDiscoveryCandidateOutcome = 'created' | 'duplicate' | 'filtered';
export type EventDiscoveryCandidateReason =
  | 'excludedKeyword'
  | 'noStintMatch'
  | 'belowFitScore'
  | 'outsideLookahead'
  | 'missingTitle';

export interface EventDiscoveryRunCandidate {
  title: string;
  city?: string | null;
  startsAt?: string | null;
  eventType?: string | null;
  fitScore?: number | null;
  sourceUrl?: string | null;
  outcome: EventDiscoveryCandidateOutcome;
  reason?: EventDiscoveryCandidateReason | null;
}

export interface EventDiscoveryRun {
  id: string;
  status: EventDiscoveryRunStatus;
  triggerKind: 'manual' | 'scheduled';
  phase: string;
  deadlineAt?: string | null;
  heartbeatAt?: string | null;
  queuedAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  queriesGenerated: number;
  resultsFetched: number;
  candidatesExtracted: number;
  eventsCreated: number;
  eventsDuplicate: number;
  eventsFiltered: number;
  scoringFailures?: number;
  inferredInterests?: string[];
  inferredEventTypes?: InPersonEventType[];
  inferenceSource?: 'brandProfilePillars' | 'none' | null;
  generatedQueries: string[];
  activityLog: Array<{ at: string; phase?: string | null; message: string }>;
  extractedEvents: EventDiscoveryRunCandidate[];
  errorSummary?: string | null;
  pollAfterMs?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateEventLocationStintInput = {
  label: string;
  city: string;
  region?: string | null;
  country?: string | null;
  timezone?: string;
  startDate: string;
  endDate: string;
  radiusMiles?: number;
  notes?: string | null;
};

export type UpdateEventLocationStintInput = Partial<CreateEventLocationStintInput>;

export type UpdateEventDiscoverySettingsInput = Partial<
  Omit<EventDiscoverySettings, 'hasTavilyKey'>
>;

export type CreateInPersonEventInput = {
  title: string;
  summary?: string | null;
  url?: string | null;
  sourceUrl?: string | null;
  organizer?: string | null;
  venueName?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  dateConfidence?: InPersonEventDateConfidence;
  priceText?: string | null;
  eventType?: InPersonEventType;
  topicTags?: string[];
  stintId?: string | null;
  status?: InPersonEventStatus;
};

export type UpdateInPersonEventInput = Partial<CreateInPersonEventInput> & {
  status?: InPersonEventStatus;
};

export type EventDiscoveryRunStartAccepted = {
  runId: string;
  status: string;
  trigger: string;
};

export type BrandProjectIdeaStatus = 'generated' | 'rejected' | 'completed';

export type BrandProjectRejectionCategory =
  | 'too_complex'
  | 'not_trending'
  | 'not_shareable'
  | 'off_niche'
  | 'already_exists'
  | 'other';

export type BrandProjectPostPlatform = 'x' | 'youtube' | 'linkedin' | 'other';

export interface BrandProjectBackgroundKnowledge {
  topic: string;
  why: string;
}

export interface BrandProjectTechnology {
  name: string;
  role: string;
  isTrending: boolean;
}

export interface BrandProjectTrendSource {
  radarItemId?: string | null;
  title: string;
  url?: string | null;
}

export interface BrandProjectBuildKitHarness {
  demo: {
    demoSurface: string;
    frontend: string;
    backend: string;
  };
  stack: {
    choices: Array<{ layer: string; choice: string; rationale: string }>;
    pulledSkills: Array<{ name: string; why: string }>;
  };
  codebaseMap: Array<{ path: string; purpose: string }>;
  waves: Array<{
    order: number;
    name: string;
    moduleNames: string[];
    dependsOn: string[];
    integrationPoint: string;
  }>;
}

export interface BrandProjectBuildKit {
  setupPrompt: string;
  cursorSkills: Array<{
    name: string;
    description: string;
    skillMarkdown: string;
  }>;
  modules: Array<{
    order: number;
    name: string;
    goal: string;
    prompt: string;
    dependsOn: string[];
  }>;
  generatedAt: string;
  provider?: string | null;
  model?: string | null;
  harness?: BrandProjectBuildKitHarness | null;
}

/** Ordered batch for `PATCH …/ideas/{ideaId}/build-kit`. CamelCase, no nulls. */
export type BuildKitPatchOperation =
  | {
      op: 'updateSkill';
      name: string;
      description?: string;
      skillMarkdown?: string;
    }
  | { op: 'removeSkill'; name: string }
  | { op: 'addSkill'; name: string; description: string; skillMarkdown: string }
  | {
      op: 'updateModule';
      order: number;
      name?: string;
      goal?: string;
      prompt?: string;
      dependsOn?: string[];
    }
  | { op: 'removeModule'; order: number }
  | {
      op: 'addModule';
      order: number;
      name: string;
      goal: string;
      prompt: string;
      dependsOn?: string[];
    }
  | { op: 'setSetupPrompt'; setupPrompt: string };

export interface BrandProjectKitRevisionItem {
  reason: string;
  operation: BuildKitPatchOperation;
}

export interface BrandProjectKitRevisionProposal {
  repo: string;
  baseGeneratedAt: string;
  summary: string;
  treeTruncated: boolean;
  items: BrandProjectKitRevisionItem[];
}

export interface BrandProjectIdea {
  id: string;
  title: string;
  oneLiner?: string | null;
  appealSummary?: string | null;
  demoHook?: string | null;
  tutorialAngle?: string | null;
  demoCritique?: string | null;
  backgroundKnowledge: BrandProjectBackgroundKnowledge[];
  technologies: BrandProjectTechnology[];
  difficulty?: string | null;
  estimatedHours?: number | null;
  trendSources: BrandProjectTrendSource[];
  batchId?: string | null;
  generatedForDate?: string | null;
  status: BrandProjectIdeaStatus;
  rejection?: {
    feedbackText: string;
    feedbackCategory?: BrandProjectRejectionCategory | null;
    rejectedAt: string;
  } | null;
  completion?: {
    completedAt: string;
    postLinks: Array<{ platform: BrandProjectPostPlatform; url: string }>;
  } | null;
  buildKit?: BrandProjectBuildKit | null;
  refineTranscript?: Array<{
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateBrandProjectsInput {
  count?: number;
  direction?: string;
  idempotencyKey?: string;
  /** 1–10 Trend Stream card ids. Omitted lets the worker pick the day's top 10. */
  radarItemIds?: string[];
}

export interface BrandProjectJob {
  jobId: string;
  jobType: 'ideation' | 'kit' | 'kitrevise';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  ideaIds: string[];
  droppedDuplicateCount: number;
  error?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  pollAfterMs?: number | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  proposal?: BrandProjectKitRevisionProposal | null;
}

export interface BrandProjectSettings {
  autoEnabled: boolean;
  dailyCount: number;
  startTime: string;
  brandProfileId?: string | null;
  direction?: string | null;
  nextDueAt?: string | null;
  lastRunAt?: string | null;
  lastJobId?: string | null;
}

export type UpdateBrandProjectSettingsInput = Partial<
  Pick<
    BrandProjectSettings,
    'autoEnabled' | 'dailyCount' | 'startTime' | 'brandProfileId' | 'direction'
  >
>;
