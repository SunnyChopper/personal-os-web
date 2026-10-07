/** Shared Coach tool-reliability observability filter preset. */

export const COACH_RELIABILITY_MODULE = 'assistant';
export const COACH_RELIABILITY_FEATURE = 'coachReliability';

export const COACH_RELIABILITY_EXECUTION_FILTERS = {
  module: COACH_RELIABILITY_MODULE,
  feature: COACH_RELIABILITY_FEATURE,
} as const;

export function coachReliabilityObservabilityUrl(): string {
  const params = new URLSearchParams({
    tab: 'executions',
    module: COACH_RELIABILITY_MODULE,
    feature: COACH_RELIABILITY_FEATURE,
  });
  return `/admin/assistant/observability?${params.toString()}`;
}
