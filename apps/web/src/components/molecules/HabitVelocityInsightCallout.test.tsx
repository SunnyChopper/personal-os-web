import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HabitVelocityInsightCallout } from '@/components/molecules/HabitVelocityInsightCallout';
import type { HabitVelocityCorrelation } from '@/types/growth-system';

const sample: HabitVelocityCorrelation = {
  habitId: 'h1',
  habitName: 'Lift',
  habitArea: 'Health',
  habitSubCategory: 'Exercise',
  consistencyThresholdPct: 80,
  trailingWeeks: 8,
  sampleWeeks: 8,
  highBucketWeeks: 3,
  lowBucketWeeks: 2,
  highBucketAvgStoryPoints: 18,
  lowBucketAvgStoryPoints: 10,
  upliftPct: 80,
};

describe('HabitVelocityInsightCallout', () => {
  it('renders nothing when correlations are undefined', () => {
    const { container } = render(<HabitVelocityInsightCallout correlations={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when correlations are empty', () => {
    const { container } = render(<HabitVelocityInsightCallout correlations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders primary kinetic momentum copy', () => {
    render(<HabitVelocityInsightCallout correlations={[sample]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Kinetic Momentum:/)).toBeInTheDocument();
    expect(screen.getByText(/Lift/)).toBeInTheDocument();
    expect(screen.getByText(/\+80%/)).toBeInTheDocument();
    expect(screen.getByText(/18 vs 10/)).toBeInTheDocument();
    expect(screen.getByText(/last 8 weeks/)).toBeInTheDocument();
  });

  it('renders secondary line for runner-up correlation', () => {
    const runner: HabitVelocityCorrelation = {
      ...sample,
      habitId: 'h2',
      habitName: 'Morning walk',
      upliftPct: 22.5,
    };
    render(<HabitVelocityInsightCallout correlations={[sample, runner]} />);
    expect(screen.getByText(/Also:/)).toBeInTheDocument();
    expect(screen.getByText(/Morning walk/)).toBeInTheDocument();
    expect(screen.getByText(/22\.5/)).toBeInTheDocument();
  });
});
