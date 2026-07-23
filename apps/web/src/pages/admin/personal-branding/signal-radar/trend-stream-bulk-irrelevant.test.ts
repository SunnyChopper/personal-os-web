import { describe, expect, it } from 'vitest';
import type { RadarItem } from '@/types/api/personal-branding.dto';
import { getMarkIrrelevantModalCopy } from './mark-irrelevant-modal-copy';
import {
  buildBulkIrrelevantToastMessages,
  partitionBulkIrrelevantResults,
} from './trend-stream-bulk-irrelevant';

function makeItem(id: string): RadarItem {
  return {
    id,
    itemType: 'ARTICLE',
    title: id,
    relevanceScore: 0.5,
    matchedPillars: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('getMarkIrrelevantModalCopy', () => {
  it('uses single-card copy by default', () => {
    const copy = getMarkIrrelevantModalCopy(1, 'Example title');
    expect(copy.title).toBe('Why is this irrelevant?');
    expect(copy.submitLabel).toBe('Mark as irrelevant');
    expect(copy.isBulk).toBe(false);
    expect(copy.description).toContain('Example title');
  });

  it('uses bulk copy for multiple cards', () => {
    const copy = getMarkIrrelevantModalCopy(3);
    expect(copy.title).toBe('Why are these irrelevant?');
    expect(copy.submitLabel).toBe('Mark 3 cards as irrelevant');
    expect(copy.isBulk).toBe(true);
    expect(copy.description).toContain('3 selected cards');
  });
});

describe('partitionBulkIrrelevantResults', () => {
  it('splits fulfilled and rejected results by item id order', () => {
    const itemIds = ['a', 'b', 'c'];
    const results: PromiseSettledResult<RadarItem>[] = [
      { status: 'fulfilled', value: makeItem('a') },
      { status: 'rejected', reason: new Error('nope') },
      { status: 'fulfilled', value: makeItem('c') },
    ];

    const outcome = partitionBulkIrrelevantResults(itemIds, results);
    expect(outcome.succeeded.map((entry) => entry.itemId)).toEqual(['a', 'c']);
    expect(outcome.failed).toEqual([{ itemId: 'b', error: 'nope' }]);
  });
});

describe('buildBulkIrrelevantToastMessages', () => {
  it('returns success only when all succeed', () => {
    expect(buildBulkIrrelevantToastMessages(2, 2)).toEqual({
      success: { title: 'Marked 2 as irrelevant' },
    });
  });

  it('returns error only when all fail', () => {
    expect(buildBulkIrrelevantToastMessages(2, 0)).toEqual({
      error: { title: 'Failed to mark cards as irrelevant' },
    });
  });

  it('returns both success and error on partial failure', () => {
    expect(buildBulkIrrelevantToastMessages(3, 2)).toEqual({
      success: { title: 'Marked 2 of 3 as irrelevant' },
      error: { title: 'Failed to update 1 card' },
    });
  });

  it('uses singular copy for one card', () => {
    expect(buildBulkIrrelevantToastMessages(1, 1)).toEqual({
      success: { title: 'Marked as irrelevant' },
    });
  });
});
