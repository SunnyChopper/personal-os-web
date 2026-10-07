import { describe, expect, it } from 'vitest';
import {
  buildUpcomingEventsEmptyPresentation,
  pastEventsEmptyCopy,
  resolvePastEventsEmptyKind,
  resolveUpcomingEventsEmptyKind,
} from './in-person-events-empty-state';

describe('resolveUpcomingEventsEmptyKind', () => {
  it('returns null when persisted events exist', () => {
    expect(
      resolveUpcomingEventsEmptyKind({
        lastRunAt: null,
        runCount: 0,
        eventsFiltered: 0,
        persistedEventCount: 2,
        hasCompletedRun: false,
      })
    ).toBeNull();
  });

  it('prefers neverRun when discovery has never run', () => {
    expect(
      resolveUpcomingEventsEmptyKind({
        lastRunAt: null,
        runCount: 0,
        eventsFiltered: 0,
        persistedEventCount: 0,
        hasCompletedRun: false,
      })
    ).toBe('neverRun');
  });

  it('prefers minFitFiltered when filtered candidates exist', () => {
    expect(
      resolveUpcomingEventsEmptyKind({
        lastRunAt: '2026-08-01T00:00:00.000Z',
        lastSuccessfulRunAt: '2026-08-01T00:00:00.000Z',
        runCount: 1,
        eventsFiltered: 3,
        persistedEventCount: 0,
        hasCompletedRun: true,
      })
    ).toBe('minFitFiltered');
  });

  it('falls back to zeroMatch when a run completed with no kept events', () => {
    expect(
      resolveUpcomingEventsEmptyKind({
        lastRunAt: '2026-08-01T00:00:00.000Z',
        lastSuccessfulRunAt: '2026-08-01T00:00:00.000Z',
        runCount: 1,
        eventsFiltered: 0,
        persistedEventCount: 0,
        hasCompletedRun: true,
      })
    ).toBe('zeroMatch');
  });

  it('prefers runFailed when latest run failed without a successful completion', () => {
    expect(
      resolveUpcomingEventsEmptyKind({
        lastRunAt: '2026-08-01T00:00:00.000Z',
        lastRunStatus: 'failed',
        latestRunStatus: 'failed',
        runCount: 1,
        eventsFiltered: 0,
        persistedEventCount: 0,
        hasCompletedRun: false,
      })
    ).toBe('runFailed');
  });
});

describe('buildUpcomingEventsEmptyPresentation', () => {
  it('routes neverRun without stints to settings', () => {
    const presentation = buildUpcomingEventsEmptyPresentation({
      kind: 'neverRun',
      minFitScore: 40,
      eventsFiltered: 0,
      hasStints: false,
    });

    expect(presentation.scene).toBe('reconAwaitingIngest');
    expect(presentation.actionLabel).toBe('Add a location stint');
    expect(presentation.action).toBe('openSettings');
  });

  it('routes neverRun with stints to discovery', () => {
    const presentation = buildUpcomingEventsEmptyPresentation({
      kind: 'neverRun',
      minFitScore: 40,
      eventsFiltered: 0,
      hasStints: true,
    });

    expect(presentation.actionLabel).toBe('Run discovery now');
    expect(presentation.action).toBe('runDiscovery');
  });

  it('builds runFailed discovery CTA', () => {
    const presentation = buildUpcomingEventsEmptyPresentation({
      kind: 'runFailed',
      minFitScore: 40,
      eventsFiltered: 0,
      hasStints: true,
      lastErrorSummary: 'Worker timeout',
    });

    expect(presentation.title).toContain('did not finish');
    expect(presentation.description).toBe('Worker timeout');
    expect(presentation.actionLabel).toBe('Run discovery now');
  });

  it('builds zeroMatch settings CTA', () => {
    const presentation = buildUpcomingEventsEmptyPresentation({
      kind: 'zeroMatch',
      minFitScore: 40,
      eventsFiltered: 0,
      hasStints: true,
    });

    expect(presentation.scene).toBe('reconScarcity');
    expect(presentation.action).toBe('openSettings');
  });

  it('builds min-fit copy without a primary CTA', () => {
    const presentation = buildUpcomingEventsEmptyPresentation({
      kind: 'minFitFiltered',
      minFitScore: 55,
      eventsFiltered: 2,
      hasStints: true,
    });

    expect(presentation.scene).toBe('filteredEmpty');
    expect(presentation.description).toContain(
      '2 candidates were filtered during discovery (min fit score 55, exclude keywords, or beyond lookahead/stint end)'
    );
    expect(presentation.action).toBeNull();
    expect(presentation.actionLabel).toBeUndefined();
  });

  it('uses singular candidate copy for one filtered event', () => {
    const presentation = buildUpcomingEventsEmptyPresentation({
      kind: 'minFitFiltered',
      minFitScore: 40,
      eventsFiltered: 1,
      hasStints: true,
    });

    expect(presentation.description).toContain(
      '1 candidate was filtered during discovery (min fit score 40, exclude keywords, or beyond lookahead/stint end)'
    );
  });
});

describe('pastEventsEmptyCopy', () => {
  it('uses never-run copy before discovery', () => {
    expect(resolvePastEventsEmptyKind({ lastRunAt: null, runCount: 0 })).toBe('neverRun');
    expect(pastEventsEmptyCopy('neverRun')).toContain('Past events show here');
  });

  it('uses after-run copy once discovery has run', () => {
    expect(resolvePastEventsEmptyKind({ lastRunAt: '2026-08-01T00:00:00.000Z', runCount: 1 })).toBe(
      'afterRun'
    );
    expect(pastEventsEmptyCopy('afterRun')).toBe('No past events yet.');
  });
});
