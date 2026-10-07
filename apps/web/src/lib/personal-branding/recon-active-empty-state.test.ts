import { describe, expect, it } from 'vitest';
import {
  buildReconActiveEmptyPresentation,
  resolveReconActiveEmptyKind,
} from './recon-active-empty-state';

describe('resolveReconActiveEmptyKind', () => {
  it('prefers scarcity when no tracked X handles', () => {
    expect(
      resolveReconActiveEmptyKind({
        trackedXHandleCount: 0,
        showScarcityHint: false,
        lastRunAt: null,
        agePreset: 'all',
      })
    ).toBe('scarcity');
  });

  it('prefers scarcity when the 48h probe is scarce', () => {
    expect(
      resolveReconActiveEmptyKind({
        trackedXHandleCount: 3,
        showScarcityHint: true,
        lastRunAt: '2026-01-01T00:00:00.000Z',
        agePreset: '1d',
      })
    ).toBe('scarcity');
  });

  it('prefers awaitingIngest when handles exist but ingest never ran', () => {
    expect(
      resolveReconActiveEmptyKind({
        trackedXHandleCount: 2,
        showScarcityHint: false,
        lastRunAt: null,
        agePreset: 'all',
      })
    ).toBe('awaitingIngest');
  });

  it('prefers filtered when age preset is tight and ingest has run', () => {
    expect(
      resolveReconActiveEmptyKind({
        trackedXHandleCount: 2,
        showScarcityHint: false,
        lastRunAt: '2026-01-01T00:00:00.000Z',
        agePreset: '1d',
      })
    ).toBe('filtered');
  });

  it('falls back to caughtUp when all ages and ingest has run', () => {
    expect(
      resolveReconActiveEmptyKind({
        trackedXHandleCount: 2,
        showScarcityHint: false,
        lastRunAt: '2026-01-01T00:00:00.000Z',
        agePreset: 'all',
      })
    ).toBe('caughtUp');
  });
});

describe('buildReconActiveEmptyPresentation', () => {
  it('builds handle-first scarcity copy', () => {
    const presentation = buildReconActiveEmptyPresentation({
      kind: 'scarcity',
      hasTrackedXHandles: false,
      agePreset: 'all',
    });

    expect(presentation.scene).toBe('reconScarcity');
    expect(presentation.actionLabel).toBe('Add X handles in Connection Directory');
  });

  it('builds probe-driven scarcity copy', () => {
    const presentation = buildReconActiveEmptyPresentation({
      kind: 'scarcity',
      hasTrackedXHandles: true,
      scarcityMessage:
        'Only 2 posts from the last 48 h scored at or above your relevance threshold (0.5)—consider adding more high-signal accounts.',
      agePreset: 'all',
    });

    expect(presentation.description).toContain('Only 2 posts');
    expect(presentation.actionLabel).toBe('Open Connection Directory');
  });

  it('builds filtered empty copy with age label', () => {
    const presentation = buildReconActiveEmptyPresentation({
      kind: 'filtered',
      hasTrackedXHandles: true,
      agePreset: '1d',
    });

    expect(presentation.scene).toBe('filteredEmpty');
    expect(presentation.description).toContain('1d');
    expect(presentation.actionLabel).toBe('Show all ages');
  });

  it('builds caught-up copy when processed posts exist', () => {
    const presentation = buildReconActiveEmptyPresentation({
      kind: 'caughtUp',
      hasTrackedXHandles: true,
      agePreset: 'all',
      processedCount: 4,
    });

    expect(presentation.description).toContain('Processed');
    expect(presentation.actionLabel).toBe('Run now');
  });
});
