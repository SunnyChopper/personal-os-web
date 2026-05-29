import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HabitCard } from '@/components/molecules/HabitCard';
import type { Habit } from '@/types/growth-system';

const baseHabit: Habit = {
  id: 'habit-1',
  name: 'Morning meditation',
  description: null,
  area: 'Health',
  subCategory: null,
  habitType: 'Build',
  frequency: 'Daily',
  dailyTarget: null,
  weeklyTarget: null,
  intent: null,
  trigger: null,
  action: null,
  reward: null,
  frictionUp: null,
  frictionDown: null,
  notes: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('HabitCard points preview', () => {
  it('shows next completion point badge when not completed today', () => {
    render(
      <HabitCard
        habit={baseHabit}
        streak={6}
        todayCompleted={false}
        onClick={vi.fn()}
        onQuickLog={vi.fn()}
      />
    );

    expect(
      screen.getByRole('status', { name: /7 reward points, awarded when marked done/i })
    ).toBeInTheDocument();
  });

  it('hides point badge when already completed today', () => {
    render(<HabitCard habit={baseHabit} streak={6} todayCompleted={true} onClick={vi.fn()} />);

    expect(screen.queryByLabelText(/reward points/i)).not.toBeInTheDocument();
  });
});
