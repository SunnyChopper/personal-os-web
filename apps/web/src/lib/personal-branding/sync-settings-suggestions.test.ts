import { describe, expect, it } from 'vitest';
import type { RadarSource, RadarSourceCadenceSuggestion } from '@/types/api/personal-branding.dto';
import {
  formatSuggestedCadenceChipLabel,
  formatSuggestionWhy,
  partitionSourcesByCadenceOverride,
  suggestionMatchesOverride,
} from './sync-settings-suggestions';

function makeSource(id: string, name: string): RadarSource {
  return {
    id,
    name,
    sourceType: 'RSS',
    endpoint: 'https://example.com/feed',
    httpMethod: 'GET',
    requestParams: {},
    headers: {},
    authScheme: 'NONE',
    hasSecret: false,
    enabled: true,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeSuggestion(
  partial: Partial<RadarSourceCadenceSuggestion> & Pick<RadarSourceCadenceSuggestion, 'sourceId'>
): RadarSourceCadenceSuggestion {
  return {
    sourceName: 'Source',
    enoughData: false,
    sampleSize: 0,
    message: 'Need more data',
    ...partial,
  };
}

describe('partitionSourcesByCadenceOverride', () => {
  it('splits sources by whether cadence override is set', () => {
    const sources = [makeSource('a', 'A'), makeSource('b', 'B')];
    const overrides = {
      a: { cadence: '' as const, cadenceIntervalHours: 6 },
      b: { cadence: 'DAILY' as const, cadenceIntervalHours: 6 },
    };

    const { usingGlobal, withOverride } = partitionSourcesByCadenceOverride(sources, overrides);

    expect(usingGlobal.map((s) => s.id)).toEqual(['a']);
    expect(withOverride.map((s) => s.id)).toEqual(['b']);
  });
});

describe('formatSuggestedCadenceChipLabel', () => {
  it('returns hourly label with interval', () => {
    const label = formatSuggestedCadenceChipLabel(
      makeSuggestion({
        sourceId: 'a',
        enoughData: true,
        suggestedCadence: 'EVERY_N_HOURS',
        suggestedIntervalHours: 6,
      })
    );
    expect(label).toBe('Every 6h');
  });

  it('returns null when not enough data', () => {
    expect(
      formatSuggestedCadenceChipLabel(makeSuggestion({ sourceId: 'a', enoughData: false }))
    ).toBeNull();
  });
});

describe('formatSuggestionWhy', () => {
  it('formats structured why line when enough data', () => {
    const why = formatSuggestionWhy(
      makeSuggestion({
        sourceId: 'a',
        enoughData: true,
        sampleSize: 8,
        medianGapHours: 12.4,
        suggestedCadence: 'DAILY',
      })
    );
    expect(why).toBe('Why: median arrival 12.4h across 8 gaps');
  });

  it('falls back to message when insufficient data', () => {
    const why = formatSuggestionWhy(
      makeSuggestion({
        sourceId: 'a',
        enoughData: false,
        message: 'Need at least 5 content gaps',
      })
    );
    expect(why).toBe('Need at least 5 content gaps');
  });
});

describe('suggestionMatchesOverride', () => {
  it('matches daily cadence', () => {
    const suggestion = makeSuggestion({
      sourceId: 'a',
      enoughData: true,
      suggestedCadence: 'DAILY',
    });
    const override = { cadence: 'DAILY' as const, cadenceIntervalHours: 6 };
    expect(suggestionMatchesOverride(suggestion, override)).toBe(true);
  });

  it('requires matching interval for hourly cadence', () => {
    const suggestion = makeSuggestion({
      sourceId: 'a',
      enoughData: true,
      suggestedCadence: 'EVERY_N_HOURS',
      suggestedIntervalHours: 6,
    });
    expect(
      suggestionMatchesOverride(suggestion, { cadence: 'EVERY_N_HOURS', cadenceIntervalHours: 6 })
    ).toBe(true);
    expect(
      suggestionMatchesOverride(suggestion, { cadence: 'EVERY_N_HOURS', cadenceIntervalHours: 12 })
    ).toBe(false);
  });
});
