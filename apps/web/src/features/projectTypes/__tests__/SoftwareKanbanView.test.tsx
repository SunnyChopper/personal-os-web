import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoftwareKanbanView } from '@/features/projectTypes/components/SoftwareKanbanView';
import type { Project, Task } from '@/types/growth-system';

function makeProject(): Project {
  return {
    id: 'p1',
    name: 'Test',
    description: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Active',
    impact: 3,
    startDate: null,
    targetEndDate: null,
    actualEndDate: null,
    notes: null,
    projectType: 'SoftwareDevelopment',
    userId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeTask(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  const base: Task = {
    id: partial.id,
    title: partial.title,
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Backlog',
    size: null,
    dueDate: null,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: false,
    projectIds: ['p1'],
    goalIds: [],
    userId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  return { ...base, ...partial };
}

describe('SoftwareKanbanView', () => {
  it('renders a task under its status column with task kind chip', () => {
    const onClick = vi.fn();
    render(
      <SoftwareKanbanView
        project={makeProject()}
        tasks={[
          makeTask({
            id: 't1',
            title: 'Fix auth',
            status: 'Backlog',
            taskKind: 'Bug',
          }),
        ]}
        onTaskClick={onClick}
      />
    );
    expect(screen.getByText('Fix auth')).toBeTruthy();
    expect(screen.getByText('Bug')).toBeTruthy();
    expect(screen.getByText(/Backlog/i)).toBeTruthy();
  });
});
