import type { EventDiscoveryRun } from '@/types/api/personal-branding.dto';

export type EventDiscoveryOutcomeCounts = {
  totalScored: number;
  metMinFit: number;
};

/** Derive scored vs min-fit counts from run counters (no `eventsScored` API field). */
export function eventDiscoveryOutcomeCounts(run: EventDiscoveryRun): EventDiscoveryOutcomeCounts {
  const created = run.eventsCreated ?? 0;
  const duplicate = run.eventsDuplicate ?? 0;
  const filtered = run.eventsFiltered ?? 0;
  return {
    totalScored: created + duplicate + filtered,
    metMinFit: created + duplicate,
  };
}

function pluralizeEvents(count: number): string {
  return count === 1 ? 'event' : 'events';
}

export type EventDiscoverySuccessToast = {
  title: string;
  message: string;
};

export function formatEventDiscoverySuccessToast(
  run: EventDiscoveryRun,
  minFitScore: number
): EventDiscoverySuccessToast {
  const { totalScored, metMinFit } = eventDiscoveryOutcomeCounts(run);
  return {
    title: 'Discovery finished',
    message: `Scored ${totalScored} ${pluralizeEvents(totalScored)}; ${metMinFit} kept (filters: min fit ${minFitScore}, exclude keywords, lookahead).`,
  };
}
