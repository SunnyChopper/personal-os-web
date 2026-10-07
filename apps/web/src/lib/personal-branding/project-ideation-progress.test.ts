import { describe, expect, it } from 'vitest';
import type { BrandProjectJob } from '@/types/api/personal-branding.dto';
import {
  projectIdeationJobInFlight,
  projectIdeationShowStatus,
  projectIdeationStatusLine,
  projectIdeationSuccessOutcome,
} from './project-ideation-progress';

function job(
  overrides: Partial<BrandProjectJob> & Pick<BrandProjectJob, 'status'>
): BrandProjectJob {
  return {
    jobId: 'job-1',
    jobType: 'ideation',
    ideaIds: [],
    droppedDuplicateCount: 0,
    createdAt: '2026-10-03T00:00:00Z',
    ...overrides,
  };
}

describe('projectIdeationSuccessOutcome', () => {
  it('formats added count and near-duplicates', () => {
    expect(projectIdeationSuccessOutcome(3, 2)).toBe('3 ideas added. 2 near-duplicates dropped.');
    expect(projectIdeationSuccessOutcome(1, 0)).toBe('1 idea added.');
    expect(projectIdeationSuccessOutcome(0, 2)).toBe(
      'No new ideas were added. 2 near-duplicates dropped.'
    );
    expect(projectIdeationSuccessOutcome(0, 1)).toBe(
      'No new ideas were added. 1 near-duplicate dropped.'
    );
  });
});

describe('projectIdeationStatusLine', () => {
  it('returns queued while submitting before poll data', () => {
    expect(projectIdeationStatusLine({ job: undefined, isSubmitting: true, replayed: false })).toBe(
      'Queued for generation…'
    );
  });

  it('returns queued and running copy for new jobs', () => {
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'queued' }),
        isSubmitting: false,
        replayed: false,
      })
    ).toBe('Queued for generation…');
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'running' }),
        isSubmitting: false,
        replayed: false,
      })
    ).toBe('Generation in progress…');
  });

  it('returns replay in-flight copy', () => {
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'running' }),
        isSubmitting: false,
        replayed: true,
      })
    ).toBe('This batch is already generating…');
  });

  it('formats success with added and dropped counts', () => {
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'succeeded', ideaIds: ['a', 'b'], droppedDuplicateCount: 1 }),
        isSubmitting: false,
        replayed: false,
      })
    ).toBe('2 ideas added. 1 near-duplicate dropped.');
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'succeeded', ideaIds: [], droppedDuplicateCount: 2 }),
        isSubmitting: false,
        replayed: false,
      })
    ).toBe('No new ideas were added. 2 near-duplicates dropped.');
  });

  it('formats replay success with outcome sentence', () => {
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'succeeded', ideaIds: ['a'], droppedDuplicateCount: 0 }),
        isSubmitting: false,
        replayed: true,
      })
    ).toBe('Already generated for this day and direction. 1 idea added.');
  });

  it('names how many cards were used without changing the no-cards copy', () => {
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'running' }),
        isSubmitting: false,
        replayed: false,
        cardCount: 7,
      })
    ).toBe('Generation in progress from 7 cards…');
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'queued' }),
        isSubmitting: false,
        replayed: false,
        cardCount: 1,
      })
    ).toBe('Queued for generation from 1 card…');
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'succeeded', ideaIds: ['a', 'b', 'c'], droppedDuplicateCount: 0 }),
        isSubmitting: false,
        replayed: false,
        cardCount: 7,
      })
    ).toBe('3 ideas added from 7 cards.');
    expect(projectIdeationSuccessOutcome(1, 0, 1)).toBe('1 idea added from 1 card.');
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'failed', error: 'Generation failed.' }),
        isSubmitting: false,
        replayed: false,
        cardCount: 7,
      })
    ).toBe('Generation failed.');
  });

  it('returns failed error or fallback', () => {
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'failed', error: 'No trend items available for project ideation' }),
        isSubmitting: false,
        replayed: false,
      })
    ).toBe('No trend items available for project ideation');
    expect(
      projectIdeationStatusLine({
        job: job({ status: 'failed', error: '' }),
        isSubmitting: false,
        replayed: false,
      })
    ).toBe('Generation failed.');
  });
});

describe('projectIdeationJobInFlight', () => {
  it('treats submitting and non-terminal statuses as in flight', () => {
    expect(projectIdeationJobInFlight(undefined, true)).toBe(true);
    expect(projectIdeationJobInFlight(job({ status: 'queued' }), false)).toBe(true);
    expect(projectIdeationJobInFlight(job({ status: 'running' }), false)).toBe(true);
    expect(projectIdeationJobInFlight(job({ status: 'succeeded' }), false)).toBe(false);
    expect(projectIdeationJobInFlight(job({ status: 'failed' }), false)).toBe(false);
  });
});

describe('projectIdeationShowStatus', () => {
  it('hides kit jobs unless submitting', () => {
    expect(
      projectIdeationShowStatus({ ...job({ status: 'running' }), jobType: 'kit' }, false)
    ).toBe(false);
    expect(projectIdeationShowStatus(undefined, true)).toBe(true);
  });
});
