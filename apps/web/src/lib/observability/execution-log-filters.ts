/** Execution log filter field keys and helpers (Observability executions tab). */

export type ExecutionLogFilterFields = {
  module: string;
  feature: string;
  model: string;
  provider: string;
  status: string;
  requestId: string;
  providerRequestId: string;
  threadId: string;
  runId: string;
  jobRunId: string;
};

export const EMPTY_EXECUTION_LOG_FILTERS: ExecutionLogFilterFields = {
  module: '',
  feature: '',
  model: '',
  provider: '',
  status: '',
  requestId: '',
  providerRequestId: '',
  threadId: '',
  runId: '',
  jobRunId: '',
};

export const PRIMARY_EXECUTION_LOG_FILTER_KEYS = [
  'module',
  'feature',
  'model',
  'provider',
  'status',
] as const satisfies readonly (keyof ExecutionLogFilterFields)[];

export const ADVANCED_EXECUTION_LOG_FILTER_KEYS = [
  'requestId',
  'providerRequestId',
  'threadId',
  'runId',
  'jobRunId',
] as const satisfies readonly (keyof ExecutionLogFilterFields)[];

export function hasAdvancedExecutionLogFilters(filters: ExecutionLogFilterFields): boolean {
  return ADVANCED_EXECUTION_LOG_FILTER_KEYS.some((key) => filters[key].trim() !== '');
}

export function hasAnyExecutionLogFilter(filters: ExecutionLogFilterFields): boolean {
  return [...PRIMARY_EXECUTION_LOG_FILTER_KEYS, ...ADVANCED_EXECUTION_LOG_FILTER_KEYS].some(
    (key) => filters[key].trim() !== ''
  );
}

export function isCoachReliabilityFilterActive(filters: ExecutionLogFilterFields): boolean {
  return filters.module.trim() === 'assistant' && filters.feature.trim() === 'coachReliability';
}

export function formatExecutionPreview(preview: string | null | undefined): string {
  const trimmed = preview?.trim();
  return trimmed ? trimmed : '—';
}
