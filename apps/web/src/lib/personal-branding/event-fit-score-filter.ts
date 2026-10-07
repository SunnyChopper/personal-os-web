import type { EmptyStateSceneId } from '@/components/molecules/EmptyState';
import type { InPersonEvent } from '@/types/api/personal-branding.dto';

export const EVENT_FIT_SCORE_RELAXED_THRESHOLD = 20;
export const DEFAULT_MIN_FIT_SCORE = 40;

export type EventFitScoreSection = 'upcoming' | 'past';

export function eventMeetsMinFitScore(event: InPersonEvent, minFitScore: number): boolean {
  if (event.aiFitScore == null) return true;
  return event.aiFitScore >= minFitScore;
}

export function filterEventsByMinFitScore(
  events: InPersonEvent[],
  minFitScore: number
): InPersonEvent[] {
  return events.filter((event) => eventMeetsMinFitScore(event, minFitScore));
}

export type EventFitScoreEmptyKind = 'none' | 'threshold';

export function resolveEventFitScoreEmpty(input: {
  rawCount: number;
  filteredCount: number;
  minFitScore: number;
}): EventFitScoreEmptyKind {
  if (input.filteredCount > 0) return 'none';
  if (input.rawCount === 0) return 'none';
  if (input.minFitScore <= 0) return 'none';
  return 'threshold';
}

export function suggestLowerMinFitScoreThreshold(current: number): number | null {
  if (current > EVENT_FIT_SCORE_RELAXED_THRESHOLD) return EVENT_FIT_SCORE_RELAXED_THRESHOLD;
  if (current > 0) return 0;
  return null;
}

export type EventFitScoreEmptyPresentation = {
  kind: 'threshold';
  scene: EmptyStateSceneId;
  title: string;
  description: string;
  actionLabel: string;
  lowerTo: number;
};

function sectionLabel(section: EventFitScoreSection): string {
  return section === 'upcoming' ? 'upcoming' : 'past';
}

export function buildEventFitScoreEmptyPresentation(input: {
  minFitScore: number;
  hiddenCount: number;
  section: EventFitScoreSection;
}): EventFitScoreEmptyPresentation | null {
  const lowerTo = suggestLowerMinFitScoreThreshold(input.minFitScore);
  if (lowerTo == null) return null;

  const noun = input.hiddenCount === 1 ? 'event is' : 'events are';
  const sectionWord = sectionLabel(input.section);

  return {
    kind: 'threshold',
    scene: 'filteredEmpty',
    title: 'No events meet your min fit score',
    description: `${input.hiddenCount} ${sectionWord} ${noun} hidden by min fit score ${input.minFitScore}. Lower the threshold to see them.`,
    actionLabel: `Lower threshold to ${lowerTo}`,
    lowerTo,
  };
}
