import type { Task } from '@/types/growth-system';

export type PointBadgeStatus = 'available' | 'earned' | 'reversed';

export function pointBadgeStatusFromTask(
  task: Pick<Task, 'status' | 'pointsAwarded' | 'rewardLedgerStatus'>
): PointBadgeStatus {
  if (task.rewardLedgerStatus === 'reversed') return 'reversed';
  if (task.status === 'Done' && task.pointsAwarded) return 'earned';
  return 'available';
}

export function pointBadgeStatusHint(status: PointBadgeStatus): string | null {
  switch (status) {
    case 'reversed':
      return 'Clawed back';
    case 'earned':
      return 'Earned';
    case 'available':
      return 'On complete';
    default:
      return null;
  }
}

export function pointBadgeAriaLabel(value: number, status: PointBadgeStatus): string {
  const amount = `${value} reward point${value === 1 ? '' : 's'}`;
  switch (status) {
    case 'earned':
      return `${amount}, credited to wallet`;
    case 'reversed':
      return `${amount}, clawed back after reopening`;
    default:
      return `${amount}, awarded when marked done`;
  }
}
