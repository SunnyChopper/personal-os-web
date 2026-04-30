/** Daily Learning module DTOs (aligned with backend camelCase). */

export type LearningSourceKind = 'rss' | 'arxiv' | 'xList' | 'manualUrl';
export type LearningScope = 'trends' | 'theory' | 'both';
export type DigestChannel = 'trends' | 'theory';
export type DigestStatus = 'queued' | 'ready' | 'delivered' | 'archived';
export type DiscardReason =
  | 'belowThreshold'
  | 'mutedTopic'
  | 'duplicate'
  | 'stale'
  | 'sourceDisabled';
export type FeedbackType = 'moreLikeThis' | 'tooBasic' | 'tooAdvanced' | 'irrelevant';
export type FeedbackState = 'none' | 'moreLikeThis' | 'tooBasic' | 'tooAdvanced' | 'irrelevant';

export type AssistantThreadStrategy = 'reuseFixedThread' | 'newThreadEachRun';

export interface ManualTopicRule {
  topicKey: string;
  weightDelta: number;
}

export interface DailyLearningSettings {
  trendDeliveryTime: string;
  theoryDeliveryTime: string;
  timeZone?: string | null;
  trendsEnabled: boolean;
  theoryEnabled: boolean;
  /** When true, ingest pulls from curated discovery feeds beyond user-configured sources. */
  discoveryEnabled: boolean;
  /** When true, proactive automations keep email delivery enabled for Daily Learning streams. */
  deliveryEmailEnabled: boolean;
  /** How Assistant threads are created for each Daily Learning proactive run. */
  assistantThreadStrategy: AssistantThreadStrategy;
  ingestThresholdTrends: number;
  ingestThresholdTheory: number;
  manualTopicRules: ManualTopicRule[];
  theoryDifficultyFloor: number;
  topicFeedbackWeights: Record<string, number>;
  hiddenAutomationIds: Record<string, string | null | undefined>;
}

export interface IngestRunResult {
  ok: boolean;
  message: string;
  trendsItems: number;
  theoryItems: number;
  discarded: number;
}

export interface LearningSource {
  id: string;
  name: string;
  kind: LearningSourceKind;
  scope: LearningScope;
  enabled: boolean;
  url?: string | null;
  rssUrl?: string | null;
  arxivQuery?: string | null;
  xListId?: string | null;
  tags: string[];
  pollFrequencyMinutes: number;
  baseWeight: number;
  lastFetchedAt?: string | null;
  lastCursor?: string | null;
  healthStatus?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContextKeywordEntry {
  keyword: string;
  weight: number;
  provenance: string[];
}

/** GET /daily-learning/context */
export interface DailyLearningContextPayload {
  keywords: ContextKeywordEntry[];
  generatedAt: string;
  topAreas: string[];
  insightSummary: string;
  /** Optional LLM narrative; deterministic copy remains in insightSummary. */
  aiInsightSummary?: string;
  sourceMix: Record<string, number>;
}

export interface DigestItem {
  id: string;
  sourceId?: string | null;
  lessonTrackId?: string | null;
  lessonNodeId?: string | null;
  /** Where the item came from: user source vs heuristic discovery. */
  provenance?: 'userSource' | 'discovered';
  /** Hostname for discovered items (e.g. news.ycombinator.com). */
  originDomain?: string | null;
  /** Id for POST /daily-learning/source-suggestions/{id}/accept */
  discoverySuggestionId?: string | null;
  title: string;
  summary: string;
  url?: string | null;
  publishedAt?: string | null;
  relevanceScore: number;
  scoreBreakdown: Record<string, number>;
  matchedKeywords: string[];
  feedbackState: FeedbackState;
  vaultNoteId?: string | null;
  flashcardDeckId?: string | null;
  deepDiveCourseId?: string | null;
  taskId?: string | null;
}

export interface DailyDigest {
  id: string;
  digestDate: string;
  channel: DigestChannel;
  status: DigestStatus;
  deliveryTime: string;
  deliveredAt?: string | null;
  contextSnapshot: {
    topKeywords: string[];
    topAreas: string[];
    generatedAt: string;
  };
  items: DigestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscardLogEntry {
  id: string;
  digestDate: string;
  channel: DigestChannel;
  sourceId?: string | null;
  title: string;
  summary: string;
  url?: string | null;
  publishedAt?: string | null;
  relevanceScore: number;
  threshold: number;
  scoreBreakdown: Record<string, number>;
  matchedKeywords: string[];
  rejectedReason: DiscardReason;
  restoredAt?: string | null;
  restoredDigestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonTrackNode {
  id: string;
  title: string;
  summary: string;
  conceptKey: string;
  order: number;
  scheduledDate?: string | null;
  status: 'queued' | 'scheduled' | 'served' | 'completed' | 'skipped';
  prerequisites: string[];
  sourceDigestItemId?: string | null;
  generatedCourseId?: string | null;
  flashcardDeckId?: string | null;
}

export interface AiSourceSuggestion {
  name: string;
  kind: LearningSourceKind;
  scope: LearningScope;
  rationale: string;
  confidence: number;
  tags: string[];
  url?: string | null;
  rssUrl?: string | null;
  arxivQuery?: string | null;
}

export interface LearningSourceSuggestion {
  id: string;
  originDomain: string;
  candidateRssUrl?: string | null;
  candidateKind: string;
  hitCount: number;
  readyToPropose: boolean;
  lastTitle?: string | null;
  lastUrl?: string | null;
  channel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonTrack {
  id: string;
  title: string;
  subject: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  origin: 'manual' | 'aiPivot';
  pacing: { lessonsPerWeek: number; preferredMinutes: number };
  currentNodeId?: string | null;
  nextScheduledDate?: string | null;
  nodes: LessonTrackNode[];
  createdAt: string;
  updatedAt: string;
}
