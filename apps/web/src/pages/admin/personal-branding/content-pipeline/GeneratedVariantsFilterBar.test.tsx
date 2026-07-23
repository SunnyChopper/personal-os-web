import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GeneratedVariantsFilterBar from './GeneratedVariantsFilterBar';
import {
  DEFAULT_GENERATED_VARIANTS_SORT,
  EMPTY_GENERATED_VARIANTS_FILTERS,
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

describe('GeneratedVariantsFilterBar', () => {
  const variants = [
    makeVariant({ id: 'a', platform: 'linkedin', distributionStatus: 'DRAFT' }),
    makeVariant({ id: 'b', platform: 'x', distributionStatus: 'READY' }),
  ];

  it('renders primary platform and sort chips', () => {
    render(
      <GeneratedVariantsFilterBar
        variants={variants}
        filters={EMPTY_GENERATED_VARIANTS_FILTERS}
        sort={DEFAULT_GENERATED_VARIANTS_SORT}
        onFiltersChange={vi.fn()}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Newest' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument();
  });

  it('reveals secondary filters when More filters is clicked', async () => {
    const user = userEvent.setup();

    render(
      <GeneratedVariantsFilterBar
        variants={variants}
        filters={EMPTY_GENERATED_VARIANTS_FILTERS}
        sort={DEFAULT_GENERATED_VARIANTS_SORT}
        onFiltersChange={vi.fn()}
        onSortChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /More filters/i }));

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready \(1\)/ })).toBeInTheDocument();
  });

  it('shows N of M count when a platform filter is active', () => {
    render(
      <GeneratedVariantsFilterBar
        variants={variants}
        filters={{ ...EMPTY_GENERATED_VARIANTS_FILTERS, platforms: ['linkedin'] }}
        sort={DEFAULT_GENERATED_VARIANTS_SORT}
        onFiltersChange={vi.fn()}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('1 of 2 variants')).toBeInTheDocument();
  });

  it('clears filters and sort when Clear is clicked', () => {
    const onFiltersChange = vi.fn();
    const onSortChange = vi.fn();

    render(
      <GeneratedVariantsFilterBar
        variants={variants}
        filters={{ ...EMPTY_GENERATED_VARIANTS_FILTERS, platforms: ['linkedin'] }}
        sort="oldest"
        onFiltersChange={onFiltersChange}
        onSortChange={onSortChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));

    expect(onFiltersChange).toHaveBeenCalledWith(EMPTY_GENERATED_VARIANTS_FILTERS);
    expect(onSortChange).toHaveBeenCalledWith(DEFAULT_GENERATED_VARIANTS_SORT);
  });

  it('auto-expands secondary filters when a secondary filter is active', () => {
    render(
      <GeneratedVariantsFilterBar
        variants={variants}
        filters={{ ...EMPTY_GENERATED_VARIANTS_FILTERS, datePreset: 'today' }}
        sort={DEFAULT_GENERATED_VARIANTS_SORT}
        onFiltersChange={vi.fn()}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fewer filters/i })).toBeInTheDocument();
  });
});
