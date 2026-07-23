import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TrendStreamFilterBar from './TrendStreamFilterBar';
import type { TrendStreamFilterState } from './TrendStreamFilterBar';

function makeTags(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `tag-${String(index + 1).padStart(2, '0')}`);
}

const defaultFilters: TrendStreamFilterState = {
  page: 1,
  pageSize: 50,
  includeFiltered: false,
};

function renderFilterBar(
  overrides: Partial<{
    filters: TrendStreamFilterState;
    availableTags: string[];
    onChange: (next: TrendStreamFilterState) => void;
  }> = {}
) {
  const onChange = overrides.onChange ?? vi.fn();
  render(
    <TrendStreamFilterBar
      filters={overrides.filters ?? defaultFilters}
      onChange={onChange}
      sources={[]}
      savedViews={[]}
      availableTags={overrides.availableTags ?? []}
      onSaveView={vi.fn()}
      onDeleteView={vi.fn()}
    />
  );
  return { onChange };
}

describe('TrendStreamFilterBar topic tags', () => {
  it('renders up to 12 tags without a show-more control', () => {
    renderFilterBar({ availableTags: makeTags(12) });

    expect(screen.getByRole('button', { name: 'tag-01' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tag-12' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show \d+ more/i })).not.toBeInTheDocument();
  });

  it('collapses long tag lists and expands on show more', async () => {
    const user = userEvent.setup();
    renderFilterBar({ availableTags: makeTags(15) });

    expect(screen.getByRole('button', { name: 'tag-01' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tag-12' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'tag-13' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 3 more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 3 more' }));

    expect(screen.getByRole('button', { name: 'tag-15' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer' })).toBeInTheDocument();
  });

  it('filters tags by search query and suppresses show-more', async () => {
    const user = userEvent.setup();
    renderFilterBar({ availableTags: makeTags(15) });

    await user.type(screen.getByLabelText('Filter topic tags'), 'tag-14');

    expect(screen.getByRole('button', { name: 'tag-14' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'tag-01' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show \d+ more/i })).not.toBeInTheDocument();
  });

  it('shows a message when the tag search has no matches', async () => {
    const user = userEvent.setup();
    renderFilterBar({ availableTags: makeTags(5) });

    await user.type(screen.getByLabelText('Filter topic tags'), 'no-such-tag');

    expect(screen.getByText('No tags match')).toBeInTheDocument();
  });

  it('keeps selected tags visible when collapsed', () => {
    renderFilterBar({
      availableTags: makeTags(15),
      filters: { ...defaultFilters, tags: ['tag-15'] },
    });

    expect(screen.getByRole('button', { name: 'tag-15' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 3 more' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'tag-14' })).not.toBeInTheDocument();
  });

  it('toggles a tag filter and clears viewId', () => {
    const { onChange } = renderFilterBar({
      availableTags: ['agent-workflows'],
      filters: { ...defaultFilters, viewId: 'view-1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'agent-workflows' }));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      viewId: undefined,
      tags: ['agent-workflows'],
    });
  });
});
