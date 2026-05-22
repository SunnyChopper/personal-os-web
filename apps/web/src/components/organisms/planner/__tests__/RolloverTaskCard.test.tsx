import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RolloverTaskCard } from '../RolloverTaskCard';
import type { PlannerRolloverTask } from '@/types/planner';

const sample: PlannerRolloverTask = {
  rolloverId: '2026-05-21#task-1',
  taskId: 'task-1',
  title: 'Missed deploy',
  priority: 'P1',
  storyPoints: 5,
  sourceDate: '2026-05-20',
  reason: 'missedScheduledDate',
  badge: 'Rolled Over',
};

describe('RolloverTaskCard', () => {
  it('renders badge and actions', () => {
    const onAction = vi.fn();
    render(<RolloverTaskCard task={sample} onAction={onAction} />);
    expect(screen.getByText('Rolled Over')).toBeInTheDocument();
    expect(screen.getByText('Missed deploy')).toBeInTheDocument();
    expect(screen.getByText('5 SP')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Keep today/i }));
    expect(onAction).toHaveBeenCalledWith('2026-05-21#task-1', 'keep');
  });

  it('disables buttons when disabled', () => {
    render(<RolloverTaskCard task={sample} disabled onAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Keep today/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Backlog/i })).toBeDisabled();
  });

  it('shows velocity drag badge when rolloverCount >= 3', () => {
    render(
      <RolloverTaskCard
        task={{ ...sample, rolloverCount: 3, velocityDragDetected: true }}
        onAction={vi.fn()}
      />
    );
    expect(screen.getByTestId('velocity-drag-badge')).toBeInTheDocument();
  });

  it('shows loading label for pending action', () => {
    render(<RolloverTaskCard task={sample} pendingAction="backlog" onAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Moving…/i })).toBeDisabled();
  });
});
