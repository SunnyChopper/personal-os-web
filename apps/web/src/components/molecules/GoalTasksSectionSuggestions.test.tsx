import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GoalTasksSection } from '@/components/molecules/GoalTasksSection';
import type { GoalLinkSuggestion } from '@/types/growth-system';

const suggestion: GoalLinkSuggestion = {
  entityId: 'task-1',
  entityType: 'task',
  title: 'MATH 207 Problem Set 3',
  reason: 'Matches your coursework goal',
  confidence: 0.91,
};

describe('GoalTasksSection empty-state suggestions', () => {
  it('renders attach control in empty state and calls handler', async () => {
    const onAttachSuggestion = vi.fn();
    render(
      <GoalTasksSection
        tasks={[]}
        showEmpty
        linkSuggestions={[suggestion]}
        onAttachSuggestion={onAttachSuggestion}
      />
    );

    expect(screen.getByText('No tasks linked')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /attach/i }));
    expect(onAttachSuggestion).toHaveBeenCalledWith(suggestion);
  });
});
