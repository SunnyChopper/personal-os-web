import { describe, expect, it } from 'vitest';
import { computeRollingAverages } from '@/utils/velocity-chart-math';

describe('computeRollingAverages', () => {
  it('computes trailing means oldest-first', () => {
    expect(computeRollingAverages([8, 4, 6, 10], 4)).toEqual([8, 6, 6, 7]);
  });

  it('handles window smaller than series length', () => {
    expect(computeRollingAverages([2, 4, 6], 2)).toEqual([2, 3, 5]);
  });

  it('returns empty for empty input', () => {
    expect(computeRollingAverages([], 4)).toEqual([]);
  });
});
