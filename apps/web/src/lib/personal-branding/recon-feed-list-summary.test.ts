import { describe, expect, it } from 'vitest';
import {
  formatReconFeedListSummary,
  isNonDefaultReconFeedFilters,
} from './recon-feed-list-summary';

describe('isNonDefaultReconFeedFilters', () => {
  it('returns false for default age and sort', () => {
    expect(isNonDefaultReconFeedFilters('all', 'relevanceScore')).toBe(false);
  });

  it('returns true when age is non-default', () => {
    expect(isNonDefaultReconFeedFilters('7d', 'relevanceScore')).toBe(true);
  });

  it('returns true when sort is non-default', () => {
    expect(isNonDefaultReconFeedFilters('all', 'postedAt')).toBe(true);
  });

  it('returns true when both are non-default', () => {
    expect(isNonDefaultReconFeedFilters('3d', 'postedAt')).toBe(true);
  });
});

describe('formatReconFeedListSummary', () => {
  it('formats defaults with full count', () => {
    expect(
      formatReconFeedListSummary({
        loadedCount: 43,
        total: 43,
        agePreset: 'all',
        sortField: 'relevanceScore',
      })
    ).toBe('43 posts · all ages · sorted by relevance');
  });

  it('formats partial load count', () => {
    expect(
      formatReconFeedListSummary({
        loadedCount: 20,
        total: 43,
        agePreset: 'all',
        sortField: 'relevanceScore',
      })
    ).toBe('20 of 43 posts · all ages · sorted by relevance');
  });

  it('formats singular post count', () => {
    expect(
      formatReconFeedListSummary({
        loadedCount: 1,
        total: 1,
        agePreset: 'all',
        sortField: 'relevanceScore',
      })
    ).toBe('1 post · all ages · sorted by relevance');
  });

  it('formats non-default age and sort', () => {
    expect(
      formatReconFeedListSummary({
        loadedCount: 12,
        total: 12,
        agePreset: '7d',
        sortField: 'postedAt',
      })
    ).toBe('12 posts · last 7 days · sorted by posted');
  });

  it('formats 2wk age preset', () => {
    expect(
      formatReconFeedListSummary({
        loadedCount: 5,
        total: 5,
        agePreset: '2wk',
        sortField: 'relevanceScore',
      })
    ).toBe('5 posts · last 2 weeks · sorted by relevance');
  });

  it('formats 1d age preset', () => {
    expect(
      formatReconFeedListSummary({
        loadedCount: 2,
        total: 2,
        agePreset: '1d',
        sortField: 'relevanceScore',
      })
    ).toBe('2 posts · last 1 day · sorted by relevance');
  });
});
