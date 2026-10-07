import { describe, expect, it } from 'vitest';
import type { InPersonEvent } from '@/types/api/personal-branding.dto';
import {
  buildEventFitScoreEmptyPresentation,
  eventMeetsMinFitScore,
  filterEventsByMinFitScore,
  resolveEventFitScoreEmpty,
  suggestLowerMinFitScoreThreshold,
} from './event-fit-score-filter';

function event(overrides: Partial<InPersonEvent> = {}): InPersonEvent {
  return {
    id: 'evt-1',
    title: 'Test Event',
    dateConfidence: 'exact',
    eventType: 'conference',
    topicTags: [],
    status: 'NEW',
    manuallyAdded: false,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
    ...overrides,
  };
}

describe('eventMeetsMinFitScore', () => {
  it('passes when aiFitScore is null', () => {
    expect(eventMeetsMinFitScore(event({ aiFitScore: null }), 80)).toBe(true);
  });

  it('passes when score meets threshold', () => {
    expect(eventMeetsMinFitScore(event({ aiFitScore: 40 }), 40)).toBe(true);
    expect(eventMeetsMinFitScore(event({ aiFitScore: 55 }), 40)).toBe(true);
  });

  it('fails when score is below threshold', () => {
    expect(eventMeetsMinFitScore(event({ aiFitScore: 39 }), 40)).toBe(false);
  });
});

describe('filterEventsByMinFitScore', () => {
  it('filters out low-score rows', () => {
    const rows = [
      event({ id: 'a', aiFitScore: 30 }),
      event({ id: 'b', aiFitScore: 50 }),
      event({ id: 'c', aiFitScore: null }),
    ];
    expect(filterEventsByMinFitScore(rows, 40).map((row) => row.id)).toEqual(['b', 'c']);
  });
});

describe('resolveEventFitScoreEmpty', () => {
  it('returns none when filtered rows exist', () => {
    expect(resolveEventFitScoreEmpty({ rawCount: 3, filteredCount: 1, minFitScore: 60 })).toBe(
      'none'
    );
  });

  it('returns none when no raw rows', () => {
    expect(resolveEventFitScoreEmpty({ rawCount: 0, filteredCount: 0, minFitScore: 60 })).toBe(
      'none'
    );
  });

  it('returns threshold when raw rows are all hidden', () => {
    expect(resolveEventFitScoreEmpty({ rawCount: 2, filteredCount: 0, minFitScore: 60 })).toBe(
      'threshold'
    );
  });

  it('returns none when minFitScore is already zero', () => {
    expect(resolveEventFitScoreEmpty({ rawCount: 2, filteredCount: 0, minFitScore: 0 })).toBe(
      'none'
    );
  });
});

describe('suggestLowerMinFitScoreThreshold', () => {
  it('suggests 20 when above 20', () => {
    expect(suggestLowerMinFitScoreThreshold(55)).toBe(20);
    expect(suggestLowerMinFitScoreThreshold(21)).toBe(20);
  });

  it('suggests 0 when between 1 and 20', () => {
    expect(suggestLowerMinFitScoreThreshold(20)).toBe(0);
    expect(suggestLowerMinFitScoreThreshold(1)).toBe(0);
  });

  it('returns null at zero', () => {
    expect(suggestLowerMinFitScoreThreshold(0)).toBeNull();
  });
});

describe('buildEventFitScoreEmptyPresentation', () => {
  it('builds lower-to-20 action when threshold is above 20', () => {
    const presentation = buildEventFitScoreEmptyPresentation({
      minFitScore: 55,
      hiddenCount: 2,
      section: 'upcoming',
    });

    expect(presentation?.scene).toBe('filteredEmpty');
    expect(presentation?.description).toContain('min fit score 55');
    expect(presentation?.description).toContain('2 upcoming events are hidden');
    expect(presentation?.actionLabel).toBe('Lower threshold to 20');
    expect(presentation?.lowerTo).toBe(20);
  });

  it('builds lower-to-0 action when threshold is 20 or below', () => {
    const presentation = buildEventFitScoreEmptyPresentation({
      minFitScore: 15,
      hiddenCount: 1,
      section: 'past',
    });

    expect(presentation?.description).toContain('1 past event is hidden');
    expect(presentation?.actionLabel).toBe('Lower threshold to 0');
    expect(presentation?.lowerTo).toBe(0);
  });

  it('returns null when threshold is already zero', () => {
    expect(
      buildEventFitScoreEmptyPresentation({
        minFitScore: 0,
        hiddenCount: 3,
        section: 'upcoming',
      })
    ).toBeNull();
  });
});
