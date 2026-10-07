import type { GoalProgressBreakdown, GoalProgressConfig } from '@/types/growth-system';
import { DEFAULT_GOAL_PROGRESS_WEIGHTS } from '@/utils/goal-progress-weights';

export type GoalProgressFactorKey = 'criteria' | 'tasks' | 'metrics' | 'habits' | 'projects';

export interface GoalProgressOverviewItem {
  title: string;
  detail: string;
}

export interface GoalProgressOverviewFactor {
  key: GoalProgressFactorKey;
  label: string;
  slicePct: number;
  weight: number;
  contributionPts: number;
  detail: string;
  color: string;
  items: GoalProgressOverviewItem[];
}

export interface GoalProgressOverviewSourceItems {
  criteria?: { id: string; description: string; isCompleted: boolean }[];
  tasks?: { id: string; title: string; status: string }[];
  metrics?: { id: string; name: string; atTarget?: boolean }[];
  habits?: { id: string; name: string; consistency?: number }[];
}

export interface GoalProgressOverview {
  factors: GoalProgressOverviewFactor[];
  totalWeight: number;
  formulaLabel: string;
  manualOverride: number | null;
  computedOverall: number;
}

const FACTOR_META: Record<GoalProgressFactorKey, { label: string; color: string }> = {
  criteria: { label: 'Criteria', color: 'bg-blue-500' },
  tasks: { label: 'Tasks', color: 'bg-purple-500' },
  metrics: { label: 'Metrics', color: 'bg-green-500' },
  habits: { label: 'Habits', color: 'bg-amber-500' },
  projects: { label: 'Projects', color: 'bg-cyan-500' },
};

function resolveWeights(progress: GoalProgressBreakdown): GoalProgressConfig {
  return progress.weights ?? DEFAULT_GOAL_PROGRESS_WEIGHTS;
}

function weightForKey(weights: GoalProgressConfig, key: GoalProgressFactorKey): number {
  switch (key) {
    case 'criteria':
      return weights.criteriaWeight;
    case 'tasks':
      return weights.tasksWeight;
    case 'metrics':
      return weights.metricsWeight;
    case 'habits':
      return weights.habitsWeight;
    case 'projects':
      return weights.projectsWeight ?? 0;
  }
}

function slicePctForKey(progress: GoalProgressBreakdown, key: GoalProgressFactorKey): number {
  switch (key) {
    case 'criteria':
      return progress.criteria.percentage;
    case 'tasks':
      return progress.tasks.percentage;
    case 'metrics':
      return progress.metrics.percentage;
    case 'habits':
      return progress.habits.consistency;
    case 'projects':
      return progress.projects?.percentage ?? 0;
  }
}

function detailForKey(progress: GoalProgressBreakdown, key: GoalProgressFactorKey): string {
  switch (key) {
    case 'criteria':
      return `${progress.criteria.completed}/${progress.criteria.total} completed`;
    case 'tasks':
      return `${progress.tasks.completed}/${progress.tasks.total} done`;
    case 'metrics':
      return `${progress.metrics.atTarget}/${progress.metrics.total} at target`;
    case 'habits':
      return `${progress.habits.consistency}% consistency`;
    case 'projects':
      return `${progress.projects?.linkedCount ?? 0} linked`;
  }
}

function buildFactorItems(
  progress: GoalProgressBreakdown,
  key: GoalProgressFactorKey,
  sourceItems?: GoalProgressOverviewSourceItems
): GoalProgressOverviewItem[] {
  switch (key) {
    case 'criteria': {
      const rows = sourceItems?.criteria;
      if (rows && rows.length > 0) {
        return rows.map((c) => ({
          title: c.description,
          detail: c.isCompleted ? 'Completed' : 'Not completed',
        }));
      }
      return [];
    }
    case 'tasks': {
      const rows = sourceItems?.tasks;
      if (rows && rows.length > 0) {
        return rows.map((t) => ({
          title: t.title,
          detail: t.status === 'Done' ? 'Done' : t.status,
        }));
      }
      return [];
    }
    case 'metrics': {
      const rows = sourceItems?.metrics;
      if (rows && rows.length > 0) {
        return rows.map((m) => ({
          title: m.name,
          detail: m.atTarget ? 'At target' : 'Not at target',
        }));
      }
      return [];
    }
    case 'habits': {
      const rows = sourceItems?.habits;
      if (rows && rows.length > 0) {
        return rows.map((h) => ({
          title: h.name,
          detail: h.consistency != null ? `${h.consistency}% consistency` : 'Linked habit',
        }));
      }
      return [];
    }
    case 'projects': {
      const items = progress.projects?.items ?? [];
      return items.map((p) => ({
        title: p.title,
        detail: `${p.completionPercentage}% complete · weight ${p.contributionWeight} (${Math.round(p.normalizedShare * 100)}% of slice)`,
      }));
    }
  }
}

function computeOverallFromFactors(
  factors: GoalProgressOverviewFactor[],
  totalWeight: number,
  manualOverride: number | null
): number {
  if (manualOverride != null) {
    return Math.round(manualOverride * 10) / 10;
  }
  if (totalWeight <= 0) return 0;
  const weighted = factors.reduce((sum, f) => sum + f.slicePct * f.weight, 0);
  return Math.round((weighted / totalWeight) * 10) / 10;
}

function buildFormulaLabel(factors: GoalProgressOverviewFactor[], totalWeight: number): string {
  if (totalWeight <= 0 || factors.length === 0) {
    return '0%';
  }
  const terms = factors.map((f) => `${formatPct(f.slicePct)}% × ${f.weight}`).join(' + ');
  return `(${terms}) / ${totalWeight}`;
}

function formatPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function buildGoalProgressOverview(
  progress: GoalProgressBreakdown,
  sourceItems?: GoalProgressOverviewSourceItems
): GoalProgressOverview {
  const weights = resolveWeights(progress);
  const manualOverride = weights.manualOverride;
  const allKeys: GoalProgressFactorKey[] = ['criteria', 'tasks', 'metrics', 'habits', 'projects'];

  const visibleKeys = allKeys.filter((key) => weightForKey(weights, key) > 0);
  const totalWeight = visibleKeys.reduce((sum, key) => sum + weightForKey(weights, key), 0);

  const factors: GoalProgressOverviewFactor[] = visibleKeys.map((key) => {
    const weight = weightForKey(weights, key);
    const slicePct = slicePctForKey(progress, key);
    const contributionPts =
      totalWeight > 0 ? Math.round(((slicePct * weight) / totalWeight) * 10) / 10 : 0;
    const meta = FACTOR_META[key];
    return {
      key,
      label: meta.label,
      slicePct,
      weight,
      contributionPts,
      detail: detailForKey(progress, key),
      color: meta.color,
      items: buildFactorItems(progress, key, sourceItems),
    };
  });

  const computedOverall = computeOverallFromFactors(factors, totalWeight, manualOverride);

  return {
    factors,
    totalWeight,
    formulaLabel: buildFormulaLabel(factors, totalWeight),
    manualOverride,
    computedOverall,
  };
}
