import type { PlannerBlockingContext, PlannerDay } from '@/types/planner';

export function isPlannerDayBlocked(
  day: Pick<PlannerDay, 'isBlocked' | 'blockingContexts'>
): boolean {
  return Boolean(day.isBlocked || (day.blockingContexts?.length ?? 0) > 0);
}

export function manualBlockingContextForDate(
  day: Pick<PlannerDay, 'blockingContexts'>,
  date: string
): PlannerBlockingContext | undefined {
  return day.blockingContexts?.find((c) => c.isManual && c.startDate <= date && c.endDate >= date);
}

export function blockingLabel(day: Pick<PlannerDay, 'blockingContexts'>): string {
  const ctx = day.blockingContexts?.[0];
  if (!ctx) return 'Out of Office';
  if (ctx.kind === 'trip') return 'Trip';
  return ctx.label || 'Out of Office';
}

export function blockingOverlayEmoji(day: Pick<PlannerDay, 'blockingContexts'>): string {
  const ctx = day.blockingContexts?.[0];
  return ctx?.kind === 'trip' ? '✈️' : '🏖️';
}
