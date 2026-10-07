import { describe, expect, it } from 'vitest';
import {
  COMPLETED_SECTION_AUTO_COLLAPSE_AFTER,
  formatMostRecentCompletedSummary,
  shouldAutoCollapseCompletedSection,
} from '@/lib/projects/completed-tasks-section';

describe('shouldAutoCollapseCompletedSection', () => {
  it('does not auto-collapse when count is zero', () => {
    expect(shouldAutoCollapseCompletedSection(0)).toBe(false);
  });

  it('does not auto-collapse at the threshold', () => {
    expect(shouldAutoCollapseCompletedSection(COMPLETED_SECTION_AUTO_COLLAPSE_AFTER)).toBe(false);
  });

  it('auto-collapses when count exceeds threshold', () => {
    expect(shouldAutoCollapseCompletedSection(COMPLETED_SECTION_AUTO_COLLAPSE_AFTER + 1)).toBe(
      true
    );
    expect(shouldAutoCollapseCompletedSection(6)).toBe(true);
  });
});

describe('formatMostRecentCompletedSummary', () => {
  it('formats title with completed date and omits points', () => {
    const summary = formatMostRecentCompletedSummary({
      title: 'Happiness',
      size: 220,
      completedDate: '2026-07-12',
    });
    expect(summary).toBe('Happiness · Jul 12, 2026');
    expect(summary).not.toContain('220pts');
  });

  it('omits date when completedDate is missing', () => {
    expect(
      formatMostRecentCompletedSummary({
        title: 'Ship release',
        size: 5,
        completedDate: null,
      })
    ).toBe('Ship release');
  });

  it('returns title only when no points or date', () => {
    expect(
      formatMostRecentCompletedSummary({
        title: 'Ship release',
        size: null,
        completedDate: null,
      })
    ).toBe('Ship release');
  });
});
