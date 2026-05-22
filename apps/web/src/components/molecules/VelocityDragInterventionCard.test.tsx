import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  VelocityDragBadge,
  VelocityDragInterventionCard,
} from '@/components/molecules/VelocityDragInterventionCard';
import type { Task } from '@/types/growth-system';

const draggedTask: Task = {
  id: 't1',
  title: 'Big task',
  description: null,
  extendedDescription: null,
  area: 'Operations',
  subCategory: null,
  priority: 'P2',
  status: 'In Progress',
  size: 8,
  dueDate: null,
  scheduledDate: null,
  completedDate: null,
  notes: null,
  isRecurring: false,
  recurrenceRule: null,
  pointValue: null,
  pointsAwarded: null,
  projectIds: [],
  goalIds: [],
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  rolloverCount: 3,
};

describe('VelocityDragInterventionCard', () => {
  it('renders intervention copy and split action when drag detected', () => {
    const onSplit = vi.fn();
    render(<VelocityDragInterventionCard task={draggedTask} onSplit={onSplit} />);
    expect(screen.getByTestId('velocity-drag-intervention')).toBeInTheDocument();
    expect(screen.getByText(/Velocity Drag Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/too bloated or ill-defined/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Split into 1-point subtasks/i }));
    expect(onSplit).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when rolloverCount below threshold', () => {
    const { container } = render(
      <VelocityDragInterventionCard task={{ ...draggedTask, rolloverCount: 2 }} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('VelocityDragBadge', () => {
  it('shows badge at threshold', () => {
    render(<VelocityDragBadge rolloverCount={3} />);
    expect(screen.getByTestId('velocity-drag-badge')).toBeInTheDocument();
  });
});
