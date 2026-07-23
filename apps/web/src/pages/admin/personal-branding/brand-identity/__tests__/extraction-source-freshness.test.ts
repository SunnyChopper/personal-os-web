import { describe, expect, it } from 'vitest';

import type { ProfileExtractionSource } from '@/types/api/personal-branding.dto';

import { extractionSourceFreshnessDisplay } from '../extraction-source-freshness';

function makeSource(overrides: Partial<ProfileExtractionSource> = {}): ProfileExtractionSource {
  return {
    id: 'src-1',
    sourceType: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    freshness: 'fresh',
    ...overrides,
  };
}

describe('extractionSourceFreshnessDisplay', () => {
  it('shows never extracted when freshness is never', () => {
    const display = extractionSourceFreshnessDisplay(makeSource({ freshness: 'never' }), null);
    expect(display.extractedLine).toBe('Never extracted');
    expect(display.label).toBe('Never');
    expect(display.tone).toBe('muted');
  });

  it('shows relative last extracted line when timestamp is present', () => {
    const display = extractionSourceFreshnessDisplay(
      makeSource({ freshness: 'fresh', lastExtractedAt: '2026-07-20T00:00:00.000Z' }),
      'Yesterday'
    );
    expect(display.extractedLine).toBe('Last extracted Yesterday');
    expect(display.label).toBe('Fresh');
    expect(display.tone).toBe('success');
  });

  it('uses danger tone when last extraction failed', () => {
    const display = extractionSourceFreshnessDisplay(
      makeSource({
        freshness: 'fresh',
        lastExtractionStatus: 'failed',
        lastExtractedAt: '2026-07-20T00:00:00.000Z',
      }),
      'Yesterday'
    );
    expect(display.label).toBe('Failed');
    expect(display.tone).toBe('danger');
    expect(display.tooltip).toMatch(/failed/i);
  });

  it('guides rerun for stale sources', () => {
    const display = extractionSourceFreshnessDisplay(
      makeSource({ freshness: 'stale', lastExtractedAt: '2026-01-01T00:00:00.000Z' }),
      '6 months ago'
    );
    expect(display.label).toBe('Stale');
    expect(display.tooltip).toMatch(/outdated/i);
  });
});
