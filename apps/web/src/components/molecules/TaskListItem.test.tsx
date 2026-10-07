import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskListItem, TASK_LIST_ITEM_DENSE_GRID } from '@/components/molecules/TaskListItem';
import type { Task } from '@/types/growth-system';

const baseTask: Task = {
  id: 'task-1',
  title: 'Ship list density polish',
  description: null,
  extendedDescription: null,
  area: 'Operations',
  subCategory: null,
  priority: 'P2',
  status: 'In Progress',
  size: 3,
  dueDate: '2026-07-30',
  scheduledDate: null,
  completedDate: null,
  notes: null,
  isRecurring: false,
  recurrenceRule: null,
  pointValue: 5,
  pointsAwarded: false,
  projectIds: [],
  goalIds: [],
  userId: 'user-1',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('TaskListItem', () => {
  it('renders title, area, and action buttons', () => {
    render(
      <TaskListItem task={baseTask} onEdit={vi.fn()} onDelete={vi.fn()} onComplete={vi.fn()} />
    );

    expect(screen.getAllByText('Ship list density polish').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Mark done/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Edit task/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Delete task/i }).length).toBeGreaterThan(0);
  });

  it('calls onComplete when Done is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <TaskListItem task={baseTask} onEdit={vi.fn()} onDelete={vi.fn()} onComplete={onComplete} />
    );

    await user.click(screen.getAllByRole('button', { name: /Mark done/i })[0]!);

    expect(onComplete).toHaveBeenCalledWith(baseTask);
  });

  it('hides Done when task is already complete', () => {
    render(
      <TaskListItem
        task={{ ...baseTask, status: 'Done' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Mark done/i })).not.toBeInTheDocument();
  });

  it('applies hover-reveal classes to dense-layout actions when actionsVisibility is hover', () => {
    render(
      <TaskListItem
        task={baseTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onComplete={vi.fn()}
        actionsVisibility="hover"
      />
    );

    const actionGroups = screen.getAllByRole('group', { name: 'Task actions' });
    const denseGroup = actionGroups.find((el) =>
      el.className.includes('@[36rem]:group-hover:opacity-100')
    );
    expect(denseGroup).toBeTruthy();
    expect(denseGroup?.className).toContain('@[36rem]:opacity-0');
  });

  it('uses container-query dense grid with a minimum title track width', () => {
    expect(TASK_LIST_ITEM_DENSE_GRID).toContain('@[36rem]:grid');
    expect(TASK_LIST_ITEM_DENSE_GRID).toContain('minmax(8rem,1fr)');

    render(
      <TaskListItem task={baseTask} onEdit={vi.fn()} onDelete={vi.fn()} onComplete={vi.fn()} />
    );

    const denseLayout = screen.getByTestId('task-list-item-dense-layout');
    expect(denseLayout.className).toContain('@[36rem]:grid');
    expect(denseLayout.className).toContain('minmax(8rem,1fr)');
    expect(screen.getByTestId('task-list-item-stacked-layout').className).toContain(
      '@[36rem]:hidden'
    );
  });

  it('gives the title flex-1 so chips cannot collapse it in dense layout', () => {
    render(
      <TaskListItem
        task={{ ...baseTask, subtaskCount: 4, completedSubtaskCount: 2 }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const titles = screen.getAllByText('Ship list density polish');
    expect(titles.some((el) => el.classList.contains('flex-1'))).toBe(true);
  });

  it('shows full-opacity dense-layout actions when actionsVisibility is always', () => {
    render(
      <TaskListItem
        task={baseTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onComplete={vi.fn()}
        actionsVisibility="always"
      />
    );

    const actionGroups = screen.getAllByRole('group', { name: 'Task actions' });
    const denseGroup = actionGroups.find((el) => el.className.includes('@[36rem]:opacity-0'));
    expect(denseGroup).toBeUndefined();
  });

  it('styles completed task title with line-through', () => {
    render(
      <TaskListItem task={{ ...baseTask, status: 'Done' }} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    const titles = screen.getAllByText('Ship list density polish');
    expect(titles.some((el) => el.classList.contains('line-through'))).toBe(true);
  });

  it('shows subtask progress chip when subtaskCount is set', () => {
    render(
      <TaskListItem
        task={{ ...baseTask, subtaskCount: 4, completedSubtaskCount: 2 }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getAllByText('2/4').length).toBeGreaterThan(0);
  });

  it('opens details on Enter when onClick is provided', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskListItem task={baseTask} onEdit={vi.fn()} onDelete={vi.fn()} onClick={onClick} />);

    const row = screen.getByRole('button', { name: /View task details/i });
    row.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledWith(baseTask);
  });

  it('renders overdue due dates in red when task is not complete', () => {
    render(
      <TaskListItem
        task={{ ...baseTask, status: 'In Progress', dueDate: '2020-01-01' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const dueDates = screen.getAllByText('Jan 1, 2020');
    expect(dueDates.some((el) => el.classList.contains('text-red-600'))).toBe(true);
  });

  it('renders overdue due dates in muted neutral color when task is complete', () => {
    render(
      <TaskListItem
        task={{ ...baseTask, status: 'Done', dueDate: '2020-01-01' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const dueDates = screen.getAllByText('Jan 1, 2020');
    expect(dueDates.some((el) => el.classList.contains('text-red-600'))).toBe(false);
    expect(dueDates.some((el) => el.classList.contains('text-gray-500'))).toBe(true);
  });

  it('hides points badges and renders kebab menu in presentation="project"', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onUnlink = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskListItem
        task={{ ...baseTask, pointValue: 50, size: 5 }}
        presentation="project"
        onView={onView}
        onEdit={onEdit}
        onUnlink={onUnlink}
        onDelete={onDelete}
      />
    );

    // Points badges should not appear
    expect(screen.queryByText(/50/)).not.toBeInTheDocument();
    expect(screen.queryByText('5 pts')).not.toBeInTheDocument();

    // Standard pencil icon button should not appear
    expect(screen.queryByRole('button', { name: /Edit task:/i })).not.toBeInTheDocument();

    // Kebab button should appear
    const kebab = screen.getByRole('button', { name: `Actions for ${baseTask.title}` });
    expect(kebab).toBeInTheDocument();

    await user.click(kebab);

    const viewItem = screen.getByRole('menuitem', { name: 'View details' });
    const editItem = screen.getByRole('menuitem', { name: 'Edit task' });
    const unlinkItem = screen.getByRole('menuitem', { name: 'Unlink from project' });
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete task' });

    expect(viewItem).toBeInTheDocument();
    expect(editItem).toBeInTheDocument();
    expect(unlinkItem).toBeInTheDocument();
    expect(deleteItem).toBeInTheDocument();

    await user.click(viewItem);
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: baseTask.id }));
  });

  it('wraps title and clamps description with Show More/Less in presentation="projectCompletedModal"', async () => {
    const user = userEvent.setup();
    const longDesc =
      'This is a comprehensive description of a completed task that exceeds one hundred and twenty-eight characters in length to test the truncation toggle.';

    render(
      <TaskListItem
        task={{ ...baseTask, status: 'Done', description: longDesc }}
        presentation="projectCompletedModal"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const titleEl = screen.getByRole('heading', { level: 3, name: baseTask.title });
    expect(titleEl.className).toContain('break-words');
    expect(titleEl.className).not.toContain('truncate');

    // Clamped preview and "Show More" button should appear
    const showMoreBtn = screen.getByRole('button', { name: 'Show More' });
    expect(showMoreBtn).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${longDesc.slice(0, 128)}…`))).toBeInTheDocument();

    // Toggle to "Show Less"
    await user.click(showMoreBtn);
    const showLessBtn = screen.getByRole('button', { name: 'Show Less' });
    expect(showLessBtn).toBeInTheDocument();
    expect(screen.getByText(longDesc)).toBeInTheDocument();

    // Toggle back to "Show More"
    await user.click(showLessBtn);
    expect(screen.getByRole('button', { name: 'Show More' })).toBeInTheDocument();
  });
});
