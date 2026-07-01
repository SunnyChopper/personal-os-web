import type { ApiResponse } from '@/types/api-contracts';

export type ContentStatus = 'DRAFT' | 'FINALIZED' | 'PIPELINED' | 'PUBLISHED' | 'SKIPPED';
export type ContentSourceType = 'RADAR_INGESTED' | 'ON_DEMAND_AI' | 'MANUAL';
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
export type RadarSourceType = 'RSS' | 'API';
export type RadarAuthScheme = 'BEARER' | 'HEADER' | 'QUERY' | 'NONE';
export type RadarSyncCadence = 'EVERY_6_HOURS' | 'DAILY' | 'WEEKLY' | 'MANUAL_ONLY';
export type RadarItemType = 'ARTICLE' | 'REPOSITORY';

export const RADAR_SYNC_CADENCE_LABELS: Record<RadarSyncCadence, string> = {
  EVERY_6_HOURS: 'Every 6 hours',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MANUAL_ONLY: 'Manual only',
};

export const RADAR_SOURCE_TYPE_LABELS: Record<RadarSourceType, string> = {
  RSS: 'RSS feed',
  API: 'API endpoint',
};

export const RADAR_ITEM_TYPE_LABELS: Record<RadarItemType, string> = {
  ARTICLE: 'Article',
  REPOSITORY: 'Repository',
};

export const RADAR_AUTH_SCHEME_LABELS: Record<RadarAuthScheme, string> = {
  BEARER: 'Bearer token',
  HEADER: 'Custom header',
  QUERY: 'Query parameter',
  NONE: 'None',
};
export type BrandProfileStatus = 'draft' | 'active' | 'extracting';
export type ExtractionJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type ExtractionJobStage =
  | 'queued'
  | 'reading_sources'
  | 'analyzing'
  | 'saving'
  | 'succeeded'
  | 'failed';

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

export type ProfileExtractionSourceType = 'text' | 'url' | 'pdf';

export interface ProfileExtractionSourceInput {
  title?: string | null;
  url?: string | null;
  text: string;
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
  pollAfterMs?: number | null;
  error?: string | null;
  provider?: string | null;
  model?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

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

export interface PlatformRules {
  platform: BrandPlatform;
  characterLimit?: number | null;
  formatStyle?: string | null;
  templateBody?: string | null;
  layoutConstraints: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformRuleRecord {
  id: string;
  platform: BrandPlatform;
  name?: string | null;
  characterLimit?: number | null;
  formatStyle?: string | null;
  templateBody?: string | null;
  layoutConstraints: Record<string, unknown>;
  tags: string[];
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
  formatStyle?: string | null;
  templateBody?: string | null;
  layoutConstraints?: Record<string, unknown> | null;
  tags?: string[];
  profileIds?: string[];
}

export interface UpdatePlatformRuleInput {
  platform?: BrandPlatform;
  name?: string | null;
  characterLimit?: number | null;
  formatStyle?: string | null;
  templateBody?: string | null;
  layoutConstraints?: Record<string, unknown> | null;
  tags?: string[] | null;
  profileIds?: string[] | null;
}

export interface EffectivePlatformRules {
  platform: BrandPlatform;
  profileId?: string | null;
  rules: PlatformRuleRecord[];
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
  contentType: ContentType;
  sourceType: ContentSourceType;
  sourceRefId?: string | null;
  targetPlatform?: BrandPlatform | null;
  tags: string[];
  status: ContentIdeaStatus;
  draftNodeId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentIdeaInput {
  title: string;
  summary?: string | null;
  angle?: string | null;
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

export interface ContentIdeaGenerationContextStats {
  rejectedFeedbackCount: number;
  existingGeneratedCount: number;
  targetPlatform: BrandPlatform;
}

export interface GenerateContentIdeasResult {
  ideas: ContentIdea[];
  contextStats: ContentIdeaGenerationContextStats;
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

export interface ApproveContentIdeaResult {
  idea: ContentIdea;
  draft: ContentNode;
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
  generationAttempt: number;
  characterCount: number;
  characterLimit?: number | null;
  critiqueHistory: CritiqueEntry[];
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

export interface SendToSandboxResult {
  variantId: string;
  draftContent: ContentNode;
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
  lastScrapedAt?: string | null;
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
}

export interface RadarSettings {
  syncCadence: RadarSyncCadence;
  hasTavilyKey: boolean;
  lastRunAt?: string | null;
  nextDueAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRadarSettingsInput {
  syncCadence?: RadarSyncCadence;
  /** Write-only; explicit null removes stored key. */
  tavilyApiKey?: string | null;
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
  userId: string;
  createdAt: string;
}

export interface RadarRunStartAccepted {
  runId: string;
  status: string;
  trigger: string;
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

export type RadarRunDetail = RadarRunSummary;

export interface RadarDiscoverySuggestion {
  name: string;
  sourceType: RadarSourceType;
  endpoint: string;
  rationale: string;
  confidence: number;
  duplicateStatus: string;
}

export interface RadarDiscoveryRun {
  runId: string;
  status: string;
  error?: string | null;
  suggestions: RadarDiscoverySuggestion[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface SaveRadarDiscoverySuggestionInput {
  name: string;
  sourceType: RadarSourceType;
  endpoint: string;
  enabled?: boolean;
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

export type BrandConfigResponse = ApiResponse<BrandConfig>;
export type BrandProfileListResponse = ApiResponse<PaginatedPersonalBranding<BrandProfile>>;
export type BrandProfileResponse = ApiResponse<BrandProfile>;
export type BrandProfileDetailResponse = ApiResponse<BrandProfileDetail>;
export type ProfileExtractionJobResponse = ApiResponse<ProfileExtractionJob>;
export type CreateProfileExtractionAcceptedResponse = ApiResponse<CreateProfileExtractionAccepted>;
export type PlatformRulesListResponse = ApiResponse<PaginatedPersonalBranding<PlatformRuleRecord>>;
export type PlatformRuleRecordResponse = ApiResponse<PlatformRuleRecord>;
export type EffectivePlatformRulesResponse = ApiResponse<EffectivePlatformRules>;
export type ContentNodeListResponse = ApiResponse<PaginatedPersonalBranding<ContentNode>>;
export type ContentNodeResponse = ApiResponse<ContentNode>;
export type ContentIdeaListResponse = ApiResponse<PaginatedPersonalBranding<ContentIdea>>;
export type ContentIdeaResponse = ApiResponse<ContentIdea>;
export type ApproveContentIdeaResponse = ApiResponse<ApproveContentIdeaResult>;
export type RejectedIdeaFeedbackListResponse = ApiResponse<
  PaginatedPersonalBranding<RejectedIdeaFeedback>
>;
export type RadarSourceListResponse = ApiResponse<PaginatedPersonalBranding<RadarSource>>;
export type RadarSourceResponse = ApiResponse<RadarSource>;
export type RadarSettingsResponse = ApiResponse<RadarSettings>;
export type RadarItemListResponse = ApiResponse<PaginatedPersonalBranding<RadarItem>>;
export type RadarRunStartAcceptedResponse = ApiResponse<RadarRunStartAccepted>;
export type RadarRunListResponse = ApiResponse<PaginatedPersonalBranding<RadarRunSummary>>;
export type RadarRunDetailResponse = ApiResponse<RadarRunDetail>;
export type RadarDiscoveryRunResponse = ApiResponse<RadarDiscoveryRun>;
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
export type RolodexResponseVectorsPayload = {
  result: RolodexResponseVectorsResult;
  confidence: number;
  provider?: string | null;
  model?: string | null;
  cached: boolean;
};
