import type { Goal, GoalHealth, GoalStatus } from '@/types/growth-system';

const LEGACY_ACTIVE_STATUSES = new Set(['On Track', 'At Risk']);

/** Map legacy persisted statuses to lifecycle Active. */
export function normalizeGoalLifecycleStatus(status: string): GoalStatus {
  if (LEGACY_ACTIVE_STATUSES.has(status)) {
    return 'Active';
  }
  return status as GoalStatus;
}

export function isGoalHealthAtRisk(goal: Pick<Goal, 'health'>): boolean {
  return goal.health === 'atRisk' || goal.health === 'behind';
}

export function isGoalHealthStagnant(goal: Pick<Goal, 'health'>): boolean {
  return goal.health === 'stagnant';
}

export function isGoalHealthDormant(goal: Pick<Goal, 'health'>): boolean {
  return goal.health === 'dormant';
}

export function isGoalVelocityStalled(goal: Pick<Goal, 'health'>): boolean {
  return goal.health === 'stagnant' || goal.health === 'dormant';
}

export function resolveGoalHealth(
  goal: Pick<Goal, 'health' | 'status'>,
  fallback?: GoalHealth | null
): GoalHealth | null {
  if (goal.health) {
    return goal.health;
  }
  if (fallback) {
    return fallback;
  }
  return goal.status === 'Active' ? 'onTrack' : null;
}
