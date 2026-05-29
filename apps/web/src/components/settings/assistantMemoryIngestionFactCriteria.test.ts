import { describe, expect, it } from 'vitest';
import {
  MAX_FACT_CRITERIA_ITEMS,
  normalizeFactCriteria,
} from './assistantMemoryIngestionFactCriteria';

describe('assistantMemoryIngestionFactCriteria', () => {
  it('normalizes lists by trimming and deduping case-insensitively', () => {
    const out = normalizeFactCriteria({
      alwaysCapture: ['  capital changes  ', 'CAPITAL CHANGES', 'target dates'],
      neverCapture: ['weather chitchat', ''],
    });
    expect(out.alwaysCapture).toEqual(['capital changes', 'target dates']);
    expect(out.neverCapture).toEqual(['weather chitchat']);
  });

  it('caps list length', () => {
    const alwaysCapture = Array.from({ length: 25 }, (_, i) => `rule-${i}`);
    const out = normalizeFactCriteria({ alwaysCapture, neverCapture: [] });
    expect(out.alwaysCapture).toHaveLength(MAX_FACT_CRITERIA_ITEMS);
  });
});
