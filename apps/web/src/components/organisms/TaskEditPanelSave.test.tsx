import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitySummary, Task } from '@/types/growth-system';
import { TaskEditPanel } from '@/components/organisms/TaskEditPanel';

const { showToast } = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast,
    ToastContainer: () => null,
  }),
}));

vi.mock('@/lib/llm', () => ({
  llmConfig: { isConfigured: () => false },
}));

function makeTask(): Task {
  return {
    id: 'task-1',
    title: 'My task',
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P2',
    status: 'Backlog',
    size: 3,
    dueDate: null,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: ['p1'],
    goalIds: ['g1'],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

const linkedProjects: EntitySummary[] = [
  { id: 'p1', title: 'Capital OS', type: 'project', area: 'Wealth', status: 'Active' },
  { id: 'p2', title: 'Side project', type: 'project', area: 'Operations', status: 'Active' },
];

const linkedGoals: EntitySummary[] = [
  { id: 'g1', title: 'Goal one', type: 'goal', area: 'Wealth', status: 'Active' },
];

describe('TaskEditPanel save', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  beforeEach(() => {
    onSave.mockReset();
    onSave.mockResolvedValue(undefined);
    onClose.mockReset();
    showToast.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('includes selected projectIds and goalIds in the task PATCH payload', async () => {
    const user = userEvent.setup();

    render(
      <TaskEditPanel
        task={makeTask()}
        isOpen
        onClose={onClose}
        onSave={onSave}
        dependencies={[]}
        blockedBy={[]}
        linkedProjects={linkedProjects.slice(0, 1)}
        linkedGoals={linkedGoals}
        availableTasks={[]}
        availableProjects={linkedProjects}
        availableGoals={linkedGoals}
        onDependencyAdd={vi.fn()}
        onDependencyRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({
        projectIds: ['p1'],
        goalIds: ['g1'],
      })
    );
  });
});
