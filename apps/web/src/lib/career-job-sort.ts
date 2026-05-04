import type { CareerJob } from '@/types/api/career.types';

/** Timestamp for sorting: start date when present, else createdAt (newest = larger key). */
export function jobRecencySortKey(j: CareerJob): number {
  if (j.startDate) {
    const t = Date.parse(j.startDate.slice(0, 10));
    if (Number.isFinite(t)) return t;
  }
  const c = j.createdAt ? Date.parse(j.createdAt) : 0;
  return Number.isFinite(c) ? c : 0;
}

/** Newest job first (matches Resume Builder lists + `achievementOptions` order). */
export function sortJobsByRecency(jobs: CareerJob[]): CareerJob[] {
  return [...jobs].sort((a, b) => jobRecencySortKey(b) - jobRecencySortKey(a));
}
