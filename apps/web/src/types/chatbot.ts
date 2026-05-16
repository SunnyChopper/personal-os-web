export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** True when the thread was created by proactive/scheduled automation */
  automationOriginated?: boolean;
  activeLeafMessageId?: string;
}

export interface StatusEntry {
  stage:
    | 'planning'
    | 'runningTools'
    | 'responding'
    | 'persisting'
    | 'awaitingApproval'
    | 'approvalResolved';
  message?: string;
  startedAt: number;
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
  };
  createdAt: string;
  parentId?: string;
}

export interface MessageTreeResponse {
  rootKey: string;
  nodes: ChatMessage[];
  childrenByParentId: Record<string, string[]>;
  leafIds: string[];
}

export interface CreateThreadRequest {
  title?: string;
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
}

export interface WsAssistantDeltaPayload {
  runId: string;
  threadId: string;
  delta: string;
}

export interface WsThinkingDeltaPayload {
  runId: string;
  threadId: string;
  delta: string;
}

export interface WsStatusUpdatePayload {
  runId: string;
  threadId: string;
  stage: 'planning' | 'runningTools' | 'responding' | 'persisting';
  message?: string;
}

export interface WsToolCallCompletePayload {
  runId: string;
  threadId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: string;
  durationMs?: number;
  error?: string;
  result?: unknown;
  /** List-tool row counts carried on the envelope (accurate even when WS `result` JSON is truncated). */
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
}

export interface WsRunErrorPayload {
  runId: string;
  threadId: string;
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
