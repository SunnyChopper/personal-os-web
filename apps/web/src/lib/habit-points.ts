/**
 * Client mirror of personal-os-backend/src/services/habit_points.py
 * Keep constants in sync when changing award rules.
 */

export const HABIT_BASE_POINTS = 5;

export const HABIT_STREAK_TIERS: ReadonlyArray<{ minDays: number; multiplier: number }> = [
  { minDays: 7, multiplier: 1.4 },
  { minDays: 30, multiplier: 1.6 },
  { minDays: 100, multiplier: 2.0 },
];

export const HABIT_MILESTONES: ReadonlyArray<{ days: number; bonus: number }> = [
  { days: 7, bonus: 20 },
  { days: 30, bonus: 100 },
  { days: 100, bonus: 500 },
];

export function habitStreakMultiplier(streakAfter: number): number {
  if (streakAfter <= 0) return 1;
  let multiplier = 1;
  for (const tier of HABIT_STREAK_TIERS) {
    if (streakAfter >= tier.minDays) multiplier = tier.multiplier;
  }
  return multiplier;
}

/** Points for the next completion if current streak is `currentStreak` (next = current + 1). */
export function previewNextCompletionPoints(currentStreak: number): number {
  const streakAfter = currentStreak + 1;
  if (streakAfter <= 0) return 0;
  return Math.max(1, Math.round(HABIT_BASE_POINTS * habitStreakMultiplier(streakAfter)));
}

/** Milestone bonuses that would fire on the next completion. */
export function previewNextMilestones(
  currentStreak: number
): Array<{ days: number; bonus: number }> {
  const streakAfter = currentStreak + 1;
  return HABIT_MILESTONES.filter((m) => currentStreak < m.days && m.days <= streakAfter);
}
