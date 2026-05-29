import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GoalLinkSuggestionsPanel } from '@/components/molecules/GoalLinkSuggestionsPanel';
import type { GoalLinkSuggestion } from '@/types/growth-system';

const suggestions: GoalLinkSuggestion[] = [
  {
    entityId: 'task-1',
    entityType: 'task',
    title: 'MATH 207 Problem Set 3',
    reason: 'Matches your coursework goal',
    confidence: 0.91,
  },
];

describe('GoalLinkSuggestionsPanel', () => {
  it('renders suggestion rows and fires onAttach', async () => {
    const onAttach = vi.fn();
    render(
      <GoalLinkSuggestionsPanel entityType="task" suggestions={suggestions} onAttach={onAttach} />
    );

    expect(screen.getByText('Suggested tasks to link')).toBeInTheDocument();
    expect(screen.getByText('MATH 207 Problem Set 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /attach/i }));
    expect(onAttach).toHaveBeenCalledWith(suggestions[0]);
  });

  it('renders nothing when empty and not loading', () => {
    const { container } = render(
      <GoalLinkSuggestionsPanel entityType="metric" suggestions={[]} onAttach={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows skeleton placeholders while loading', () => {
    const { container } = render(
      <GoalLinkSuggestionsPanel entityType="habit" suggestions={[]} isLoading onAttach={vi.fn()} />
    );
    expect(screen.getByText('Suggested habits to link')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
