import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LeverageRoiRetrospectiveWidget } from '@/components/widgets/weekly/LeverageRoiRetrospectiveWidget';
import type { WeeklyReviewLeverageRoiResponse } from '@/types/growth-system';

const sampleData: WeeklyReviewLeverageRoiResponse = {
  days: 7,
  anchorDate: '2026-04-15',
  periodStart: '2026-04-09',
  periodEnd: '2026-04-15',
  timeZone: 'UTC',
  leverageThreshold: 55,
  quadrants: [
    { key: 'coreWins', label: 'High ROI - Core Wins', tasks: [] },
    { key: 'strategicInvestments', label: 'Strategic Investments', tasks: [] },
    { key: 'necessaryFriction', label: 'Necessary Friction', tasks: [] },
    {
      key: 'bikesheddingTrap',
      label: 'Bikeshedding Trap',
      tasks: [
        {
          taskId: 't1',
          title: 'Over-polish docs',
          completedDate: '2026-04-14',
          energyWeight: 3,
          energyWeightSource: 'tagged',
          energyLevel: 'Deep Work',
          plannerScore: 20,
          roi: 6.67,
          quadrant: 'bikesheddingTrap',
          reason: 'High energy spent on low-leverage work',
        },
      ],
    },
  ],
  summary: {
    headline: '1 completed task was high-energy, low-leverage',
    bikesheddingCount: 1,
    coreWinsCount: 0,
    strategicInvestmentsCount: 0,
    necessaryFrictionCount: 0,
  },
  dataQuality: { untaggedEnergyCount: 0, totalCompleted: 1 },
};

describe('LeverageRoiRetrospectiveWidget', () => {
  it('renders Leverage ROI Matrix heading and four quadrant labels', () => {
    render(<LeverageRoiRetrospectiveWidget data={sampleData} />);
    expect(screen.getByRole('heading', { name: /Leverage ROI Matrix/i })).toBeInTheDocument();
    expect(screen.getByText('Quick Wins')).toBeInTheDocument();
    expect(screen.getByText('High leverage / low energy')).toBeInTheDocument();
    expect(screen.getByText('Deep Focus Investments')).toBeInTheDocument();
    expect(screen.getByText('High leverage / high energy')).toBeInTheDocument();
    expect(screen.getByText('Routine Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Low leverage / low energy')).toBeInTheDocument();
    expect(screen.getByText(/The Bikeshedding Trap/i)).toBeInTheDocument();
    expect(screen.getByText('Low leverage / high energy')).toBeInTheDocument();
    expect(screen.getByText('Over-polish docs')).toBeInTheDocument();
  });

  it('shows bikeshedding trap warning copy', () => {
    render(<LeverageRoiRetrospectiveWidget data={sampleData} />);
    expect(
      screen.getByText(/High cognitive energy spent on low-leverage work/i)
    ).toBeInTheDocument();
  });

  it('shows ROI formula in tooltip when info button is activated', async () => {
    const user = userEvent.setup();
    render(<LeverageRoiRetrospectiveWidget data={sampleData} />);
    const infoBtn = screen.getByRole('button', { name: /How leverage ROI is calculated/i });
    await user.hover(infoBtn);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(/ROI = PlannerScore/i);
    expect(tooltip).toHaveTextContent(/EnergyWeight/i);
    expect(tooltip).toHaveTextContent(/Admin = 1/i);
    expect(tooltip).toHaveTextContent(/Deep Work = 3/i);
  });

  it('shows empty state when no completed tasks', () => {
    const empty: WeeklyReviewLeverageRoiResponse = {
      ...sampleData,
      dataQuality: { untaggedEnergyCount: 0, totalCompleted: 0 },
      quadrants: sampleData.quadrants.map((q) => ({ ...q, tasks: [] })),
    };
    render(<LeverageRoiRetrospectiveWidget data={empty} />);
    expect(screen.getByText(/Complete tasks with energy levels set/i)).toBeInTheDocument();
  });

  it('shows untagged energy callout', () => {
    const untagged: WeeklyReviewLeverageRoiResponse = {
      ...sampleData,
      dataQuality: { untaggedEnergyCount: 2, totalCompleted: 3 },
    };
    render(<LeverageRoiRetrospectiveWidget data={untagged} />);
    expect(screen.getByText(/lack an energy tag/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LeverageRoiRetrospectiveWidget isLoading />);
    expect(screen.getByText(/Loading leverage ROI matrix/i)).toBeInTheDocument();
  });
});
