import { describe, expect, it } from 'vitest';
import {
  COACH_RELIABILITY_FEATURE,
  COACH_RELIABILITY_MODULE,
  coachReliabilityObservabilityUrl,
} from './coach-reliability';
import { isCoachReliabilityFilterActive } from './execution-log-filters';

describe('coach-reliability observability helpers', () => {
  it('builds shareable observability url', () => {
    expect(coachReliabilityObservabilityUrl()).toBe(
      '/admin/assistant/observability?tab=executions&module=assistant&feature=coachReliability'
    );
  });

  it('detects active coach reliability filter preset', () => {
    expect(
      isCoachReliabilityFilterActive({
        module: COACH_RELIABILITY_MODULE,
        feature: COACH_RELIABILITY_FEATURE,
        model: '',
        provider: '',
        status: '',
        requestId: '',
        providerRequestId: '',
        threadId: '',
        runId: '',
        jobRunId: '',
      })
    ).toBe(true);
  });
});
