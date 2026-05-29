import { describe, expect, it } from 'vitest';
import {
  pointBadgeAriaLabel,
  pointBadgeStatusFromTask,
  pointBadgeStatusHint,
} from '@/lib/point-badge';
import type { Task } from '@/types/growth-system';

const baseTask = {
  status: 'Not Started',
  pointsAwarded: false,
  rewardLedgerStatus: 'none',
} as Pick<Task, 'status' | 'pointsAwarded' | 'rewardLedgerStatus'>;

describe('pointBadgeStatusFromTask', () => {
  it('maps ledger and completion state', () => {
    expect(
      pointBadgeStatusFromTask({
        ...baseTask,
        status: 'Done',
        pointsAwarded: true,
      })
    ).toBe('earned');
    expect(
      pointBadgeStatusFromTask({
        ...baseTask,
        rewardLedgerStatus: 'reversed',
      })
    ).toBe('reversed');
    expect(pointBadgeStatusFromTask(baseTask)).toBe('available');
  });
});

describe('pointBadgeAriaLabel', () => {
  it('describes earned and available states', () => {
    expect(pointBadgeAriaLabel(12, 'available')).toContain('awarded when marked done');
    expect(pointBadgeAriaLabel(1, 'earned')).toBe('1 reward point, credited to wallet');
  });
});

describe('pointBadgeStatusHint', () => {
  it('returns short hints for inline metadata', () => {
    expect(pointBadgeStatusHint('earned')).toBe('Earned');
    expect(pointBadgeStatusHint('reversed')).toBe('Clawed back');
  });
});
