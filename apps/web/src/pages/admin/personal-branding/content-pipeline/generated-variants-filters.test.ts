import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GENERATED_VARIANTS_SORT,
  EMPTY_GENERATED_VARIANTS_FILTERS,
  filterAndSortGeneratedVariants,
  hasActiveGeneratedVariantsFilters,
  hasSecondaryGeneratedVariantsFilters,
  matchesGeneratedVariantsDatePreset,
  matchesGeneratedVariantsFilters,
  skeletonPlatformMatchesFilter,
  sortGeneratedVariants,
} from './generated-variants-filters';
import type { ContentVariant } from '@/types/api/personal-branding.dto';

function makeVariant(overrides: Partial<ContentVariant>): ContentVariant {
  return {
    id: 'variant-1',
    sourceContentId: 'content-1',
    jobId: 'job-1',
    brandProfileId: 'profile-1',
    platform: 'linkedin',
    title: 'Title',
    body: 'Body',
    status: 'generated',
    distributionStatus: 'DRAFT',
    generationAttempt: 1,
    characterCount: 4,
    critiqueHistory: [],
    referencedContentIds: [],
    cached: false,
    userId: 'user-1',
    createdAt: '2026-07-21T12:00:00.000Z',
    updatedAt: '2026-07-21T12:00:00.000Z',
    ...overrides,
  };
}

describe('generated-variants-filters', () => {
  const now = new Date('2026-07-21T18:00:00.000Z');

  it('treats empty platform and status selections as all', () => {
    const variant = makeVariant({ platform: 'x', distributionStatus: 'READY' });
    expect(matchesGeneratedVariantsFilters(variant, EMPTY_GENERATED_VARIANTS_FILTERS, now)).toBe(
      true
    );
  });

  it('filters by platform and distribution status', () => {
    const linkedinDraft = makeVariant({ platform: 'linkedin', distributionStatus: 'DRAFT' });
    const xReady = makeVariant({ id: 'variant-2', platform: 'x', distributionStatus: 'READY' });

    expect(
      matchesGeneratedVariantsFilters(
        linkedinDraft,
        {
          ...EMPTY_GENERATED_VARIANTS_FILTERS,
          platforms: ['x'],
        },
        now
      )
    ).toBe(false);

    expect(
      matchesGeneratedVariantsFilters(
        xReady,
        {
          ...EMPTY_GENERATED_VARIANTS_FILTERS,
          platforms: ['x'],
          distributionStatuses: ['READY'],
        },
        now
      )
    ).toBe(true);

    expect(
      matchesGeneratedVariantsFilters(
        xReady,
        {
          ...EMPTY_GENERATED_VARIANTS_FILTERS,
          platforms: ['x'],
          distributionStatuses: ['DRAFT'],
        },
        now
      )
    ).toBe(false);
  });

  it('filters today using local calendar day', () => {
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayVariant = makeVariant({ createdAt: startToday.toISOString() });
    const yesterday = new Date(startToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayVariant = makeVariant({
      id: 'variant-2',
      createdAt: yesterday.toISOString(),
    });

    expect(matchesGeneratedVariantsDatePreset(todayVariant.createdAt, 'today', now)).toBe(true);
    expect(matchesGeneratedVariantsDatePreset(yesterdayVariant.createdAt, 'today', now)).toBe(
      false
    );
  });

  it('filters last 7 and 30 day presets', () => {
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const fortyDaysAgo = new Date(now);
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    const recent = makeVariant({ createdAt: sixDaysAgo.toISOString() });
    const older = makeVariant({ id: 'variant-2', createdAt: fortyDaysAgo.toISOString() });

    expect(matchesGeneratedVariantsDatePreset(recent.createdAt, '7d', now)).toBe(true);
    expect(matchesGeneratedVariantsDatePreset(older.createdAt, '7d', now)).toBe(false);
    expect(matchesGeneratedVariantsDatePreset(older.createdAt, '30d', now)).toBe(false);
    expect(matchesGeneratedVariantsDatePreset(recent.createdAt, '30d', now)).toBe(true);
  });

  it('sorts newest, oldest, and platform', () => {
    const linkedin = makeVariant({
      id: 'linkedin',
      platform: 'linkedin',
      createdAt: '2026-07-21T10:00:00.000Z',
    });
    const xOlder = makeVariant({
      id: 'x-old',
      platform: 'x',
      createdAt: '2026-07-20T10:00:00.000Z',
    });
    const xNewer = makeVariant({
      id: 'x-new',
      platform: 'x',
      createdAt: '2026-07-21T11:00:00.000Z',
    });
    const variants = [xOlder, linkedin, xNewer];

    expect(sortGeneratedVariants(variants, 'newest').map((v) => v.id)).toEqual([
      'x-new',
      'linkedin',
      'x-old',
    ]);
    expect(sortGeneratedVariants(variants, 'oldest').map((v) => v.id)).toEqual([
      'x-old',
      'linkedin',
      'x-new',
    ]);
    expect(sortGeneratedVariants(variants, 'platform').map((v) => v.id)).toEqual([
      'linkedin',
      'x-new',
      'x-old',
    ]);
  });

  it('combines filter and sort', () => {
    const variants = [
      makeVariant({ id: 'a', platform: 'linkedin', distributionStatus: 'DRAFT' }),
      makeVariant({ id: 'b', platform: 'x', distributionStatus: 'READY' }),
      makeVariant({ id: 'c', platform: 'medium', distributionStatus: 'DRAFT' }),
    ];

    const result = filterAndSortGeneratedVariants(
      variants,
      { ...EMPTY_GENERATED_VARIANTS_FILTERS, distributionStatuses: ['DRAFT'] },
      'platform',
      now
    );

    expect(result.map((v) => v.id)).toEqual(['a', 'c']);
  });

  it('detects active filters and sort', () => {
    expect(hasActiveGeneratedVariantsFilters(EMPTY_GENERATED_VARIANTS_FILTERS)).toBe(false);
    expect(
      hasActiveGeneratedVariantsFilters({
        ...EMPTY_GENERATED_VARIANTS_FILTERS,
        platforms: ['linkedin'],
      })
    ).toBe(true);
    expect(hasActiveGeneratedVariantsFilters(EMPTY_GENERATED_VARIANTS_FILTERS, 'oldest')).toBe(
      true
    );
    expect(
      hasActiveGeneratedVariantsFilters(
        EMPTY_GENERATED_VARIANTS_FILTERS,
        DEFAULT_GENERATED_VARIANTS_SORT
      )
    ).toBe(false);
  });

  it('detects secondary filters for progressive disclosure', () => {
    expect(hasSecondaryGeneratedVariantsFilters(EMPTY_GENERATED_VARIANTS_FILTERS)).toBe(false);
    expect(
      hasSecondaryGeneratedVariantsFilters({
        ...EMPTY_GENERATED_VARIANTS_FILTERS,
        datePreset: '7d',
      })
    ).toBe(true);
    expect(
      hasSecondaryGeneratedVariantsFilters({
        ...EMPTY_GENERATED_VARIANTS_FILTERS,
        distributionStatuses: ['READY'],
      })
    ).toBe(true);
    expect(
      hasSecondaryGeneratedVariantsFilters({
        ...EMPTY_GENERATED_VARIANTS_FILTERS,
        platforms: ['linkedin'],
      })
    ).toBe(false);
  });

  it('gates skeleton platforms by platform filter', () => {
    const filters = { ...EMPTY_GENERATED_VARIANTS_FILTERS, platforms: ['linkedin' as const] };
    expect(skeletonPlatformMatchesFilter('linkedin', filters)).toBe(true);
    expect(skeletonPlatformMatchesFilter('x', filters)).toBe(false);
    expect(skeletonPlatformMatchesFilter('x', EMPTY_GENERATED_VARIANTS_FILTERS)).toBe(true);
  });
});
