import { describe, expect, it } from 'vitest';
import {
  engagementMetricsForStrip,
  formatCompactMetric,
  formatEngagementSummary,
  formatToneMatchPercent,
  hasPerformanceSnapshot,
  relativeBarHeights,
  variantBodyPreview,
  variantCopyText,
} from './variant-card-helpers';

describe('variantBodyPreview', () => {
  it('normalizes whitespace and returns empty for blank input', () => {
    expect(variantBodyPreview('')).toBe('');
    expect(variantBodyPreview('   \n\n  ')).toBe('');
  });

  it('collapses internal whitespace', () => {
    expect(variantBodyPreview('Hello\n\nworld')).toBe('Hello world');
  });

  it('truncates long bodies with an ellipsis', () => {
    const longBody = 'word '.repeat(100).trim();
    const preview = variantBodyPreview(longBody, 20);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(21);
  });
});

describe('formatToneMatchPercent', () => {
  it('returns em dash when confidence is missing', () => {
    expect(formatToneMatchPercent(null)).toBe('—');
    expect(formatToneMatchPercent(undefined)).toBe('—');
  });

  it('rounds confidence to a percent string', () => {
    expect(formatToneMatchPercent(0.724)).toBe('72%');
    expect(formatToneMatchPercent(1)).toBe('100%');
  });
});

describe('variantCopyText', () => {
  it('joins title and body with a blank line', () => {
    expect(variantCopyText('Title', 'Body text')).toBe('Title\n\nBody text');
  });

  it('returns whichever side is present when the other is blank', () => {
    expect(variantCopyText('Title only', '')).toBe('Title only');
    expect(variantCopyText('', 'Body only')).toBe('Body only');
  });
});

describe('hasPerformanceSnapshot', () => {
  it('is false without engagement or when only shares is set', () => {
    expect(hasPerformanceSnapshot(null)).toBe(false);
    expect(hasPerformanceSnapshot(undefined)).toBe(false);
    expect(hasPerformanceSnapshot({})).toBe(false);
    expect(hasPerformanceSnapshot({ shares: 3 })).toBe(false);
  });

  it('is true when views, likes, or comments is populated', () => {
    expect(hasPerformanceSnapshot({ views: 0 })).toBe(true);
    expect(hasPerformanceSnapshot({ likes: 5 })).toBe(true);
    expect(hasPerformanceSnapshot({ comments: 1, shares: 2 })).toBe(true);
  });
});

describe('engagementMetricsForStrip', () => {
  it('returns populated metrics in order including shares', () => {
    expect(engagementMetricsForStrip({ views: 100, likes: 5, comments: 2, shares: 1 })).toEqual([
      { key: 'views', label: 'views', value: 100 },
      { key: 'likes', label: 'likes', value: 5 },
      { key: 'comments', label: 'comments', value: 2 },
      { key: 'shares', label: 'shares', value: 1 },
    ]);
  });

  it('skips nullish fields', () => {
    expect(engagementMetricsForStrip({ likes: 4 })).toEqual([
      { key: 'likes', label: 'likes', value: 4 },
    ]);
  });
});

describe('relativeBarHeights', () => {
  it('normalizes to the max', () => {
    expect(relativeBarHeights([100, 50, 25])).toEqual([1, 0.5, 0.25]);
  });

  it('returns empty for empty input and zeros when max is 0', () => {
    expect(relativeBarHeights([])).toEqual([]);
    expect(relativeBarHeights([0, 0])).toEqual([0, 0]);
  });
});

describe('formatCompactMetric', () => {
  it('formats small and large numbers', () => {
    expect(formatCompactMetric(48)).toBe('48');
    expect(formatCompactMetric(1200)).toBe('1.2k');
    expect(formatCompactMetric(10000)).toBe('10k');
    expect(formatCompactMetric(1_500_000)).toBe('1.5M');
  });
});

describe('formatEngagementSummary', () => {
  it('joins raw metric values for form footer text', () => {
    expect(formatEngagementSummary({ views: 100, likes: 5, comments: 2 })).toBe(
      '100 views · 5 likes · 2 comments'
    );
    expect(formatEngagementSummary(null)).toBeNull();
  });
});
