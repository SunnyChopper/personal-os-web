import { describe, expect, it } from 'vitest';
import { EVENT_FIT_SCORE_LEGEND_COPY, eventFitScoreChipAriaLabel } from './event-fit-score-legend';

describe('event-fit-score-legend', () => {
  it('defines static legend copy', () => {
    expect(EVENT_FIT_SCORE_LEGEND_COPY).toContain('AI fit 0–100');
    expect(EVENT_FIT_SCORE_LEGEND_COPY).toContain('min fit score');
    expect(EVENT_FIT_SCORE_LEGEND_COPY).toContain('Keyword overlap');
  });

  it('builds chip aria-label', () => {
    expect(eventFitScoreChipAriaLabel(72)).toBe('Fit 72. AI match score from 0 to 100.');
  });
});
