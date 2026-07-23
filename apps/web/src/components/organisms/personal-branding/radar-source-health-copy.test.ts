import { describe, expect, it } from 'vitest';
import { getHealthReasonClarification } from '@/components/organisms/personal-branding/radar-source-health-copy';

describe('getHealthReasonClarification', () => {
  it('returns one-scrape line for last-scrape volume reasons', () => {
    expect(
      getHealthReasonClarification('Last scrape created no Trend Stream cards', 'neutral')
    ).toBe('One scrape only — rolling yield is still neutral.');
    expect(getHealthReasonClarification('No items in last scrape', 'high')).toBe(
      'One scrape only — rolling yield is still high.'
    );
  });

  it('returns sustained-yield line for yield-overlay reasons', () => {
    expect(getHealthReasonClarification('Low yield over recent window', 'low')).toBe(
      'Based on rolling windows (7d/30d), not only the last scrape.'
    );
    expect(getHealthReasonClarification('No Trend Stream cards in last 7 days', 'low')).toBe(
      'Based on rolling windows (7d/30d), not only the last scrape.'
    );
  });

  it('returns null for unrelated or empty reasons', () => {
    expect(getHealthReasonClarification('Last success 2h ago', 'neutral')).toBeNull();
    expect(getHealthReasonClarification('', 'neutral')).toBeNull();
    expect(getHealthReasonClarification(undefined, 'neutral')).toBeNull();
  });
});
