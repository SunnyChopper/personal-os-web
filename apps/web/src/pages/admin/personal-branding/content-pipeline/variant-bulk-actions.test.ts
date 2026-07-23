import { describe, expect, it } from 'vitest';
import type { ContentVariant } from '@/types/api/personal-branding.dto';
import {
  buildBulkMarkReadyToastMessages,
  buildBulkQueueToastMessages,
  buildBulkRejectToastMessages,
  buildBulkSandboxToastMessages,
  filterEligibleForMarkReady,
  filterEligibleForQueue,
  filterEligibleForReject,
  filterEligibleForSandbox,
  partitionBulkVariantResults,
} from './variant-bulk-actions';

function makeVariant(overrides: Partial<ContentVariant> = {}): ContentVariant {
  return {
    id: 'variant-1',
    sourceContentId: 'content-1',
    jobId: 'job-1',
    brandProfileId: 'profile-1',
    platform: 'linkedin',
    title: 'Title',
    body: 'Body',
    status: 'generated',
    distributionStatus: 'DRAFT',
    characterCount: 4,
    generationAttempt: 1,
    critiqueHistory: [],
    referencedContentIds: [],
    cached: false,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('filterEligibleForSandbox', () => {
  it('returns only selected variants not already in workbench', () => {
    const variants = [
      makeVariant({ id: 'a' }),
      makeVariant({ id: 'b', status: 'sent_to_sandbox' }),
      makeVariant({ id: 'c', createdDraftContentId: 'draft-1' }),
    ];
    const result = filterEligibleForSandbox(variants, ['a', 'b', 'c']);
    expect(result.eligible.map((variant) => variant.id)).toEqual(['a']);
    expect(result.skippedInWorkbench).toBe(2);
  });

  it('returns empty eligibility when selection is empty', () => {
    const result = filterEligibleForSandbox([makeVariant()], []);
    expect(result.eligible).toEqual([]);
    expect(result.skippedInWorkbench).toBe(0);
  });
});

describe('filterEligibleForMarkReady', () => {
  it('skips rejected and already ready variants', () => {
    const variants = [
      makeVariant({ id: 'a' }),
      makeVariant({ id: 'b', status: 'rejected' }),
      makeVariant({ id: 'c', distributionStatus: 'READY' }),
    ];
    const result = filterEligibleForMarkReady(variants, ['a', 'b', 'c']);
    expect(result.eligible.map((variant) => variant.id)).toEqual(['a']);
    expect(result.skippedRejected).toBe(1);
    expect(result.skippedAlreadyReady).toBe(1);
  });
});

describe('partitionBulkVariantResults', () => {
  it('partitions fulfilled and rejected promises', () => {
    const outcome = partitionBulkVariantResults(
      ['a', 'b'],
      [
        { status: 'fulfilled', value: {} },
        { status: 'rejected', reason: new Error('nope') },
      ]
    );
    expect(outcome.succeeded).toEqual([{ variantId: 'a' }]);
    expect(outcome.failed).toEqual([{ variantId: 'b', error: 'nope' }]);
  });
});

describe('buildBulkSandboxToastMessages', () => {
  it('reports all already in workbench when nothing attempted', () => {
    expect(buildBulkSandboxToastMessages(0, 0, 2)).toEqual({
      success: { title: '2 already in Workbench' },
    });
  });

  it('reports partial failure', () => {
    expect(buildBulkSandboxToastMessages(3, 2, 0)).toEqual({
      success: { title: 'Pushed 2 of 3 to Workbench' },
      error: { title: 'Failed to push 1 variant' },
    });
  });

  it('reports full success with skipped count in message', () => {
    expect(buildBulkSandboxToastMessages(2, 2, 1)).toEqual({
      success: {
        title: 'Pushed 2 variants to Workbench',
        message: '1 already in Workbench',
      },
    });
  });
});

describe('buildBulkMarkReadyToastMessages', () => {
  it('reports skipped rejected and ready when nothing attempted', () => {
    expect(buildBulkMarkReadyToastMessages(0, 0, 1, 1)).toEqual({
      success: {
        title: 'Nothing to mark ready',
        message: 'Skipped 1 rejected variant and 1 already ready variant',
      },
    });
  });

  it('reports all success', () => {
    expect(buildBulkMarkReadyToastMessages(2, 2, 0, 0)).toEqual({
      success: { title: 'Marked 2 variants ready' },
    });
  });
});

describe('filterEligibleForQueue', () => {
  it('skips rejected and already queued variants', () => {
    const variants = [
      makeVariant({ id: 'a' }),
      makeVariant({ id: 'b', status: 'rejected' }),
      makeVariant({ id: 'c', distributionStatus: 'SCHEDULED' }),
    ];
    const result = filterEligibleForQueue(variants, ['a', 'b', 'c']);
    expect(result.eligible.map((variant) => variant.id)).toEqual(['a']);
    expect(result.skippedRejected).toBe(1);
    expect(result.skippedAlreadyQueued).toBe(1);
  });
});

describe('filterEligibleForReject', () => {
  it('skips already rejected variants', () => {
    const variants = [makeVariant({ id: 'a' }), makeVariant({ id: 'b', status: 'rejected' })];
    const result = filterEligibleForReject(variants, ['a', 'b']);
    expect(result.eligible.map((variant) => variant.id)).toEqual(['a']);
    expect(result.skippedAlreadyRejected).toBe(1);
  });
});

describe('buildBulkQueueToastMessages', () => {
  it('reports skipped rejected and queued when nothing attempted', () => {
    expect(buildBulkQueueToastMessages(0, 0, 1, 1)).toEqual({
      success: {
        title: 'Nothing to add to queue',
        message: 'Skipped 1 rejected variant and 1 already queued variant',
      },
    });
  });

  it('reports all success', () => {
    expect(buildBulkQueueToastMessages(2, 2, 0, 0)).toEqual({
      success: { title: 'Added 2 variants to queue' },
    });
  });
});

describe('buildBulkRejectToastMessages', () => {
  it('reports all already rejected when nothing attempted', () => {
    expect(buildBulkRejectToastMessages(0, 0, 2)).toEqual({
      success: { title: '2 already rejected' },
    });
  });

  it('reports partial failure', () => {
    expect(buildBulkRejectToastMessages(3, 2, 0)).toEqual({
      success: { title: 'Rejected 2 of 3' },
      error: { title: 'Failed to reject 1 variant' },
    });
  });
});
