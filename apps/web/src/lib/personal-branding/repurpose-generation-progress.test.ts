import { describe, expect, it } from 'vitest';
import {
  hasInFlightRepurposeJobs,
  repurposeJobGeneratingDetailMessage,
  repurposeJobGeneratingStatusLabel,
  repurposeJobInFlight,
  repurposeSkeletonPlatforms,
} from './repurpose-generation-progress';
import { REPURPOSE_JOB_STAGE_LABELS, type RepurposeJob } from '@/types/api/personal-branding.dto';

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

  it('formats generating status label from stage labels', () => {
    const job = makeJob({ stage: 'searching_references' });
    expect(repurposeJobGeneratingStatusLabel(job, REPURPOSE_JOB_STAGE_LABELS)).toBe(
      'Searching references'
    );
    expect(repurposeJobGeneratingStatusLabel(makeJob({}), REPURPOSE_JOB_STAGE_LABELS)).toBe(
      'Generating…'
    );
  });

  it('prefers in-flight error over message for skeleton detail', () => {
    const job = makeJob({
      status: 'running',
      message: 'Searching related published content for style references',
      error: 'Transient provider error',
    });
    expect(repurposeJobGeneratingDetailMessage(job)).toBe('Transient provider error');

    const queued = makeJob({
      status: 'queued',
      message: 'Queued for LinkedIn',
    });
    expect(repurposeJobGeneratingDetailMessage(queued)).toBe('Queued for LinkedIn');
  });

  it('skips skeleton platforms that already have variants', () => {
    const inFlight = [
      makeJob({ platform: 'linkedin', status: 'running' }),
      makeJob({ jobId: 'b', platform: 'x', status: 'queued' }),
    ];
    expect(repurposeSkeletonPlatforms(inFlight, ['linkedin'])).toEqual(['x']);
  });
});
