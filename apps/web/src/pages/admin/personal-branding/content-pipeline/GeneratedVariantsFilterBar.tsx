import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import { cn } from '@/lib/utils';
import {
  BRAND_PLATFORM_LABELS,
  CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS,
  type BrandPlatform,
  type ContentVariant,
  type ContentVariantDistributionStatus,
} from '@/types/api/personal-branding.dto';
import {
  selectableChipClassName,
  pbDenseListStackClassName,
  pbMetaClassName,
} from '../personal-branding-ui';
import {
  EMPTY_GENERATED_VARIANTS_FILTERS,
  GENERATED_VARIANTS_DATE_PRESET_OPTIONS,
  GENERATED_VARIANTS_DISTRIBUTION_STATUS_ORDER,
  GENERATED_VARIANTS_PLATFORM_ORDER,
  GENERATED_VARIANTS_SORT_OPTIONS,
  DEFAULT_GENERATED_VARIANTS_SORT,
  filterGeneratedVariants,
  hasActiveGeneratedVariantsFilters,
  hasSecondaryGeneratedVariantsFilters,
  type GeneratedVariantsFilters,
  type GeneratedVariantsSort,
} from './generated-variants-filters';

interface GeneratedVariantsFilterBarProps {
  variants: ContentVariant[];
  filters: GeneratedVariantsFilters;
  sort: GeneratedVariantsSort;
  onFiltersChange: (filters: GeneratedVariantsFilters) => void;
  onSortChange: (sort: GeneratedVariantsSort) => void;
}

function filterChipClassName(selected: boolean): string {
  return selectableChipClassName(
    selected,
    cn(
      'px-2.5 py-1 text-xs',
      selected
        ? 'ring-1 ring-blue-500/40'
        : 'border-transparent bg-white/60 text-gray-500 hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:bg-gray-900/40 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-900 dark:hover:text-gray-200'
    )
  );
}

function countSuffixClassName(selected: boolean): string {
  return cn(
    'ml-1 tabular-nums',
    selected ? 'text-blue-700/80 dark:text-blue-200/80' : 'text-gray-400 dark:text-gray-500'
  );
}

export default function GeneratedVariantsFilterBar({
  variants,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
}: GeneratedVariantsFilterBarProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const hasSecondaryFilters = hasSecondaryGeneratedVariantsFilters(filters);

  useEffect(() => {
    if (hasSecondaryFilters) {
      setMoreFiltersOpen(true);
    }
  }, [hasSecondaryFilters]);

  const counts = useMemo(() => {
    const platformCounts = Object.fromEntries(
      GENERATED_VARIANTS_PLATFORM_ORDER.map((platform) => [platform, 0])
    ) as Record<BrandPlatform, number>;
    const distributionCounts = Object.fromEntries(
      GENERATED_VARIANTS_DISTRIBUTION_STATUS_ORDER.map((status) => [status, 0])
    ) as Record<ContentVariantDistributionStatus, number>;

    for (const variant of variants) {
      platformCounts[variant.platform] += 1;
      distributionCounts[variant.distributionStatus] += 1;
    }

    return { platformCounts, distributionCounts };
  }, [variants]);

  const filteredCount = useMemo(
    () => filterGeneratedVariants(variants, filters).length,
    [variants, filters]
  );

  const hasActiveFilters = hasActiveGeneratedVariantsFilters(filters, sort);

  const togglePlatform = (platform: BrandPlatform) => {
    const selected = filters.platforms.includes(platform);
    const platforms = selected
      ? filters.platforms.filter((value) => value !== platform)
      : [...filters.platforms, platform];
    onFiltersChange({ ...filters, platforms });
  };

  const toggleDistributionStatus = (status: ContentVariantDistributionStatus) => {
    const selected = filters.distributionStatuses.includes(status);
    const distributionStatuses = selected
      ? filters.distributionStatuses.filter((value) => value !== status)
      : [...filters.distributionStatuses, status];
    onFiltersChange({ ...filters, distributionStatuses });
  };

  const clearAll = () => {
    onFiltersChange(EMPTY_GENERATED_VARIANTS_FILTERS);
    onSortChange(DEFAULT_GENERATED_VARIANTS_SORT);
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <InsetPanel className={cn('rounded-xl', pbDenseListStackClassName)}>
      <div className="flex flex-wrap items-center gap-2">
        <EyebrowLabel as="span">Filter & sort</EyebrowLabel>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <X className="size-3" aria-hidden />
            Clear
          </button>
        ) : null}
        <span className={cn('ml-auto tabular-nums', pbMetaClassName)}>
          {hasActiveFilters
            ? `${filteredCount} of ${variants.length} variants`
            : `${variants.length} variants`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by platform">
          {GENERATED_VARIANTS_PLATFORM_ORDER.map((platform) => {
            const selected = filters.platforms.includes(platform);
            const count = counts.platformCounts[platform];
            if (count === 0 && !selected) return null;
            return (
              <button
                key={platform}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePlatform(platform)}
                className={filterChipClassName(selected)}
              >
                {BRAND_PLATFORM_LABELS[platform]}
                <span className={countSuffixClassName(selected)}>({count})</span>
              </button>
            );
          })}
        </div>

        <span
          className="mx-0.5 hidden h-5 w-px shrink-0 self-center bg-gray-200 dark:bg-gray-700 sm:inline"
          aria-hidden
        />

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sort variants">
          {GENERATED_VARIANTS_SORT_OPTIONS.map(({ value, label }) => {
            const selected = sort === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => onSortChange(value)}
                className={filterChipClassName(selected)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={moreFiltersOpen}
          onClick={() => setMoreFiltersOpen((open) => !open)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          {moreFiltersOpen ? (
            <ChevronUp className="size-3.5" aria-hidden />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden />
          )}
          {moreFiltersOpen ? 'Fewer filters' : 'More filters'}
          {hasSecondaryFilters && !moreFiltersOpen ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
              Active
            </span>
          ) : null}
        </button>
      </div>

      {moreFiltersOpen ? (
        <div className="space-y-2 border-t border-dashed border-gray-200 pt-2 dark:border-gray-700">
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by generation date"
          >
            <span className="sr-only">Generated</span>
            {GENERATED_VARIANTS_DATE_PRESET_OPTIONS.map(({ value, label }) => {
              const selected = filters.datePreset === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onFiltersChange({ ...filters, datePreset: value })}
                  className={filterChipClassName(selected)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by distribution status"
          >
            <span className="sr-only">Status</span>
            {GENERATED_VARIANTS_DISTRIBUTION_STATUS_ORDER.map((status) => {
              const selected = filters.distributionStatuses.includes(status);
              const count = counts.distributionCounts[status];
              if (count === 0 && !selected) return null;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleDistributionStatus(status)}
                  className={filterChipClassName(selected)}
                >
                  {CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS[status]}
                  <span className={countSuffixClassName(selected)}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </InsetPanel>
  );
}
