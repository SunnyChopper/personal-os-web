import type { Goal, Project, ProjectStatus } from '@/types/growth-system';
import { IMPACT_LABELS, SCHEDULE_HEALTH_STYLES } from '@/constants/project-summary';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Progress from linked goal success criteria when present (legacy string criteria supported). */
export const getGoalCriteriaProgressPercent = (goal: Goal): number => {
  const criteria = goal.successCriteria;
  if (!Array.isArray(criteria) || criteria.length === 0) return 0;
  if (typeof criteria[0] === 'string') {
    const completed = (criteria as unknown as string[]).filter((c) => c.includes('✓')).length;
    const total = criteria.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
  const completed = criteria.filter((c) => c.isCompleted).length;
  const total = criteria.length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

/**
 * Project progress (display):
 * - If the project has linked tasks (taskCount > 0), use share of tasks in Done status.
 * - Else if it has linked goals, use the average of each goal’s criteria completion %.
 * - Else 0 (completion still respects explicit project.status === Completed).
 */
export const getProjectProgressPercent = (
  taskCount: number,
  completedTaskCount: number,
  linkedGoals: Goal[]
): number => {
  if (taskCount > 0) {
    return Math.round((Math.min(completedTaskCount, taskCount) / taskCount) * 100);
  }
  if (linkedGoals.length > 0) {
    const sum = linkedGoals.reduce((acc, g) => acc + getGoalCriteriaProgressPercent(g), 0);
    return Math.round(sum / linkedGoals.length);
  }
  return 0;
};

/** Work is “done” for UX (green accent, no overdue, Completed badge) when status says so, all tasks are done, or every linked goal is Achieved. */
export const isProjectWorkComplete = (
  project: Project,
  taskCount: number,
  completedTaskCount: number,
  linkedGoals: Goal[]
): boolean =>
  project.status !== 'Cancelled' &&
  (project.status === 'Completed' ||
    (taskCount > 0 && completedTaskCount >= taskCount) ||
    (linkedGoals.length > 0 && linkedGoals.every((g) => g.status === 'Achieved')));

export const getEffectiveProjectStatus = (
  project: Project,
  workComplete: boolean
): ProjectStatus => {
  if (project.status === 'Cancelled') return 'Cancelled';
  if (project.status === 'Completed' || workComplete) return 'Completed';
  return project.status;
};

export interface ProjectDisplayModel {
  progressPercent: number;
  isWorkComplete: boolean;
  effectiveStatus: ProjectStatus;
}

export const getProjectDisplayModel = (
  project: Project,
  taskCount: number,
  completedTaskCount: number,
  linkedGoals: Goal[]
): ProjectDisplayModel => {
  const progressPercent = getProjectProgressPercent(taskCount, completedTaskCount, linkedGoals);
  const isWorkComplete = isProjectWorkComplete(project, taskCount, completedTaskCount, linkedGoals);
  return {
    progressPercent,
    isWorkComplete,
    effectiveStatus: getEffectiveProjectStatus(project, isWorkComplete),
  };
};

/** Left accent: emerald when work is complete; otherwise impact colors when impact > 0. */
export const getProjectCardAccentBarClasses = (
  project: Project,
  isWorkComplete: boolean
): { showBar: boolean; barBgClass: string } => {
  if (project.status === 'Cancelled') {
    return { showBar: false, barBgClass: '' };
  }
  if (isWorkComplete || project.status === 'Completed') {
    return { showBar: true, barBgClass: 'bg-emerald-500 dark:bg-emerald-400' };
  }
  if (project.impact > 0) {
    const impact = getImpactColors(project.impact);
    return { showBar: true, barBgClass: impact.accent.replace('border-l-', 'bg-') };
  }
  return { showBar: false, barBgClass: '' };
};

export const getImpactColors = (impact: number) => {
  if (impact >= 4)
    return {
      accent: 'border-l-amber-500 dark:border-l-amber-400',
      stars: 'text-amber-500 dark:text-amber-400',
      label: IMPACT_LABELS[impact] || 'High Impact',
    };
  if (impact === 3)
    return {
      accent: 'border-l-yellow-500 dark:border-l-yellow-400',
      stars: 'text-yellow-500 dark:text-yellow-400',
      label: IMPACT_LABELS[impact] || 'Medium Impact',
    };
  return {
    accent: 'border-l-gray-300 dark:border-l-gray-600',
    stars: 'text-gray-400 dark:text-gray-500',
    label: IMPACT_LABELS[impact] || 'Low Impact',
  };
};

export const getDateUrgency = (
  endDate: string | null,
  options?: { hideWhenComplete?: boolean }
) => {
  if (!endDate) return null;
  if (options?.hideWhenComplete) {
    return { color: '', text: null, animate: '' };
  }
  const now = +new Date();
  const daysRemaining = Math.ceil((new Date(endDate).getTime() - now) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0)
    return {
      color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      text: `Overdue by ${Math.abs(daysRemaining)} days`,
      animate: 'animate-pulse',
    };
  if (daysRemaining <= 7)
    return {
      color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      text: `Due in ${daysRemaining} days`,
      animate: '',
    };
  if (daysRemaining <= 30)
    return {
      color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
      text: `Due in ${daysRemaining} days`,
      animate: '',
    };
  return {
    color: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
    text: null,
    animate: '',
  };
};

export const getScheduleHealth = (
  project: Project,
  progressPercent: number,
  hasHealthData?: boolean
) => {
  if (!hasHealthData) return null;
  if (!project.startDate || !project.targetEndDate) return null;
  if (project.status === 'Completed' || project.status === 'Cancelled') return null;
  if (progressPercent >= 100) return null;
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.targetEndDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const now = +new Date();
  if (now > end && progressPercent < 100) {
    return SCHEDULE_HEALTH_STYLES.overdue;
  }

  const elapsedRatio = clamp01((now - start) / (end - start));
  const progressRatio = clamp01(progressPercent / 100);
  const diff = progressRatio - elapsedRatio;

  if (diff >= 0.1) return SCHEDULE_HEALTH_STYLES.ahead;
  if (diff <= -0.1) return SCHEDULE_HEALTH_STYLES.behind;
  return SCHEDULE_HEALTH_STYLES.ontrack;
};
