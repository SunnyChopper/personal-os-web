import { describe, expect, it } from 'vitest';
import {
  hasInFlightRepurposeJobs,
  repurposeBatchProgress,
  repurposeGenerationBannerLabel,
  repurposeGenerationBatchJobs,
  repurposeJobInFlight,
  repurposeSkeletonPlatforms,
} from './repurpose-generation-progress';
import type { RepurposeJob } from '@/types/api/personal-branding.dto';

function makeJob(overrides: Partial<RepurposeJob>): RepurposeJob {
  return {
    jobId: 'job-1',
    sourceContentId: 'content-1',
    brandProfileId: 'profile-1',
    platform: 'linkedin',
    targetPlatforms: ['linkedin'],
    status: 'queued',
    variantIds: [],
    userId: 'user-1',
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
    ...overrides,
  };
}

describe('repurpose-generation-progress', () => {
  it('treats cancelling as in-flight', () => {
    expect(repurposeJobInFlight('cancelling')).toBe(true);
    expect(hasInFlightRepurposeJobs([makeJob({ status: 'cancelling' })])).toBe(true);
  });

  it('computes batch progress from generation wave jobs', () => {
    const inFlight = [
      makeJob({
        jobId: 'a',
        platform: 'linkedin',
        status: 'running',
        createdAt: '2026-07-21T01:00:00Z',
      }),
      makeJob({ jobId: 'b', platform: 'x', status: 'queued', createdAt: '2026-07-21T01:00:01Z' }),
    ];
    const all = [
      ...inFlight,
      makeJob({
        jobId: 'old',
        status: 'succeeded',
        createdAt: '2026-07-20T00:00:00Z',
      }),
      makeJob({
        jobId: 'c',
        platform: 'medium',
        status: 'succeeded',
        createdAt: '2026-07-21T01:00:02Z',
      }),
    ];
    const batch = repurposeGenerationBatchJobs(all, inFlight);
    expect(batch).toHaveLength(3);
    const progress = repurposeBatchProgress(batch);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(1);
    expect(progress.inFlightCount).toBe(2);
    expect(progress.percent).toBe(33);
  });

  it('formats banner label for singular and plural', () => {
    expect(repurposeGenerationBannerLabel(1)).toBe('Generating 1 variant…');
    expect(repurposeGenerationBannerLabel(3)).toBe('Generating 3 variants…');
  });

  it('skips skeleton platforms that already have variants', () => {
    const inFlight = [
      makeJob({ platform: 'linkedin', status: 'running' }),
      makeJob({ jobId: 'b', platform: 'x', status: 'queued' }),
    ];
    expect(repurposeSkeletonPlatforms(inFlight, ['linkedin'])).toEqual(['x']);
  });
});
