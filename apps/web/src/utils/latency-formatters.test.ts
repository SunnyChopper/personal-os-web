import { describe, expect, it } from 'vitest';
import { formatLatencyMs } from './latency-formatters';

describe('formatLatencyMs', () => {
  it('returns em dash for nullish values', () => {
    expect(formatLatencyMs(null)).toBe('—');
    expect(formatLatencyMs(undefined)).toBe('—');
  });

  it('rounds noisy floats to one decimal or integer', () => {
    expect(formatLatencyMs(791.7987729999965)).toBe('791.8');
    expect(formatLatencyMs(1200)).toBe('1200');
    expect(formatLatencyMs(1200.04)).toBe('1200');
    expect(formatLatencyMs(1200.06)).toBe('1200.1');
  });
});
