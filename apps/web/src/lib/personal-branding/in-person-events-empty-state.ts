import type { EmptyStateSceneId } from '@/components/molecules/EmptyState';

export type UpcomingEventsEmptyKind = 'neverRun' | 'runFailed' | 'zeroMatch' | 'minFitFiltered';

export type PastEventsEmptyKind = 'neverRun' | 'afterRun';

export type UpcomingEventsEmptyAction = 'runDiscovery' | 'openSettings';

export function resolveUpcomingEventsEmptyKind(input: {
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  lastSuccessfulRunAt?: string | null;
  latestRunStatus?: string | null;
  runCount: number;
  eventsFiltered: number;
  persistedEventCount: number;
  hasCompletedRun: boolean;
}): UpcomingEventsEmptyKind | null {
  if (input.persistedEventCount > 0) {
    return null;
  }

  const neverRun = !input.lastRunAt && input.runCount === 0;
  if (neverRun) {
    return 'neverRun';
  }

  const failed =
    input.lastRunStatus === 'failed' ||
    input.latestRunStatus === 'failed' ||
    (!input.lastSuccessfulRunAt && !input.hasCompletedRun && input.runCount > 0);
  if (failed) {
    return 'runFailed';
  }

  if (input.eventsFiltered > 0) {
    return 'minFitFiltered';
  }

  return 'zeroMatch';
}

export type UpcomingEventsEmptyPresentation = {
  kind: UpcomingEventsEmptyKind;
  scene: EmptyStateSceneId;
  title: string;
  description: string;
  actionLabel?: string;
  action: UpcomingEventsEmptyAction | null;
};

export function buildUpcomingEventsEmptyPresentation(input: {
  kind: UpcomingEventsEmptyKind;
  minFitScore: number;
  eventsFiltered: number;
  hasStints: boolean;
  lastErrorSummary?: string | null;
}): UpcomingEventsEmptyPresentation {
  const { kind, minFitScore, eventsFiltered, hasStints, lastErrorSummary } = input;

  if (kind === 'neverRun') {
    return {
      kind,
      scene: 'reconAwaitingIngest',
      title: 'Discovery has not run yet',
      description:
        'Location stints and interests drive search. Run discovery to populate Upcoming.',
      actionLabel: hasStints ? 'Run discovery now' : 'Add a location stint',
      action: hasStints ? 'runDiscovery' : 'openSettings',
    };
  }

  if (kind === 'runFailed') {
    const detail = lastErrorSummary?.trim();
    return {
      kind,
      scene: 'reconAwaitingIngest',
      title: 'Discovery did not finish successfully',
      description: detail
        ? detail
        : 'The last discovery run failed before events could be saved. Check Settings and try again.',
      actionLabel: hasStints ? 'Run discovery now' : 'Add a location stint',
      action: hasStints ? 'runDiscovery' : 'openSettings',
    };
  }

  if (kind === 'zeroMatch') {
    return {
      kind,
      scene: 'reconScarcity',
      title: 'No events matched your stints and interests',
      description:
        'Last run finished without keeping any events. Tighten or broaden interests, types, or locations, then run again.',
      actionLabel: 'Open Settings',
      action: 'openSettings',
    };
  }

  const candidateLabel = eventsFiltered === 1 ? 'candidate was' : 'candidates were';
  return {
    kind,
    scene: 'filteredEmpty',
    title: 'Events were found but none were kept',
    description: `${eventsFiltered} ${candidateLabel} filtered during discovery (min fit score ${minFitScore}, exclude keywords, or beyond lookahead/stint end). Lower the threshold in Settings if you want to see more.`,
    action: null,
  };
}

export function resolvePastEventsEmptyKind(input: {
  lastRunAt?: string | null;
  runCount: number;
}): PastEventsEmptyKind {
  if (!input.lastRunAt && input.runCount === 0) {
    return 'neverRun';
  }
  return 'afterRun';
}

export function pastEventsEmptyCopy(kind: PastEventsEmptyKind): string {
  if (kind === 'neverRun') {
    return 'Past events show here after discovery finds dates that have already passed.';
  }
  return 'No past events yet.';
}
