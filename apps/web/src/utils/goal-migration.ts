import { generateId } from '@/mocks/storage';
import type { Goal, SuccessCriterion } from '@/types/growth-system';

/**
 * Migrate goals with old string[] successCriteria to new SuccessCriterion[] format
 */
export function migrateSuccessCriteria(oldCriteria: string[]): SuccessCriterion[] {
  return oldCriteria.map((text, index) => ({
    id: generateId(),
    description: text.replace(/^✓\s*/, ''), // Remove checkmark prefix
    isCompleted: text.includes('✓'),
    completedAt: text.includes('✓') ? new Date().toISOString() : null,
    linkedMetricId: null,
    linkedTaskId: null,
    targetDate: null,
    order: index,
  }));
}

/**
 * Check if a goal needs migration
 */
export function needsMigration(goal: Goal): boolean {
  if (!goal.successCriteria || goal.successCriteria.length === 0) {
    return false;
  }
  // If the first item is a string, it needs migration
  return typeof goal.successCriteria[0] === 'string';
}

/**
 * Migrate a single goal
 */
export function migrateGoal(goal: Goal): Goal {
  if (!needsMigration(goal)) {
    return goal;
  }

  const oldCriteria = goal.successCriteria as unknown as string[];
  const newCriteria = migrateSuccessCriteria(oldCriteria);

  return {
    ...goal,
    successCriteria: newCriteria,
    progressConfig: goal.progressConfig || {
      criteriaWeight: 40,
      tasksWeight: 30,
      metricsWeight: 20,
      habitsWeight: 10,
      manualOverride: null,
    },
    parentGoalId: goal.parentGoalId || null,
    lastActivityAt: goal.lastActivityAt || goal.updatedAt || goal.createdAt,
  };
}

/**
 * Migrate all goals in a list
 */
export function migrateGoals(goals: Goal[]): Goal[] {
  return goals.map(migrateGoal);
}

/**
 * Get migration statistics
 */
export function getMigrationStats(goals: Goal[]): {
  total: number;
  needsMigration: number;
  migrated: number;
} {
  const total = goals.length;
  const needsMigrationCount = goals.filter(needsMigration).length;

  return {
    total,
    needsMigration: needsMigrationCount,
    migrated: 0,
  };
}
