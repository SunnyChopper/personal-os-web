import { describe, expect, it } from 'vitest';
import { buildHabitCompletionToasts } from '@/lib/habit-completion-feedback';

describe('buildHabitCompletionToasts', () => {
  it('returns points toast when points are awarded', () => {
    expect(buildHabitCompletionToasts(5, 0, 3)).toEqual({
      points: { title: '+5 pts', message: '3-day streak' },
    });
  });

  it('returns milestone toast when milestone bonus is awarded', () => {
    expect(buildHabitCompletionToasts(7, 20, 7)).toEqual({
      points: { title: '+7 pts', message: '7-day streak' },
      milestone: {
        title: 'Milestone reached',
        message: '7-day streak · +20 bonus pts',
      },
    });
  });

  it('returns empty when no points or milestone', () => {
    expect(buildHabitCompletionToasts(0, 0, 0)).toEqual({});
  });
});
