import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ContentIdeaCardSkeleton,
  ContentIdeaGridSkeleton,
} from '@/components/molecules/personal-branding/ContentIdeaCardSkeleton';

describe('ContentIdeaCardSkeleton', () => {
  it('renders card status with title, summary, tag, and action placeholders', () => {
    render(<ContentIdeaCardSkeleton />);

    const root = screen.getByTestId('content-idea-card-skeleton');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-label', 'Loading content idea');
    expect(root.className).toMatch(/rounded-2xl/);
    expect(root.className).toMatch(/border/);
    expect(root.className).toMatch(/p-4/);
    expect(root.querySelectorAll('[aria-hidden="true"]')).toHaveLength(10);
  });
});

describe('ContentIdeaGridSkeleton', () => {
  it('renders default skeleton count in a responsive grid', () => {
    render(<ContentIdeaGridSkeleton />);

    const root = screen.getByTestId('content-idea-grid-skeleton');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-label', 'Loading content ideas');
    expect(root.className).toMatch(/sm:grid-cols-2/);
    expect(root.className).toMatch(/xl:grid-cols-3/);
    expect(screen.getAllByTestId('content-idea-card-skeleton')).toHaveLength(6);
  });

  it('respects custom count', () => {
    render(<ContentIdeaGridSkeleton count={3} />);
    expect(screen.getAllByTestId('content-idea-card-skeleton')).toHaveLength(3);
  });
});
