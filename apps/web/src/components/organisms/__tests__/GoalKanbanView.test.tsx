import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalKanbanView } from '../GoalKanbanView';
import type { Goal } from '@/types/growth-system';

const baseGoal: Goal = {
  id: 'g1',
  title: 'Active goal',
  description: null,
  area: 'Health',
  subCategory: null,
  timeHorizon: 'Quarterly',
  priority: 'P3',
  status: 'Active',
  health: 'onTrack',
  startDate: null,
  targetDate: null,
  completedDate: null,
  successCriteria: [],
  progressConfig: null,
  parentGoalId: null,
  lastActivityAt: null,
  notes: null,
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

describe('GoalKanbanView', () => {
  it('renders four lifecycle columns and health badge on Active goals', () => {
    render(
      <GoalKanbanView
        goals={[baseGoal]}
        goalsProgress={new Map()}
        goalsLinkedCounts={new Map()}
        goalsHealth={new Map()}
        onGoalClick={vi.fn()}
      />
    );

    expect(screen.getByRole('region', { name: 'Planning goals column' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active goals column' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Achieved goals column' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Abandoned goals column' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'On Track goals column' })).not.toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });
});
