import type { AssistantIntervention } from '@/types/api-contracts';

export function interventionOccurrenceCount(item: AssistantIntervention): number {
  return item.occurrenceCount ?? 1;
}

export function formatInterventionStackLabel(item: AssistantIntervention): string | null {
  const count = interventionOccurrenceCount(item);
  if (count <= 1) return null;
  return `${count}×`;
}

export function formatInterventionLastSeen(item: AssistantIntervention): string | null {
  const ts = item.lastSeenAt ?? item.updatedAt;
  if (!ts) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts));
  } catch {
    return null;
  }
}

export function interventionStackChipClassName(): string {
  return 'inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}
