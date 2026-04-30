import type { Task, Area, Priority } from '@/types/growth-system';
import type { TaskPointValuation } from '@/types/rewards';

/** Wallet reward base scale: points per story point (aligns with backend TasksService). */
const BASE_POINTS_PER_STORY_POINT = 20;

const PRIORITY_MULTIPLIERS: Record<Priority, number> = {
  P1: 2.0,
  P2: 1.5,
  P3: 1.2,
  P4: 1.0,
};

const AREA_MULTIPLIERS: Record<Area, number> = {
  Health: 1.3,
  Wealth: 1.2,
  Love: 1.2,
  Happiness: 1.1,
  Operations: 1.0,
  'Day Job': 1.1,
};

export const pointCalculatorService = {
  calculateTaskPoints(task: Task): TaskPointValuation {
    const sp = task.size ?? 5;

    const basePoints = sp * BASE_POINTS_PER_STORY_POINT;

    const priorityMultiplier = PRIORITY_MULTIPLIERS[task.priority];

    const areaMultiplier = AREA_MULTIPLIERS[task.area];

    const sizeMultiplier =
      task.size != null ? (task.size >= 13 ? 1.5 : task.size >= 8 ? 1.2 : 1.0) : 1.0;

    const totalPoints = Math.round(
      basePoints * priorityMultiplier * areaMultiplier * sizeMultiplier
    );

    return {
      taskId: task.id,
      basePoints,
      sizeMultiplier,
      priorityMultiplier,
      areaMultiplier,
      totalPoints,
      calculatedAt: new Date().toISOString(),
    };
  },

  getBasePointsPerStoryPoint(): number {
    return BASE_POINTS_PER_STORY_POINT;
  },

  getPriorityMultiplier(priority: Priority): number {
    return PRIORITY_MULTIPLIERS[priority];
  },

  getAreaMultiplier(area: Area): number {
    return AREA_MULTIPLIERS[area];
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
