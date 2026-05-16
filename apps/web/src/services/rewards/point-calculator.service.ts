import type * as GrowthTypes from '@/types/growth-system';
import type { TaskPointValuation } from '@/types/rewards';

/** Wallet reward base scale: points per story point (aligns with backend TasksService). */
const BASE_POINTS_PER_STORY_POINT = 20;

const PRIORITY_MULTIPLIERS: Record<GrowthTypes.Priority, number> = {
  P1: 2.0,
  P2: 1.5,
  P3: 1.2,
  P4: 1.0,
};

/** Mirrors `TasksService._calculate_points` — only Health / Wealth deviate from default 1.1x area multiplier. */
function areaMultiplier(area: GrowthTypes.Area | string): number {
  if (area === 'Health') return 1.3;
  if (area === 'Wealth') return 1.2;
  return 1.1;
}

function priorityMultiplierFn(priority: GrowthTypes.Priority | string): number {
  const p = ((priority === '' ? 'P3' : priority) || 'P3') as GrowthTypes.Priority;
  return PRIORITY_MULTIPLIERS[p] ?? 1.0;
}

/** Integer truncation matches Python `int(total)` on non-negative totals. */
function floorTotal(basePoints: number, prioMult: number, arrMult: number, szMult: number): number {
  return Math.floor(basePoints * prioMult * arrMult * szMult);
}

/** Match Python `{x:g}` for multipliers when building parity reasoning strings. */
function formatReasoningMultiplier(n: number): string {
  if (Number.isInteger(n)) {
    return String(n);
  }
  return `${parseFloat(n.toPrecision(12))}`;
}
export const pointCalculatorService = {
  /**
   * Deterministic breakdown for UI before a task row exists — must stay aligned with
   * `build_task_point_breakdown` in `personal-os-backend/src/services/tasks.py`.
   */
  buildWalletPreviewFromDrivers(
    size: number | null | undefined,
    priority: GrowthTypes.Priority,
    area: GrowthTypes.Area
  ): { totalPoints: number; breakdown: GrowthTypes.TaskPointBreakdown } {
    const sp = size ?? 5;
    const basePoints = sp * BASE_POINTS_PER_STORY_POINT;
    const pMult = priorityMultiplierFn(priority);
    const aMult = areaMultiplier(area);
    const sizeMultiplier = size != null ? (size >= 13 ? 1.5 : size >= 8 ? 1.2 : 1.0) : 1.0;

    const totalPoints = floorTotal(basePoints, pMult, aMult, sizeMultiplier);
    const reasoning = [
      `Wallet points = ${basePoints} base (${sp} story points × 20) × ${formatReasoningMultiplier(pMult)} priority`,
      `× ${formatReasoningMultiplier(aMult)} area × ${formatReasoningMultiplier(sizeMultiplier)} size bonus → ${totalPoints}.`,
    ].join(' ');

    return {
      totalPoints,
      breakdown: {
        storyPoints: sp,
        basePoints,
        priorityMultiplier: pMult,
        areaMultiplier: aMult,
        sizeBonus: sizeMultiplier,
        total: totalPoints,
        reasoning,
      },
    };
  },

  /**
   * Same formula as POST/PATCH persisted `pointValue` (backend `TasksService._calculate_points`).
   */
  calculateTaskPointsFromDrivers(
    size: number | null | undefined,
    priority: GrowthTypes.Priority,
    area: GrowthTypes.Area
  ): number {
    const sp = size ?? 5;
    const basePoints = sp * BASE_POINTS_PER_STORY_POINT;
    const pMult = priorityMultiplierFn(priority);
    const aMult = areaMultiplier(area);
    const sizeMultiplier = size != null ? (size >= 13 ? 1.5 : size >= 8 ? 1.2 : 1.0) : 1.0;
    return floorTotal(basePoints, pMult, aMult, sizeMultiplier);
  },

  calculateTaskPoints(task: GrowthTypes.Task): TaskPointValuation {
    const sp = task.size ?? 5;

    const basePoints = sp * BASE_POINTS_PER_STORY_POINT;

    const priorityMult = priorityMultiplierFn(task.priority);

    const areaMult = areaMultiplier(task.area);

    const sizeMultiplier =
      task.size != null ? (task.size >= 13 ? 1.5 : task.size >= 8 ? 1.2 : 1.0) : 1.0;

    const totalPoints = floorTotal(basePoints, priorityMult, areaMult, sizeMultiplier);

    return {
      taskId: task.id,
      basePoints,
      sizeMultiplier,
      priorityMultiplier: priorityMult,
      areaMultiplier: areaMult,
      totalPoints,
      calculatedAt: new Date().toISOString(),
    };
  },

  getBasePointsPerStoryPoint(): number {
    return BASE_POINTS_PER_STORY_POINT;
  },

  getPriorityMultiplier(priority: GrowthTypes.Priority): number {
    return priorityMultiplierFn(priority);
  },

  getAreaMultiplier(area: GrowthTypes.Area): number {
    return areaMultiplier(area);
  },

  calculateMetricMilestonePoints(
    milestoneType: 'target_reached' | 'streak' | 'improvement' | 'consistency',
    value: number,
    targetValue?: number | null
  ): number {
    switch (milestoneType) {
      case 'target_reached':
        return this._calculateTargetReachedPoints(targetValue);
      case 'streak':
        return this._calculateStreakPoints(value);
      case 'improvement':
        return this._calculateImprovementPoints(value);
      case 'consistency':
        return this._calculateConsistencyPoints(value);
      default:
        return 0;
    }
  },

  _calculateTargetReachedPoints(targetValue?: number | null): number {
    if (!targetValue) return 0;
    // Base 200, multiplied by target difficulty
    const multiplier = targetValue > 100 ? 1.5 : targetValue > 50 ? 1.2 : 1.0;
    return Math.round(200 * multiplier);
  },

  _calculateStreakPoints(value: number): number {
    if (value === 7) return 350;
    if (value === 30) return 1500;
    if (value === 100) return 5000;
    // 50 points per day for other streaks
    return Math.round(value * 50);
  },

  _calculateImprovementPoints(value: number): number {
    if (value >= 50) return 1000;
    if (value >= 25) return 500;
    if (value >= 10) return 200;
    return 0;
  },

  _calculateConsistencyPoints(value: number): number {
    if (value === 7) return 175;
    if (value === 30) return 750;
    // 25 points per day for other consistency
    return Math.round(value * 25);
  },
};
