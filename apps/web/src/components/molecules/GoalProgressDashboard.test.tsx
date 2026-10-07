import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GoalProgressDashboard } from '@/components/molecules/GoalProgressDashboard';
import type { GoalProgressBreakdown } from '@/types/growth-system';

const progressFixture: GoalProgressBreakdown = {
  overall: 45.8,
  criteria: { completed: 0, total: 3, percentage: 0 },
  tasks: { completed: 4, total: 5, percentage: 80 },
  metrics: { atTarget: 0, total: 0, percentage: 0 },
  habits: { streakDays: 0, consistency: 0 },
  projects: {
    linkedCount: 2,
    percentage: 38.7,
    items: [
      {
        projectId: 'p1',
        title: 'UND - Intro to Linear Algebra',
        completionPercentage: 27.3,
        contributionWeight: 1,
        normalizedShare: 0.5,
      },
      {
        projectId: 'p2',
        title: 'GRE Exam - Quant',
        completionPercentage: 50,
        contributionWeight: 1,
        normalizedShare: 0.5,
      },
    ],
  },
  weights: {
    criteriaWeight: 35,
    tasksWeight: 50,
    metricsWeight: 0,
    habitsWeight: 0,
    projectsWeight: 15,
    manualOverride: null,
  },
};

describe('GoalProgressDashboard', () => {
  it('hides zero-weight Metrics and Habits tiles', () => {
    render(<GoalProgressDashboard progress={progressFixture} />);
    expect(screen.getAllByText('Criteria').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tasks').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
    expect(screen.queryByText('Metrics')).toBeNull();
    expect(screen.queryByText('Habits')).toBeNull();
  });

  it('shows weight labels on visible tiles', () => {
    render(<GoalProgressDashboard progress={progressFixture} />);
    expect(screen.getByText('Weight 35%')).toBeInTheDocument();
    expect(screen.getByText('Weight 50%')).toBeInTheDocument();
    expect(screen.getByText('Weight 15%')).toBeInTheDocument();
  });

  it('renders calculation panel with formula and item titles', () => {
    render(
      <GoalProgressDashboard
        progress={progressFixture}
        sourceItems={{
          criteria: [{ id: 'c1', description: 'GRE Quant score', isCompleted: false }],
          tasks: [{ id: 't1', title: 'Complete practice test', status: 'Done' }],
        }}
      />
    );
    expect(screen.getByText('How this is calculated')).toBeInTheDocument();
    expect(screen.getByText(/0% × 35 \+ 80% × 50 \+ 38\.7% × 15/)).toBeInTheDocument();
    expect(screen.getByText('GRE Quant score')).toBeInTheDocument();
    expect(screen.getByText('Complete practice test')).toBeInTheDocument();
    expect(screen.getByText('UND - Intro to Linear Algebra')).toBeInTheDocument();
    expect(screen.getByText('GRE Exam - Quant')).toBeInTheDocument();
  });

  it('shows manual override notice when set', () => {
    render(
      <GoalProgressDashboard
        progress={{
          ...progressFixture,
          overall: 52,
          weights: { ...progressFixture.weights!, manualOverride: 52 },
        }}
      />
    );
    expect(screen.getByText(/Manual override: 52%/)).toBeInTheDocument();
  });
});
