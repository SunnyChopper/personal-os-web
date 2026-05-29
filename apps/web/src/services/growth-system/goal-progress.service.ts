import { goalsService } from './goals.service';
import { metricsService } from './metrics.service';
import { habitsService } from './habits.service';
import { DEFAULT_GOAL_PROGRESS_WEIGHTS } from '@/utils/goal-progress-weights';
import type {
  Goal,
  GoalHealth,
  GoalProgressBreakdown,
  GoalProgressConfig,
  SuccessCriterion,
  Task,
  Metric,
  Habit,
} from '@/types/growth-system';

interface GoalHealthData {
  status: GoalHealth;
  daysRemaining: number | null;
  velocityScore: number;
  momentum: 'active' | 'dormant';
}

const DEFAULT_WEIGHTS = DEFAULT_GOAL_PROGRESS_WEIGHTS;

function rolling30dStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function expectedHabitOccurrences30d(habit: Habit): number {
  if (habit.frequency === 'Daily') {
    return 30;
  }
  if (habit.frequency === 'Weekly') {
    const perWeek = habit.weeklyTarget ?? 1;
    return Math.max(1, Math.round((30 / 7) * perWeek));
  }
  if (habit.frequency === 'Monthly') {
    return Math.max(1, habit.weeklyTarget ? habit.weeklyTarget * 4 : 1);
  }
  return 30;
}

function computeLocalOverall(
  criteriaPct: number,
  tasksPct: number,
  metricsPct: number,
  habitsPct: number,
  weights: GoalProgressConfig
): number {
  if (weights.manualOverride != null) {
    return Math.round(weights.manualOverride);
  }
  const totalWeight =
    weights.criteriaWeight + weights.tasksWeight + weights.metricsWeight + weights.habitsWeight;
  if (totalWeight <= 0) return 0;
  const overall =
    ((criteriaPct * weights.criteriaWeight) / 100 +
      (tasksPct * weights.tasksWeight) / 100 +
      (metricsPct * weights.metricsWeight) / 100 +
      (habitsPct * weights.habitsWeight) / 100) /
    (totalWeight / 100);
  return Math.round(overall);
}

export const goalProgressService = {
  async computeProgress(
    goal: Goal | string,
    tasks?: Task[],
    metrics?: Metric[],
    habits?: Habit[]
  ): Promise<GoalProgressBreakdown> {
    const goalId = typeof goal === 'string' ? goal : goal.id;

    try {
      const apiResult = await goalsService.getProgress(goalId);
      if (apiResult.success && apiResult.data) {
        return apiResult.data;
      }
    } catch (error) {
      console.warn('Goal progress API unavailable, using local fallback', error);
    }

    let goalObj: Goal;
    if (typeof goal === 'string') {
      const goalResponse = await goalsService.getById(goal);
      if (!goalResponse.success || !goalResponse.data) {
        throw new Error('Goal not found');
      }
      goalObj = goalResponse.data;
    } else {
      goalObj = goal;
    }

    const weights = goalObj.progressConfig || DEFAULT_WEIGHTS;

    const criteriaProgress = this.calculateCriteriaProgress(goalObj.successCriteria);

    let tasksForProgress: Task[];
    if (tasks !== undefined) {
      tasksForProgress = tasks;
    } else {
      const tasksResponse = await goalsService.getLinkedTasks(goalObj.id);
      tasksForProgress = tasksResponse.success ? tasksResponse.data || [] : [];
    }
    const tasksProgress = this.calculateTasksProgress(tasksForProgress);

    let metricsForProgress: Metric[];
    if (metrics !== undefined) {
      metricsForProgress = metrics;
    } else {
      const metricsResponse = await goalsService.getLinkedMetrics(goalObj.id);
      metricsForProgress = metricsResponse.success ? metricsResponse.data || [] : [];
    }
    const metricsProgress = await this.calculateMetricsProgress(
      metricsForProgress.map((m) => m.id)
    );

    let habitsForProgress: Habit[];
    if (habits !== undefined) {
      habitsForProgress = habits;
    } else {
      const habitsResponse = await goalsService.getLinkedHabits(goalObj.id);
      habitsForProgress = habitsResponse.success ? habitsResponse.data || [] : [];
    }
    const habitsProgress = await this.calculateHabitsProgress(habitsForProgress);

    const overall = computeLocalOverall(
      criteriaProgress.percentage,
      tasksProgress.percentage,
      metricsProgress.percentage,
      habitsProgress.consistency,
      weights
    );

    return {
      overall,
      criteria: criteriaProgress,
      tasks: tasksProgress,
      metrics: metricsProgress,
      habits: habitsProgress,
      weights,
    };
  },

  calculateCriteriaProgress(criteria: SuccessCriterion[] | string[]): {
    completed: number;
    total: number;
    percentage: number;
  } {
    if (criteria.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    if (typeof criteria[0] === 'string') {
      const completed = (criteria as string[]).filter((c) => c.includes('✓')).length;
      const total = criteria.length;
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }

    const typedCriteria = criteria as SuccessCriterion[];
    const completed = typedCriteria.filter((c) => c.isCompleted).length;
    const total = typedCriteria.length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  calculateTasksProgress(tasks: Task[]): { completed: number; total: number; percentage: number } {
    if (tasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = tasks.filter((t) => t.status === 'Done').length;
    const total = tasks.length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  async calculateMetricsProgress(
    metricIds: string[]
  ): Promise<{ atTarget: number; total: number; percentage: number }> {
    if (metricIds.length === 0) {
      return { atTarget: 0, total: 0, percentage: 0 };
    }

    let atTarget = 0;

    for (const metricId of metricIds) {
      const metricResponse = await metricsService.getById(metricId);
      if (!metricResponse.success || !metricResponse.data) continue;

      const metric = metricResponse.data;
      const logsResponse = await metricsService.getHistory(metricId);

      if (!logsResponse.success || !logsResponse.data || logsResponse.data.length === 0) continue;

      const latestLog = logsResponse.data[0];
      if (this.isMetricAtTarget(latestLog.value, metric)) {
        atTarget++;
      }
    }

    const total = metricIds.length;
    return {
      atTarget,
      total,
      percentage: total > 0 ? Math.round((atTarget / total) * 100) : 0,
    };
  },

  isMetricAtTarget(value: number, metric: Metric): boolean {
    if (metric.targetValue === null) return false;

    const threshold = metric.targetValue * 0.9;

    if (metric.direction === 'Higher') {
      return value >= threshold;
    } else if (metric.direction === 'Lower') {
      return value <= metric.targetValue * 1.1;
    } else if (metric.direction === 'Target') {
      const range = metric.targetValue * 0.1;
      return Math.abs(value - metric.targetValue) <= range;
    }

    return false;
  },

  async calculateHabitsProgress(
    habits: Habit[]
  ): Promise<{ streakDays: number; consistency: number }> {
    if (habits.length === 0) {
      return { streakDays: 0, consistency: 0 };
    }

    const startDate = rolling30dStartDate();
    let totalConsistency = 0;
    let maxStreak = 0;

    for (const habit of habits) {
      const logsResponse = await habitsService.getLogsByHabit(habit.id, { startDate });
      const completions30d = logsResponse.success ? (logsResponse.data?.length ?? 0) : 0;
      const expected = expectedHabitOccurrences30d(habit);
      const consistency = Math.min(100, Math.round((completions30d / expected) * 100));
      totalConsistency += consistency;
      maxStreak = Math.max(maxStreak, habit.currentStreak ?? 0);
    }

    return {
      streakDays: maxStreak,
      consistency: habits.length > 0 ? Math.round(totalConsistency / habits.length) : 0,
    };
  },

  async calculateHealth(goal: Goal, progress: GoalProgressBreakdown): Promise<GoalHealthData> {
    if (!goal) {
      throw new Error('Goal is required for health calculation');
    }

    const now = new Date();
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    const createdDate = new Date(goal.createdAt);
    const velocityReference = goal.lastVelocityActivityAt
      ? new Date(goal.lastVelocityActivityAt)
      : goal.lastActivityAt
        ? new Date(goal.lastActivityAt)
        : goal.activeSince
          ? new Date(goal.activeSince)
          : createdDate;

    const daysRemaining = targetDate
      ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const daysSinceActivity = Math.ceil(
      (now.getTime() - velocityReference.getTime()) / (1000 * 60 * 60 * 24)
    );
    let momentum: 'active' | 'dormant' = daysSinceActivity < 7 ? 'active' : 'dormant';

    const totalDays =
      Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const velocityScore = progress.overall / totalDays;

    let status: GoalHealth = goal.health ?? 'onTrack';

    if (goal.health == null) {
      if (daysSinceActivity >= 14) {
        status = 'dormant';
        momentum = 'dormant';
      } else if (daysSinceActivity >= 7) {
        status = 'stagnant';
        momentum = 'dormant';
      } else if (daysRemaining !== null && targetDate) {
        const totalProjectDays = Math.ceil(
          (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const expectedProgress =
          totalProjectDays > 0 ? ((totalProjectDays - daysRemaining) / totalProjectDays) * 100 : 0;

        if (progress.overall < expectedProgress - 20) {
          status = 'behind';
        } else if (progress.overall < expectedProgress - 10) {
          status = 'atRisk';
        }
      }
    } else if (goal.health === 'dormant' || goal.health === 'stagnant') {
      momentum = 'dormant';
    }

    return {
      status,
      daysRemaining,
      velocityScore,
      momentum,
    };
  },

  getLinkedCounts: async (
    goalId: string
  ): Promise<{ tasks: number; metrics: number; habits: number; projects: number }> => {
    const [tasksRes, metricsRes, habitsRes, projectsRes] = await Promise.all([
      goalsService.getLinkedTasks(goalId),
      goalsService.getLinkedMetrics(goalId),
      goalsService.getLinkedHabits(goalId),
      goalsService.getLinkedProjects?.(goalId) || Promise.resolve({ data: [], success: true }),
    ]);

    return {
      tasks: tasksRes.success ? tasksRes.data?.length || 0 : 0,
      metrics: metricsRes.success ? metricsRes.data?.length || 0 : 0,
      habits: habitsRes.success ? habitsRes.data?.length || 0 : 0,
      projects: projectsRes.success ? projectsRes.data?.length || 0 : 0,
    };
  },
};
