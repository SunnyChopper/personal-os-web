import { describe, expect, it } from 'vitest';
import type { ContentOpportunity } from '@/types/api/personal-branding.dto';
import {
  buildLateContentSearchResult,
  contentSearchOutcomeNeedsRetry,
  isContentSearchTransportError,
} from './content-opportunity-search-recovery';

const sampleOpportunity = {
  id: 'opp-1',
  connectionId: 'conn-1',
  platform: 'x',
  platformPostId: 'tweet-1',
  postText: 'Hello',
  status: 'SUGGESTED',
  searchRunId: 'run-1',
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} satisfies ContentOpportunity;

describe('isContentSearchTransportError', () => {
  it('detects timeout messages', () => {
    expect(
      isContentSearchTransportError(
        new Error('Request timed out. The server may be slow or unavailable.')
      )
    ).toBe(true);
  });

  it('ignores validation errors', () => {
    expect(isContentSearchTransportError(new Error('VALIDATION_ERROR'))).toBe(false);
  });
});

describe('buildLateContentSearchResult', () => {
  it('returns found result when opportunities exist', () => {
    const result = buildLateContentSearchResult('x', [sampleOpportunity]);
    expect(result?.outcome).toBe('found');
    expect(result?.opportunities).toHaveLength(1);
  });

  it('returns null when no opportunities', () => {
    expect(buildLateContentSearchResult('x', [])).toBeNull();
  });
});

describe('contentSearchOutcomeNeedsRetry', () => {
  it('flags recoverable soft outcomes', () => {
    expect(contentSearchOutcomeNeedsRetry('fetchFailed')).toBe(true);
    expect(contentSearchOutcomeNeedsRetry('rankingFailed')).toBe(true);
    expect(contentSearchOutcomeNeedsRetry('found')).toBe(false);
  });
});
