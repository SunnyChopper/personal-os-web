export type RecommendedActionIconKind = 'reply' | 'quote' | 'like' | 'monitor' | 'skip' | 'other';

export function normalizeRecommendedAction(action?: string | null): string {
  return (action ?? '').trim().toLowerCase();
}

export function recommendedActionIconKind(action?: string | null): RecommendedActionIconKind {
  const normalized = normalizeRecommendedAction(action);
  if (normalized === 'reply') return 'reply';
  if (normalized === 'quote') return 'quote';
  if (normalized === 'like') return 'like';
  if (normalized === 'monitor') return 'monitor';
  if (normalized === 'skip') return 'skip';
  return 'other';
}

export function nextActionCueForRecommendedAction(action?: string | null): string | null {
  switch (recommendedActionIconKind(action)) {
    case 'reply':
      return 'Next: Reply in-thread';
    case 'quote':
      return 'Next: Quote-tweet with your take';
    case 'like':
      return 'Next: Like to signal support';
    case 'monitor':
      return 'Next: Monitor — no draft needed yet';
    default:
      return null;
  }
}

export function recommendedActionBadgeClassName(action?: string | null): string {
  switch (recommendedActionIconKind(action)) {
    case 'reply':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
    case 'quote':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200';
    case 'like':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    case 'monitor':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'skip':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}
