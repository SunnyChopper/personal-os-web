import type { BrandProjectJob } from '@/types/api/personal-branding.dto';

export type ProjectIdeationStatusInput = {
  job: BrandProjectJob | null | undefined;
  isSubmitting: boolean;
  /** True when generate 202 attached to an existing job for this activeJobId. */
  replayed: boolean;
  /** Trend cards sent with this generate. Omit to keep the no-cards copy. */
  cardCount?: number | null;
};

function cardsPhrase(cardCount: number): string {
  return cardCount === 1 ? '1 card' : `${cardCount} cards`;
}

function withCardsUsed(line: string, cardCount?: number | null): string {
  if (cardCount == null || cardCount <= 0 || !line.endsWith('…')) return line;
  return `${line.slice(0, -1)} from ${cardsPhrase(cardCount)}…`;
}

function nearDuplicateSuffix(count: number): string {
  if (count <= 0) return '';
  if (count === 1) return ' 1 near-duplicate dropped.';
  return ` ${count} near-duplicates dropped.`;
}

export function projectIdeationSuccessOutcome(
  added: number,
  dropped: number,
  cardCount?: number | null
): string {
  const fromCards = cardCount != null && cardCount > 0 ? ` from ${cardsPhrase(cardCount)}` : '';
  const main =
    added === 0
      ? `No new ideas were added${fromCards}.`
      : added === 1
        ? `1 idea added${fromCards}.`
        : `${added} ideas added${fromCards}.`;
  return `${main}${nearDuplicateSuffix(dropped)}`;
}

export function projectIdeationJobInFlight(
  job: Pick<BrandProjectJob, 'status'> | null | undefined,
  isSubmitting: boolean
): boolean {
  if (isSubmitting) return true;
  if (!job) return false;
  return job.status === 'queued' || job.status === 'running';
}

export function projectIdeationJobFailed(
  job: Pick<BrandProjectJob, 'status'> | null | undefined
): boolean {
  return job?.status === 'failed';
}

export function projectIdeationJobSucceeded(
  job: Pick<BrandProjectJob, 'status'> | null | undefined
): boolean {
  return job?.status === 'succeeded';
}

export function projectIdeationStatusLine(input: ProjectIdeationStatusInput): string | null {
  const { job, isSubmitting, replayed, cardCount } = input;

  if (isSubmitting && !job) {
    return withCardsUsed('Queued for generation…', cardCount);
  }

  if (!job) {
    return null;
  }

  if (job.status === 'failed') {
    const trimmed = job.error?.trim();
    return trimmed || 'Generation failed.';
  }

  if (job.status === 'succeeded') {
    const added = job.ideaIds.length;
    const dropped = job.droppedDuplicateCount ?? 0;
    const outcome = projectIdeationSuccessOutcome(added, dropped, cardCount);
    if (replayed) {
      return `Already generated for this day and direction. ${outcome}`;
    }
    return outcome;
  }

  if (replayed && (job.status === 'queued' || job.status === 'running')) {
    return withCardsUsed('This batch is already generating…', cardCount);
  }

  if (job.status === 'queued') {
    return withCardsUsed('Queued for generation…', cardCount);
  }

  if (job.status === 'running') {
    return withCardsUsed('Generation in progress…', cardCount);
  }

  return null;
}

export function projectIdeationShowStatus(
  job: BrandProjectJob | null | undefined,
  isSubmitting: boolean
): boolean {
  if (isSubmitting) return true;
  if (!job || job.jobType !== 'ideation') return false;
  return true;
}
