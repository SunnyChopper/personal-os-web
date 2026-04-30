/** Usage & observability API types (camelCase from `/observability/*`). */

export interface ObservabilityBurnSummary {
  todayCostUsd: number;
  last7dCostUsd: number;
  totalTokens: number;
  failedExecutions: number;
  avgLatencyMs: number | null;
  totalCalls: number;
}

export interface ObservabilityBurnPoint {
  bucketStart: string;
  totalCostUsd: number;
  totalTokens: number;
  callCount: number;
}

export interface ObservabilityBurnTimeseries {
  points: ObservabilityBurnPoint[];
}

export interface ObservabilityBreakdownRow {
  key: string;
  totalCostUsd: number;
  totalTokens: number;
  callCount: number;
}

export interface ObservabilityBurnBreakdown {
  rows: ObservabilityBreakdownRow[];
  groupBy: string;
}

export interface ObservabilityExecutionRow {
  id: string;
  occurredAt: string;
  module: string;
  feature?: string | null;
  provider: string;
  model: string;
  status: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  totalCostUsd?: number | null;
  latencyMs?: number | null;
  responsePreview?: string | null;
  threadId?: string | null;
  runId?: string | null;
  requestId?: string | null;
}

export interface ObservabilityExecutionDetail extends ObservabilityExecutionRow {
  promptPayloadJson?: unknown;
  promptText?: string | null;
  responseRawText?: string | null;
  partialResponseText?: string | null;
  requestMetadataJson?: unknown;
  retryPayloadJson?: unknown;
  pricingSnapshotJson?: unknown;
  errorMessage?: string | null;
  stackTrace?: string | null;
  ttftMs?: number | null;
  inputCostUsd?: number | null;
  outputCostUsd?: number | null;
}

export interface ObservabilityExecutionsPage {
  data: ObservabilityExecutionRow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ObservabilityHealthSummary {
  totalRuns: number;
  failureCount: number;
  lastFailureAt?: string | null;
}

export interface ObservabilityHealthRow {
  rowId: string;
  jobName: string;
  jobType: string;
  lastStatus: string;
  lastStartedAt: string;
  lastFinishedAt?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  stackTrace?: string | null;
}

export interface ObservabilityHealthMatrix {
  rows: ObservabilityHealthRow[];
}

export interface ObservabilityRetryQueued {
  queued: boolean;
  message: string;
}
