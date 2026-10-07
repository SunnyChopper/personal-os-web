import { describe, expect, it } from 'vitest';
import {
  eventDiscoveryOutcomeCounts,
  formatEventDiscoverySuccessToast,
} from './event-discovery-outcome';
import type { EventDiscoveryRun } from '@/types/api/personal-branding.dto';

function run(overrides: Partial<EventDiscoveryRun> = {}): EventDiscoveryRun {
  return {
    id: 'run-1',
    status: 'completed',
    triggerKind: 'manual',
    phase: 'completed',
    queriesGenerated: 0,
    resultsFetched: 0,
    candidatesExtracted: 0,
    eventsCreated: 0,
    eventsDuplicate: 0,
    eventsFiltered: 0,
    generatedQueries: [],
    activityLog: [],
    extractedEvents: [],
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-10T00:05:00.000Z',
    ...overrides,
  };
}

describe('eventDiscoveryOutcomeCounts', () => {
  it('sums created, duplicate, and filtered for total scored', () => {
    expect(
      eventDiscoveryOutcomeCounts(run({ eventsCreated: 3, eventsDuplicate: 2, eventsFiltered: 7 }))
    ).toEqual({ totalScored: 12, metMinFit: 5 });
  });

  it('handles zero counters', () => {
    expect(eventDiscoveryOutcomeCounts(run())).toEqual({ totalScored: 0, metMinFit: 0 });
  });
});

describe('formatEventDiscoverySuccessToast', () => {
  it('formats plural copy with threshold', () => {
    expect(
      formatEventDiscoverySuccessToast(
        run({ eventsCreated: 3, eventsDuplicate: 1, eventsFiltered: 8 }),
        40
      )
    ).toEqual({
      title: 'Discovery finished',
      message: 'Scored 12 events; 4 kept (filters: min fit 40, exclude keywords, lookahead).',
    });
  });

  it('uses singular event when total scored is 1', () => {
    expect(
      formatEventDiscoverySuccessToast(
        run({ eventsCreated: 1, eventsDuplicate: 0, eventsFiltered: 0 }),
        55
      )
    ).toEqual({
      title: 'Discovery finished',
      message: 'Scored 1 event; 1 kept (filters: min fit 55, exclude keywords, lookahead).',
    });
  });

  it('formats zero-scored completion', () => {
    expect(formatEventDiscoverySuccessToast(run(), 40)).toEqual({
      title: 'Discovery finished',
      message: 'Scored 0 events; 0 kept (filters: min fit 40, exclude keywords, lookahead).',
    });
  });
});
