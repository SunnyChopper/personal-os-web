import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskCalendarView } from '@/components/organisms/TaskCalendarView';
import type { Task } from '@/types/growth-system';

function makeTask(id: string, title: string, dueDate: string): Task {
  return {
    id,
    title,
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Backlog',
    size: null,
    dueDate,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [],
    goalIds: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('TaskCalendarView overflow popover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a popover with all tasks when +more is clicked', async () => {
    const onTaskClick = vi.fn();
    const dueDate = '2026-05-15';
    const tasks = [
      makeTask('1', 'Task One', dueDate),
      makeTask('2', 'Task Two', dueDate),
      makeTask('3', 'Task Three', dueDate),
      makeTask('4', 'Task Four', dueDate),
    ];

    render(<TaskCalendarView tasks={tasks} onTaskClick={onTaskClick} isLoading={false} />);

    const moreButton = screen.getByRole('button', { name: /Show 2 more tasks on/i });
    await userEvent.click(moreButton);

    const dialog = screen.getByRole('dialog', { name: /Tasks on/i });
    expect(within(dialog).getByText('Task One')).toBeInTheDocument();
    expect(within(dialog).getByText('Task Four')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Task Three' }));
    expect(onTaskClick).toHaveBeenCalledWith(expect.objectContaining({ id: '3' }));
  });

  it('closes the popover when the backdrop is clicked', async () => {
    const dueDate = '2026-05-20';
    const tasks = [
      makeTask('1', 'Alpha', dueDate),
      makeTask('2', 'Beta', dueDate),
      makeTask('3', 'Gamma', dueDate),
    ];

    render(<TaskCalendarView tasks={tasks} onTaskClick={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Show 1 more tasks on/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('calendar-overflow-backdrop'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
