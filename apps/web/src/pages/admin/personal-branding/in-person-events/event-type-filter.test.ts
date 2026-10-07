import { describe, expect, it } from 'vitest';
import { EVENT_TYPE_OPTIONS, isAllEventTypes, toggleEventTypeFilter } from './event-type-filter';

describe('event-type-filter', () => {
  it('isAllEventTypes is true only for an empty allowlist', () => {
    expect(isAllEventTypes([])).toBe(true);
    expect(isAllEventTypes(['conference'])).toBe(false);
  });

  it('clicking All types clears the allowlist', () => {
    expect(toggleEventTypeFilter(['conference', 'meetup'], 'all')).toEqual([]);
    expect(toggleEventTypeFilter([], 'all')).toEqual([]);
  });

  it('clicking a type from All starts an explicit allowlist with that type', () => {
    expect(toggleEventTypeFilter([], 'conference')).toEqual(['conference']);
    expect(toggleEventTypeFilter([], 'workshop')).toEqual(['workshop']);
  });

  it('toggles types on and off within an allowlist', () => {
    expect(toggleEventTypeFilter(['conference'], 'meetup')).toEqual(['conference', 'meetup']);
    expect(toggleEventTypeFilter(['conference', 'meetup'], 'conference')).toEqual(['meetup']);
  });

  it('deselecting the last type returns to All (empty allowlist)', () => {
    expect(toggleEventTypeFilter(['conference'], 'conference')).toEqual([]);
  });

  it('EVENT_TYPE_OPTIONS covers every InPersonEventType label used in Settings', () => {
    expect(EVENT_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      'conference',
      'meetup',
      'workshop',
      'networking',
      'hackathon',
      'talk',
      'other',
    ]);
  });
});
