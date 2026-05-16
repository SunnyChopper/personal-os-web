import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';

import type { Habit, HabitLog } from '@/types/growth-system';

import { calculateConsistencyScoreBreakdown, getAllStreaks } from '../habit-analytics';

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-test',
    name: 'Hydrate',
    description: null,
    area: 'Health',
    subCategory: null,
    habitType: 'Build',
    frequency: 'Daily',
    dailyTarget: 2,
    weeklyTarget: null,
    intent: null,
    trigger: null,
    action: null,
    reward: null,
    frictionUp: null,
    frictionDown: null,
    notes: null,
    goalIds: undefined,
    userId: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function buildLog(completedAt: string, amount: number | null = 1): HabitLog {
  return {
    id: `log-${completedAt}`,
    habitId: 'habit-test',
    completedAt,
    amount,
    notes: null,
    userId: 'user',
    createdAt: completedAt,
  };
}

describe('calculateConsistencyScoreBreakdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns zeroed breakdown when logs are empty', () => {
    const b = calculateConsistencyScoreBreakdown([], buildHabit());
    expect(b).toMatchObject({
      total: 0,
      baseScore: 0,
      recencyBonus: 0,
      streakBonus: 0,
      completionRatePercent: 0,
      recentLogsCount: 0,
      recentWeight: 0,
      currentStreak: 0,
    });
  });

  it('counts recentLogsCount only within the trailing 30 days', () => {
    const b = calculateConsistencyScoreBreakdown(
      [
        buildLog('2026-06-14T12:00:00.000Z'),
        buildLog('2026-06-10T12:00:00.000Z'),
        buildLog('2026-03-01T12:00:00.000Z'),
      ],
      buildHabit()
    );
    expect(b.recentLogsCount).toBe(2);
  });

  it('computes recentWeight as min(1, recentLogsCount / (30 * 0.5)) before × 20', () => {
    const logs: HabitLog[] = [];
    for (let d = 0; d < 10; d += 1) {
      logs.push(buildLog(`2026-06-${String(5 + d).padStart(2, '0')}T12:00:00.000Z`));
    }
    const b = calculateConsistencyScoreBreakdown(logs, buildHabit());
    expect(b.recentLogsCount).toBe(10);
    const expectedWeight = Math.min(1, 10 / 15);
    expect(b.recentWeight).toBeCloseTo(expectedWeight, 10);
    expect(b.recencyBonus).toBeCloseTo(expectedWeight * 20, 10);
  });
});

describe('getAllStreaks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores streak bounds oldest → newest for Streak History display', () => {
    const logs = [
      buildLog('2026-06-10T15:00:00.000Z'),
      buildLog('2026-06-11T15:00:00.000Z'),
      buildLog('2026-06-13T15:00:00.000Z'),
      buildLog('2026-06-14T15:00:00.000Z'),
      buildLog('2026-06-15T15:00:00.000Z'),
    ];

    const { allStreaks } = getAllStreaks(logs);

    expect(allStreaks).toContainEqual({
      startDate: '2026-06-13',
      endDate: '2026-06-15',
      length: 3,
      isActive: true,
    });
    expect(allStreaks).toContainEqual({
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      length: 2,
      isActive: false,
    });

    expect(new Date(allStreaks[0].startDate).getTime()).toBeGreaterThanOrEqual(
      new Date(allStreaks[1]?.startDate ?? allStreaks[0].startDate).getTime()
    );
  });

  it('does not mark a streak as active when today has no completion', () => {
    const logs = [buildLog('2026-06-13T15:00:00.000Z'), buildLog('2026-06-14T15:00:00.000Z')];

    const { allStreaks, current } = getAllStreaks(logs);
    expect(current).toBe(0);

    expect(allStreaks).toContainEqual({
      startDate: '2026-06-13',
      endDate: '2026-06-14',
      length: 2,
      isActive: false,
    });
  });
});
