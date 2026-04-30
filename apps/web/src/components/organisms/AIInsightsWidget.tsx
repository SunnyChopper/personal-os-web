import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import { useTasks, useHabits, useMetrics, useGoals, useProjects } from '@/hooks/useGrowthSystem';
import type { Task, Goal, Habit } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { ROUTES } from '@/routes';

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  action?: {
    label: string;
    link: string;
  };
  priority: 'high' | 'medium' | 'low';
}

export function AIInsightsWidget() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const { tasks, isError: tasksError, isLoading: tasksLoading } = useTasks();
  const { habits, isError: habitsError, isLoading: habitsLoading } = useHabits();
  const { metrics, isError: metricsError, isLoading: metricsLoading } = useMetrics();
  const { goals, isError: goalsError, isLoading: goalsLoading } = useGoals();
  const { projects, isError: projectsError, isLoading: projectsLoading } = useProjects();

  const isAIConfigured = llmConfig.isConfigured();
  // Only show error if we have a genuine error AND we're not still loading (initial load)
  const isAnyLoading =
    tasksLoading || habitsLoading || metricsLoading || goalsLoading || projectsLoading;
  const hasNetworkError =
    (tasksError || habitsError || metricsError || goalsError || projectsError) && !isAnyLoading;

  // Use refs to track previous values and only regenerate when data actually changes
  const prevDataRef = useRef<{
    tasksLength: number;
    habitsLength: number;
    metricsLength: number;
    goalsLength: number;
    projectsLength: number;
    tasksDone: number;
    goalsActive: number;
    goalsAtRisk: number;
  } | null>(null);

  const generateInsights = useCallback(async () => {
    // Calculate data signatures to detect actual changes
    const tasksDone = tasks.filter((t: Task) => t.status === 'Done').length;
    const goalsActive = goals.filter((g: Goal) => g.status === 'Active').length;
    const goalsAtRisk = goals.filter((g: Goal) => g.status === 'At Risk').length;

    const currentData = {
      tasksLength: tasks.length,
      habitsLength: habits.length,
      metricsLength: metrics.length,
      goalsLength: goals.length,
      projectsLength: projects.length,
      tasksDone,
      goalsActive,
      goalsAtRisk,
    };

    // Only regenerate if data actually changed (not just array reference)
    if (
      prevDataRef.current &&
      JSON.stringify(prevDataRef.current) === JSON.stringify(currentData) &&
      hasGenerated
    ) {
      return; // Data hasn't changed, skip regeneration (don't set loading state)
    }

    prevDataRef.current = currentData;
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const newInsights: Insight[] = [];

    const blockedTasks = tasks.filter((t: Task) => t.status === 'Blocked');
    if (blockedTasks.length > 0) {
      newInsights.push({
        id: 'blocked-tasks',
        type: 'warning',
        title: `${blockedTasks.length} blocked tasks need attention`,
        description: 'Review dependencies and remove blockers to keep momentum',
        action: {
          label: 'View Tasks',
          link: ROUTES.admin.tasks,
        },
        priority: 'high',
      });
    }

    const activeGoals = goals.filter((g: Goal) => g.status === 'Active');
    if (activeGoals.length > 0) {
      newInsights.push({
        id: 'active-goals',
        type: 'opportunity',
        title: `${activeGoals.length} active goals to track`,
        description: 'Review your goals and ensure they have clear success criteria',
        action: {
          label: 'Review Goals',
          link: ROUTES.admin.goals,
        },
        priority: 'medium',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyHabits = habits.filter((h: Habit) => h.frequency === 'Daily');
    if (dailyHabits.length > 0) {
      newInsights.push({
        id: 'daily-habits',
        type: 'opportunity',
        title: `${dailyHabits.length} daily habits to complete today`,
        description: 'Build consistency by maintaining your habit streaks',
        action: {
          label: 'Log Habits',
          link: ROUTES.admin.habits,
        },
        priority: 'high',
      });
    }

    const highPriorityTasks = tasks.filter(
      (t) => t.priority === 'P1' && (t.status === 'Not Started' || t.status === 'In Progress')
    );
    if (highPriorityTasks.length > 0) {
      newInsights.push({
        id: 'high-priority-tasks',
        type: 'opportunity',
        title: `${highPriorityTasks.length} high-priority tasks in progress`,
        description: 'Focus on completing critical tasks first',
        action: {
          label: 'View Tasks',
          link: ROUTES.admin.tasks,
        },
        priority: 'high',
      });
    }

    const atRiskGoals = goals.filter((g: Goal) => g.status === 'At Risk');
    if (atRiskGoals.length > 0) {
      newInsights.push({
        id: 'at-risk-goals',
        type: 'warning',
        title: `${atRiskGoals.length} goals at risk`,
        description: 'Review and adjust strategy to get back on track',
        action: {
          label: 'Review Goals',
          link: ROUTES.admin.goals,
        },
        priority: 'high',
      });
    }

    const activeMetrics = metrics.filter((m) => m.status === 'Active');
    if (activeMetrics.length > 0) {
      newInsights.push({
        id: 'track-metrics',
        type: 'recommendation',
        title: 'Time to log your metrics',
        description: 'Regular tracking ensures accurate progress monitoring',
        action: {
          label: 'Log Metrics',
          link: ROUTES.admin.metrics,
        },
        priority: 'medium',
      });
    }

    const completedTasks = tasks.filter((t: Task) => t.status === 'Done');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    if (completionRate > 70) {
      newInsights.push({
        id: 'high-completion',
        type: 'achievement',
        title: `${Math.round(completionRate)}% task completion rate`,
        description: 'Great job staying productive! Keep the momentum going',
        priority: 'low',
      });
    }

    setInsights(newInsights.filter((i) => !dismissedIds.includes(i.id)));
    setIsLoading(false);
    setHasGenerated(true);
  }, [tasks, habits, metrics, goals, projects, dismissedIds, hasGenerated]);

  useEffect(() => {
    // Only generate once data is loaded (not in error state) or after initial load
    if (!hasNetworkError || hasGenerated) {
      generateInsights();
    }
  }, [generateInsights, hasNetworkError, hasGenerated]);

  const handleDismiss = (insightId: string) => {
    setDismissedIds((prev) => [...prev, insightId]);
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  };

  const handleRefresh = () => {
    setDismissedIds([]);
    generateInsights();
  };

  const visibleInsights = insights.slice(0, 4);

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return <Zap className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'achievement':
        return <Target className="w-5 h-5" />;
      case 'recommendation':
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getColor = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      case 'achievement':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      case 'recommendation':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
    }
  };

  if (!isAIConfigured && insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h2>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition"
          title="Refresh insights"
        >
          <RefreshCw
            className={`w-5 h-5 text-amber-600 dark:text-amber-400 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {hasNetworkError ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400 mb-1">Unable to generate insights</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Backend connection unavailable</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : visibleInsights.length > 0 ? (
        <div className="space-y-3">
          {visibleInsights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-lg border p-4 ${getColor(insight.type)} relative group`}
            >
              <button
                onClick={() => handleDismiss(insight.id)}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => (window.location.href = insight.action!.link)}
                      className="mt-2"
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-amber-400 dark:text-amber-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400">
            All caught up! No new insights at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
