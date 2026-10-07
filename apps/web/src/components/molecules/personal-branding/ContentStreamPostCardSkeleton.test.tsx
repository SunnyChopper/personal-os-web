import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ContentStreamPostCardSkeleton,
  resolveContentStreamSkeletonCount,
} from '@/components/molecules/personal-branding/ContentStreamPostCardSkeleton';

describe('resolveContentStreamSkeletonCount', () => {
  it('prefers remainingDailyBudget when positive', () => {
    expect(resolveContentStreamSkeletonCount({ remainingDailyBudget: 3, postsPerDay: 5 })).toBe(3);
  });

  it('falls back to postsPerDay when remaining budget is zero', () => {
    expect(resolveContentStreamSkeletonCount({ remainingDailyBudget: 0, postsPerDay: 7 })).toBe(7);
  });

  it('defaults postsPerDay to 5 and clamps to 1–20', () => {
    expect(resolveContentStreamSkeletonCount(null)).toBe(5);
    expect(resolveContentStreamSkeletonCount({ remainingDailyBudget: 0, postsPerDay: 0 })).toBe(1);
    expect(resolveContentStreamSkeletonCount({ remainingDailyBudget: 25, postsPerDay: 5 })).toBe(
      20
    );
  });
});

describe('ContentStreamPostCardSkeleton', () => {
  it('renders inset panel status with chip, body, and action placeholders', () => {
    render(<ContentStreamPostCardSkeleton />);

    const root = screen.getByTestId('content-stream-post-card-skeleton');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-label', 'Generating short post draft');
    expect(root.querySelectorAll('[aria-hidden="true"]')).toHaveLength(7);
  });
});
