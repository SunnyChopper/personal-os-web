import type { ProactiveSuggestion } from '@/types/api-contracts';

function byUpdatedDesc(a: ProactiveSuggestion, b: ProactiveSuggestion): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function partitionProactiveSuggestions(all: ProactiveSuggestion[]): {
  pending: ProactiveSuggestion[];
  accepted: ProactiveSuggestion[];
  rejected: ProactiveSuggestion[];
} {
  const accepted = all.filter((s) => s.status === 'approved').sort(byUpdatedDesc);
  const rejected = all.filter((s) => s.status === 'rejected').sort(byUpdatedDesc);
  const pending = all.filter((s) => s.status !== 'approved' && s.status !== 'rejected');
  return { pending, accepted, rejected };
}
