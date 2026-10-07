import type { KnowledgeSurfaceSuggestion } from './knowledge-surface';

export type StaleEntityAction = 'archive' | 'kill' | 'revive';
export type CoachEscalationAction = 'acknowledgeCost' | 'startNow' | 'scheduleToday' | 'breakDown';
export type MetaProposalAction = 'approve' | 'reject' | 'later';
export type DecisionAction = StaleEntityAction | CoachEscalationAction | MetaProposalAction;

export interface AssistantDecisionRequest {
  id: string;
  kind: 'staleEntity' | 'coachEscalation' | 'metaProposal';
  entityType: 'project' | 'goal' | 'habit' | 'task';
  entityId: string;
  title: string;
  daysInactive?: number;
  rationale: string;
  suggestedNextAction: string;
  costStatement?: string;
  options: DecisionAction[];
  status: 'pending' | 'resolved' | 'expired';
  resolution?: {
    action: DecisionAction;
    resolvedAt: string;
    clientHints?: {
      deepLink?: string;
    };
  };
}

export interface CoachEscalationPendingItem {
  id: string;
  taskId: string;
  threadId: string;
  messageId: string;
  decisionId: string;
  level: string;
  avoidanceScore: number;
  taskTitle: string;
  costStatement: string;
  deepLink: string;
  decisionRequest: AssistantDecisionRequest;
  emailDelivered: boolean;
  webhookDelivered: boolean;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** Most recent persisted message time; drives sidebar ordering when set */
  lastMessageAt?: string;
  /** Plain-text body of latest message (Markdown stripped server-side; max 200 chars) */
  lastMessagePreview?: string;
  /** Role of the latest message (`user` | `assistant`) */
  lastMessageRole?: 'user' | 'assistant';
  /** True when the thread was created by proactive/scheduled automation */
  automationOriginated?: boolean;
  /** True when the thread was created from an ambient whisper Ask flow */
  whisperOriginated?: boolean;
  activeLeafMessageId?: string;
}

export interface SpecialistBrief {
  specialistId: string;
  displayName: string;
  headline: string;
  findings?: string[];
  recommendations?: string[];
  caveats?: string[];
  confidence?: 'low' | 'medium' | 'high';
}

export interface StatusEntry {
  stage:
    | 'planning'
    | 'runningTools'
    | 'consultingSpecialists'
    | 'responding'
    | 'persisting'
    | 'awaitingApproval'
    | 'approvalResolved';
  message?: string;
  startedAt: number;
  /** True when the planner chose a direct reply without invoking tools this turn. */
  noToolsInvoked?: boolean;
  /** When stage is awaitingApproval, matches WsToolApprovalRequiredPayload.approvalId */
  approvalId?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  /** Persisted execution trace steps for assistant messages (from messageComplete). */
  executionSteps?: StatusEntry[];
  /** Persisted tool call input/output for expandable trace when response is done. */
  toolCallDetails?: WsToolCallCompletePayload[];
  decisionRequests?: AssistantDecisionRequest[];
  clientStatus?: 'sending' | 'failed';
  clientError?: string;
  clientMessageId?: string;
  metadata?: {
    taskId?: string;
    goalId?: string;
    projectId?: string;
    action?: string;
    webSearch?: boolean;
    searchQuery?: string;
    editedFromMessageId?: string;
    assistantModelConfig?: AssistantRunConfig;
    proactiveAutomationId?: string;
    source?: string;
    inboundMessageId?: string;
    /** Local date (YYYY-MM-DD) for memory context on scheduled turns (e.g. Daily Briefing). */
    memoryContextDate?: string;
    /** Proactive scheduling: local calendar day for planner tools (YYYY-MM-DD). */
    plannerDateAnchor?: string;
    /** Proactive: run timestamp in the automation time zone (ISO string). */
    runLocalDateTime?: string;
    /** IANA time zone for proactive anchor fields. */
    runTimeZone?: string;
    /** Proactive automation kind (e.g. dailyBriefing, logbookEvening). */
    proactiveKind?: string;
    /** When true, server skips LTM priming for this turn. */
    skipLtmPriming?: boolean;
    /** Custom LTM search query for proactive daily briefing. */
    ltmPrimingQuery?: string;
    /** JIT knowledge artifact suggestions for this assistant turn. */
    knowledgeSurfaces?: KnowledgeSurfaceSuggestion[];
    /** Delivery channel for proactive/outbound turns (email, webhook, chat, etc.). */
    channel?: string;
    /** When true, server skips living context snapshot priming for this turn. */
    skipLivingSnapshot?: boolean;
    /** Operator-local calendar date (YYYY-MM-DD) for tomorrowPrep anchor. */
    prepTargetDate?: string;
    /** Daily learning digest lane (theory or trends). */
    dailyLearningDigestChannel?: string;
    /** Advisory specialist briefs synthesized into the reply. */
    specialistBriefs?: SpecialistBrief[];
    /** Initiative outreach burst — shared across bubbles in one delivery. */
    outreachId?: string;
    burstIndex?: number;
    burstTotal?: number;
    initiativeOriginated?: boolean;
    /** Initiative signal kind that triggered the outreach (e.g. metaProposal). */
    signalKind?: string;
    /** Inbound email action token type when source is emailAction. */
    emailAction?: string;
    /** Opaque token for one-click email action links. */
    emailActionToken?: string;
    /** Intervention id when seeded from convert-to-chat or intervention reply. */
    interventionId?: string;
  };
  createdAt: string;
  parentId?: string;
}

export interface MessageTreeResponse {
  rootKey: string;
  nodes: ChatMessage[];
  childrenByParentId: Record<string, string[]>;
  leafIds: string[];
  /** Opaque cursor (MESSAGE#{createdAt}#{id}) for loading older messages. */
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface CreateThreadRequest {
  title?: string;
  whisperOriginated?: boolean;
}

export interface CreateMessageRequest {
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  metadata?: ChatMessage['metadata'];
  parentId?: string;
}

export interface EditMessageRequest {
  content: string;
  metadata?: ChatMessage['metadata'];
}

export interface UpdateThreadRequest {
  id: string;
  title: string;
}

export type AssistantOptimizeFor = 'speed' | 'intelligence' | 'cost' | 'balanced' | 'value';

/** Labels for the model configuration that the next outgoing message will use (from saved picker state). */
export interface AssistantNextSendModelsDisplay {
  mode: 'manual' | 'auto';
  reasoningLabel: string;
  responseLabel: string;
  optimizeFor?: AssistantOptimizeFor;
  webSearchEnabled?: boolean;
}

export type AssistantCompactionMode = 'auto' | 'manual';

export type AssistantRunConfig = (
  | {
      mode: 'manual';
      manual: {
        reasoningModelId: string;
        responseModelId: string;
      };
    }
  | {
      mode: 'auto';
      auto: {
        optimizeFor: AssistantOptimizeFor;
      };
    }
) & { webSearchEnabled?: boolean; compactionMode?: AssistantCompactionMode };

/** Provider-reported token usage for one assistant run (when the adapter captures it). */
export interface AssistantRunUsageTokens {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  provider?: string | null;
}

/** Preflight thread context vs model budget (`POST /assistant/threads/{id}/context-usage`). */
export interface ThreadContextUsage {
  resolvedResponseModelId: string;
  contextWindowTokens: number;
  budgetTokens: number;
  estimatedThreadTokens: number;
  remainingBudgetTokens: number;
  utilizationPercent: number;
  compactionMode: AssistantCompactionMode;
  contextSummaryAvailable: boolean;
  contextSummaryWouldApply: boolean;
  manualCompactionRecommended: boolean;
  manualCompactionRequired: boolean;
  lastRunUsage: AssistantRunUsageTokens | null;
}

export interface AssistantModelCatalogEntry {
  id: string;
  provider: string;
  apiModelId: string;
  label: string;
  supportsReasoningStream: boolean;
  speedScore: number;
  /** Cheapness 1–10 (higher = lower $); not the research report “expense” scale */
  costScore: number;
  qualityScore: number;
  /** USD per 1M input tokens (list price), when known */
  inputUsdPerMtok?: number;
  /** USD per 1M output tokens (list price), when known */
  outputUsdPerMtok?: number;
  /** Vendor- or OpenRouter-published throughput (tokens/s), when available */
  publishedTps?: number;
  pricingNote?: string;
  contextTokens?: number;
  timeToFirstTokenSec?: number;
  arenaElo?: number;
  gpqaPercent?: number;
  mmluProPercent?: number;
  sweBenchPercent?: number;
  /** capability slugs: reasoning, configurableEffort, caching, vision, tools, realtimeWeb, openWeight */
  capabilityTags?: string[];
  bestFor?: string[];
}

/** Latest catalog ids chosen for a run (persists after WS run state is cleared). */
export interface AssistantLastResolvedModels {
  threadId: string;
  resolvedReasoningModelId: string;
  resolvedResponseModelId: string;
  modelMode: string;
  requestedResponseModelId?: string;
  responseOverrideReason?: string;
}

export interface AssistantModelCatalogData {
  providersConfigured: Record<string, boolean>;
  models: AssistantModelCatalogEntry[];
  defaults: {
    defaultReasoningModelId: string;
    defaultResponseModelId: string;
  };
}

export interface WsUserMessagePayload {
  threadId: string;
  content?: string;
  parentId?: string | null;
  metadata?: ChatMessage['metadata'];
  messageId?: string;
  runConfig?: AssistantRunConfig;
  /** Admin sandbox: dry-run tools, no thread/STM/LTM writes. */
  sandbox?: boolean;
  sandboxSessionId?: string;
}

export interface WsCancelRunPayload {
  runId: string;
}

export interface WsRunStartedPayload {
  runId: string;
  threadId: string;
  assistantMessageId: string;
  userMessageId: string;
}

export interface WsAssistantModelResolvedPayload {
  runId: string;
  threadId: string;
  resolvedReasoningModelId: string;
  resolvedResponseModelId: string;
  modelMode: string;
  compactionMode?: AssistantCompactionMode;
  requestedResponseModelId?: string;
  responseOverrideReason?: string;
}

export interface WsAssistantDeltaPayload {
  runId: string;
  threadId: string;
  delta: string;
}

export interface WsAssistantContentReplacePayload {
  runId: string;
  threadId: string;
  content: string;
}

export interface WsThinkingDeltaPayload {
  runId: string;
  threadId: string;
  delta: string;
}

export type AssistantReasoningPhase = 'planning' | 'runningTools' | 'replanning' | 'responding';

export interface WsStatusUpdatePayload {
  runId: string;
  threadId: string;
  stage: 'planning' | 'runningTools' | 'consultingSpecialists' | 'responding' | 'persisting';
  message?: string;
  reasoningPhase?: AssistantReasoningPhase;
  reasoningStreamEnabled?: boolean;
  reasoningStreamDisabledReason?: string;
  noToolsInvoked?: boolean;
}

export interface WsToolCallCompletePayload {
  /** Present on live WebSocket ``toolComplete`` payloads; omitted on persisted ``toolCallDetails`` rows. */
  runId?: string;
  /** Present on live WebSocket payloads; omitted on persisted ``toolCallDetails`` rows. */
  threadId?: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: string;
  durationMs?: number;
  error?: string;
  result?: unknown;
  /** List-tool fidelity counts (mirror server ``ToolCallDetailResponse``). */
  originalItemCount?: number | null;
  returnedItemCount?: number | null;
  total?: number | null;
  truncatedForWs?: boolean;
  wsResultChars?: number;
  wsLimit?: number;
  argumentsTruncatedForWs?: boolean;
}

export interface WsToolApprovalRequiredPayload {
  runId: string;
  threadId: string;
  approvalId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  description: string;
}

export interface WsToolApprovalResponsePayload {
  runId: string;
  approvalId: string;
  decision: 'approve' | 'reject';
}

export interface WsMessageCompletePayload {
  runId: string;
  threadId: string;
  message: ChatMessage;
  /** Present when older turns were summarized for model context limits. */
  contextSummaryApplied?: boolean;
  /** Exact usage from the reply provider when captured during streaming. */
  lastRunUsage?: AssistantRunUsageTokens | null;
}

export interface WsThreadUpdatedPayload {
  threadId: string;
  title: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageRole?: 'user' | 'assistant';
  activeLeafMessageId?: string;
}

export interface WsRunErrorPayload {
  runId: string;
  threadId: string;
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export type RelevantNowKind =
  | 'topTask'
  | 'avoidanceCoach'
  | 'blocker'
  | 'nextHabit'
  | 'knowledge'
  | 'radarHit'
  | 'healthConstraint';

export type CoachNudgeLevel = 'supportive' | 'firm' | 'strict';

export interface RelevantNowSlot {
  kind: RelevantNowKind;
  entityId: string;
  title: string;
  subtitle: string;
  href: string;
  askPrompt: string;
  slotLabel: string;
  reason: string;
  nudgeLevel?: CoachNudgeLevel;
}

export interface AmbientCoachData {
  generatedAt: string;
  slots: RelevantNowSlot[];
  chooser: {
    strategy: 'deterministic' | 'llm';
    cached: boolean;
    model: string;
  };
}

/** @deprecated Use RelevantNowSlot — retained for consumers migrating imports. */
export type RelevantNowItem = RelevantNowSlot;
export type RelevantNowData = AmbientCoachData;

export type AmbientSurface =
  | 'dashboard'
  | 'growthTasks'
  | 'growthProjects'
  | 'personalBranding'
  | 'health';

export type AmbientWhisperKind =
  | 'taskDeferral'
  | 'goalAdvisory'
  | 'projectStale'
  | 'recoveryLow'
  | 'recoveryMissing'
  | 'brandingDrafts'
  | 'focusOverload'
  | 'ledgerAck';

export type AmbientWhisperTone = 'info' | 'nudge' | 'alert';

export type AmbientWhisperSource = 'aggregate' | 'ledger';

export type AmbientActionId =
  | 'dismiss'
  | 'deprioritizeDeepWork'
  | 'requestStrictPlan'
  | 'openEntity'
  | 'openQuickRecovery';

export interface AmbientEntityRef {
  type: 'task' | 'goal' | 'project';
  id: string;
}

export interface AmbientWhisperAction {
  id: AmbientActionId;
  label: string;
  style: 'primary' | 'secondary';
  confirm?: string;
}

export interface AmbientWhisperItem {
  id: string;
  surface: AmbientSurface;
  kind: AmbientWhisperKind;
  tone: AmbientWhisperTone;
  title: string;
  body: string;
  href: string;
  askPrompt: string;
  source: AmbientWhisperSource;
  entityRef?: AmbientEntityRef;
  actions: AmbientWhisperAction[];
  dismissible: boolean;
  expiresAt?: string;
  ledgerEntryId?: string;
}

export interface AmbientPresenceData {
  generatedAt: string;
  surface: AmbientSurface;
  items: AmbientWhisperItem[];
}

export interface AmbientActionResult {
  ack: boolean;
  resultSummary: string;
  ledgerEntryId?: string;
}

export interface AmbientAskSession {
  surface: AmbientSurface;
  title: string;
  askPrompt: string;
  threadId: string | null;
  isCreatingThread: boolean;
  threadError: string | null;
}
