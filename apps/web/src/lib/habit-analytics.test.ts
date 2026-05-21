import { describe, it, expect } from 'vitest';
import type { Habit, HabitLog } from '@/types/growth-system';
import {
  getWeekRange,
  getCompletionRateData,
  getWeeklyData,
  getAllStreaks,
} from '@/utils/habit-analytics';

const baseHabit: Habit = {
  id: 'h1',
  name: 'Test',
  description: null,
  area: 'Health',
  subCategory: null,
  habitType: 'Build',
  frequency: 'Daily',
  dailyTarget: 1,
  weeklyTarget: null,
  intent: null,
  trigger: null,
  action: null,
  reward: null,
  frictionUp: null,
  frictionDown: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  userId: 'u1',
};

function logOn(dateStr: string): HabitLog {
  return {
    id: `log-${dateStr}`,
    habitId: 'h1',
    completedAt: `${dateStr}T12:00:00.000Z`,
    amount: 1,
    notes: null,
    userId: 'u1',
    createdAt: `${dateStr}T12:00:00.000Z`,
  };
}

describe('getWeekRange', () => {
  it('returns current Mon–Sun when offset is 0 on a Wednesday', () => {
    const wed = new Date(2026, 4, 20);
    const { monday, sunday } = getWeekRange(wed, 0);
    expect(monday.getDay()).toBe(1);
    expect(sunday.getDay()).toBe(0);
    expect(monday.getDate()).toBe(18);
    expect(sunday.getDate()).toBe(24);
  });

  it('returns prior week when offset is 1 on Sunday', () => {
    const sun = new Date(2026, 4, 24);
    const { monday, sunday } = getWeekRange(sun, 1);
    expect(monday.getDate()).toBe(11);
    expect(sunday.getDate()).toBe(17);
  });
});

describe('getCompletionRateData', () => {
  it('returns daily buckets newest-first', () => {
    const data = getCompletionRateData([], baseHabit, 'day', 3);
    expect(data.length).toBe(3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLabel = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    expect(data[0].period).toBe(todayLabel);
  });
});

describe('getWeeklyData', () => {
  it('lists current week first', () => {
    const weeks = getWeeklyData([], baseHabit, 2);
    expect(weeks.length).toBe(2);
    const { monday: currentMonday } = getWeekRange(new Date(), 0);
    expect(weeks[0].startDate).toBe(currentMonday.toISOString());
  });
});

describe('getAllStreaks', () => {
  it('stores startDate as older and endDate as newer within a streak', () => {
    const logs = [logOn('2026-05-19'), logOn('2026-05-20'), logOn('2026-05-21')];
    const streaks = getAllStreaks(logs);
    expect(streaks.allStreaks.length).toBeGreaterThan(0);
    const first = streaks.allStreaks[0];
    expect(new Date(first.startDate).getTime()).toBeLessThanOrEqual(
      new Date(first.endDate ?? first.startDate).getTime()
    );
  });
});
