import { describe, expect, it } from 'vitest';
import {
  HABIT_BASE_POINTS,
  habitStreakMultiplier,
  previewNextCompletionPoints,
  previewNextMilestones,
} from '@/lib/habit-points';

describe('habit-points', () => {
  it('uses base multiplier for short streaks', () => {
    expect(habitStreakMultiplier(3)).toBe(1);
    expect(previewNextCompletionPoints(2)).toBe(HABIT_BASE_POINTS);
  });

  it('applies tier multipliers for longer streaks', () => {
    expect(previewNextCompletionPoints(6)).toBe(7);
    expect(previewNextCompletionPoints(29)).toBe(8);
    expect(previewNextCompletionPoints(99)).toBe(10);
  });

  it('previews milestones on the next completion', () => {
    expect(previewNextMilestones(6)).toEqual([{ days: 7, bonus: 20 }]);
    expect(previewNextMilestones(29)).toEqual([{ days: 30, bonus: 100 }]);
  });
});
