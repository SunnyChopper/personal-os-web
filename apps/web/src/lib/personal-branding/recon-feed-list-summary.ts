import type { ReconAgePreset } from '@/lib/personal-branding/recon-active-empty-state';

export type ReconFeedSortField = 'relevanceScore' | 'postedAt';

const DEFAULT_AGE_PRESET: ReconAgePreset = 'all';
const DEFAULT_SORT_FIELD: ReconFeedSortField = 'relevanceScore';

export function isNonDefaultReconFeedFilters(
  agePreset: ReconAgePreset,
  sortField: ReconFeedSortField
): boolean {
  return agePreset !== DEFAULT_AGE_PRESET || sortField !== DEFAULT_SORT_FIELD;
}

function formatAgeFilterSegment(agePreset: ReconAgePreset): string {
  if (agePreset === 'all') return 'all ages';
  if (agePreset === '2wk') return 'last 2 weeks';
  const days = agePreset === '1d' ? 1 : agePreset === '2d' ? 2 : agePreset === '3d' ? 3 : 7;
  return days === 1 ? 'last 1 day' : `last ${days} days`;
}

function formatSortFilterSegment(sortField: ReconFeedSortField): string {
  return sortField === 'postedAt' ? 'sorted by posted' : 'sorted by relevance';
}

function formatPostCountSegment(loadedCount: number, total: number): string {
  if (loadedCount < total) return `${loadedCount} of ${total} posts`;
  return `${total} post${total === 1 ? '' : 's'}`;
}

export function formatReconFeedListSummary(input: {
  loadedCount: number;
  total: number;
  agePreset: ReconAgePreset;
  sortField: ReconFeedSortField;
}): string {
  const { loadedCount, total, agePreset, sortField } = input;
  return [
    formatPostCountSegment(loadedCount, total),
    formatAgeFilterSegment(agePreset),
    formatSortFilterSegment(sortField),
  ].join(' · ');
}
