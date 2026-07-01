import { describe, expect, it } from 'vitest';
import { extractionProgressPercent } from '../profile-extraction-progress';
import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';

function makeJob(
  partial: Partial<ProfileExtractionJob> & Pick<ProfileExtractionJob, 'status'>
): ProfileExtractionJob {
  return {
    jobId: 'job-1',
    profileId: 'profile-1',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('extractionProgressPercent', () => {
  it('returns low progress for queued jobs', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'queued',
          stage: 'queued',
        })
      )
    ).toBe(8);
  });

  it('interpolates source reading progress', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'running',
          stage: 'reading_sources',
          sourceCount: 4,
          processedSourceCount: 2,
        })
      )
    ).toBe(33);
  });

  it('returns completion for succeeded jobs', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'succeeded',
          stage: 'succeeded',
        })
      )
    ).toBe(100);
  });
});
