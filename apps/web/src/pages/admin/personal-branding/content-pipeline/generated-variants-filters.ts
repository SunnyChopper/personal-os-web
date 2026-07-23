import { localCalendarDate } from '@/lib/date/local-calendar';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type ContentVariant,
  type ContentVariantDistributionStatus,
} from '@/types/api/personal-branding.dto';

export type GeneratedVariantsDatePreset = 'all' | 'today' | '7d' | '30d';

export type GeneratedVariantsSort = 'newest' | 'oldest' | 'platform';

export interface GeneratedVariantsFilters {
  platforms: BrandPlatform[];
  datePreset: GeneratedVariantsDatePreset;
  distributionStatuses: ContentVariantDistributionStatus[];
}

export const EMPTY_GENERATED_VARIANTS_FILTERS: GeneratedVariantsFilters = {
  platforms: [],
  datePreset: 'all',
  distributionStatuses: [],
};

export const DEFAULT_GENERATED_VARIANTS_SORT: GeneratedVariantsSort = 'newest';

export const GENERATED_VARIANTS_DATE_PRESET_OPTIONS: {
  value: GeneratedVariantsDatePreset;
  label: string;
}[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export const GENERATED_VARIANTS_SORT_OPTIONS: {
  value: GeneratedVariantsSort;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'platform', label: 'Platform' },
];

export const GENERATED_VARIANTS_PLATFORM_ORDER = Object.keys(
  BRAND_PLATFORM_LABELS
) as BrandPlatform[];

export const GENERATED_VARIANTS_DISTRIBUTION_STATUS_ORDER: ContentVariantDistributionStatus[] = [
  'DRAFT',
  'READY',
  'SCHEDULED',
  'DEPLOYED',
];

function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function createdAtCutoffForDatePreset(
  preset: GeneratedVariantsDatePreset,
  now = new Date()
): Date | null {
  if (preset === 'all') return null;
  if (preset === 'today') return startOfLocalDay(now);
  const days = preset === '7d' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function matchesGeneratedVariantsDatePreset(
  createdAt: string,
  preset: GeneratedVariantsDatePreset,
  now = new Date()
): boolean {
  if (preset === 'all') return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  if (preset === 'today') {
    return localCalendarDate(created) === localCalendarDate(now);
  }

  const cutoff = createdAtCutoffForDatePreset(preset, now);
  return cutoff != null && created >= cutoff;
}

export function matchesGeneratedVariantsFilters(
  variant: ContentVariant,
  filters: GeneratedVariantsFilters,
  now = new Date()
): boolean {
  if (filters.platforms.length > 0 && !filters.platforms.includes(variant.platform)) {
    return false;
  }

  if (
    filters.distributionStatuses.length > 0 &&
    !filters.distributionStatuses.includes(variant.distributionStatus)
  ) {
    return false;
  }

  if (!matchesGeneratedVariantsDatePreset(variant.createdAt, filters.datePreset, now)) {
    return false;
  }

  return true;
}

export function hasActiveGeneratedVariantsFilters(
  filters: GeneratedVariantsFilters,
  sort: GeneratedVariantsSort = DEFAULT_GENERATED_VARIANTS_SORT
): boolean {
  return (
    filters.platforms.length > 0 ||
    filters.datePreset !== 'all' ||
    filters.distributionStatuses.length > 0 ||
    sort !== DEFAULT_GENERATED_VARIANTS_SORT
  );
}

export function hasSecondaryGeneratedVariantsFilters(filters: GeneratedVariantsFilters): boolean {
  return filters.datePreset !== 'all' || filters.distributionStatuses.length > 0;
}

export function sortGeneratedVariants(
  variants: ContentVariant[],
  sort: GeneratedVariantsSort
): ContentVariant[] {
  const sorted = [...variants];
  if (sort === 'newest') {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }
  if (sort === 'oldest') {
    sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sorted;
  }
  sorted.sort((a, b) => {
    const platformOrder = BRAND_PLATFORM_LABELS[a.platform].localeCompare(
      BRAND_PLATFORM_LABELS[b.platform]
    );
    if (platformOrder !== 0) return platformOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return sorted;
}

export function filterGeneratedVariants(
  variants: ContentVariant[],
  filters: GeneratedVariantsFilters,
  now = new Date()
): ContentVariant[] {
  return variants.filter((variant) => matchesGeneratedVariantsFilters(variant, filters, now));
}

export function filterAndSortGeneratedVariants(
  variants: ContentVariant[],
  filters: GeneratedVariantsFilters,
  sort: GeneratedVariantsSort,
  now = new Date()
): ContentVariant[] {
  return sortGeneratedVariants(filterGeneratedVariants(variants, filters, now), sort);
}

export function skeletonPlatformMatchesFilter(
  platform: string,
  filters: GeneratedVariantsFilters
): boolean {
  if (filters.platforms.length === 0) return true;
  return filters.platforms.includes(platform as BrandPlatform);
}
