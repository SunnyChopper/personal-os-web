import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sun,
  CheckSquare,
  Repeat,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Rocket,
  AlertCircle,
} from 'lucide-react';
import { useTasks, useHabits, useMetrics } from '@/hooks/useGrowthSystem';
import type { Task, Habit, Metric } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { usePlannerWeek } from '@/hooks/usePlanner';
import { mondayISO, todayISOLocal } from '@/lib/planner/week';

interface DailyPlan {
  topTasks: Task[];
  habitsToComplete: Habit[];
  metricsToLog: Metric[];
  energyLevel: 'morning' | 'afternoon' | 'evening';
  briefing: string;
}

interface DailyPlanningAssistantProps {
  onStartDay?: () => void;
}

export function DailyPlanningAssistant({ onStartDay }: DailyPlanningAssistantProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasGenerated = useRef(false);

  const { tasks, isLoading: tasksLoading, isError: tasksError } = useTasks();
  const { habits, isLoading: habitsLoading, isError: habitsError } = useHabits();
  const { metrics, isLoading: metricsLoading, isError: metricsError } = useMetrics();
  const weekStart = useMemo(() => mondayISO(new Date()), []);
  const { data: plannerWeek } = usePlannerWeek(weekStart);

  // Only show error if we have a genuine error AND we're not still loading (initial load)
  const hasNetworkError =
    (tasksError || habitsError || metricsError) &&
    !(tasksLoading || habitsLoading || metricsLoading);
  const isLoading = tasksLoading || habitsLoading || metricsLoading;

  // Track previous data signatures to detect actual changes
  const prevDataRef = useRef<{
    tasksLength: number;
    activeTasksCount: number;
    habitsLength: number;
    dailyHabitsCount: number;
    metricsLength: number;
    activeMetricsCount: number;
  } | null>(null);

  const generateDailyPlan = useCallback(async () => {
    // Calculate data signatures to detect actual changes
    const activeTasks = tasks
      .filter((t: Task) => t.status === 'Not Started' || t.status === 'In Progress')
      .filter((t: Task) => t.status !== 'Blocked');
    const dailyHabits = habits.filter((h: Habit) => h.frequency === 'Daily');
    const activeMetrics = metrics.filter((m: Metric) => m.status === 'Active');

    const currentData = {
      tasksLength: tasks.length,
      activeTasksCount: activeTasks.length,
      habitsLength: habits.length,
      dailyHabitsCount: dailyHabits.length,
      metricsLength: metrics.length,
      activeMetricsCount: activeMetrics.length,
    };

    // Only regenerate if data actually changed (not just array reference)
    if (
      prevDataRef.current &&
      JSON.stringify(prevDataRef.current) === JSON.stringify(currentData) &&
      hasGenerated.current
    ) {
      return; // Data hasn't changed, skip regeneration
    }

    prevDataRef.current = currentData;
    setIsGeneratingPlan(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const today = new Date();
    const hour = today.getHours();

    let energyLevel: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) energyLevel = 'morning';
    else if (hour < 18) energyLevel = 'afternoon';
    else energyLevel = 'evening';

    const scoredTasks = activeTasks.map((task: Task) => {
      let score = 0;

      if (task.priority === 'P1') score += 40;
      else if (task.priority === 'P2') score += 30;
      else if (task.priority === 'P3') score += 20;
      else score += 10;

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 0) score += 50;
        else if (daysUntilDue <= 2) score += 30;
        else if (daysUntilDue <= 7) score += 10;
      }

      if (task.scheduledDate) {
        const scheduled = new Date(task.scheduledDate);
        const todayStr = today.toDateString();
        const scheduledStr = scheduled.toDateString();
        if (scheduledStr === todayStr) {
          score += 25;
        }
      }

      if (task.size === 1) score += 15;
      else if (task.size && task.size <= 3) score += 10;
      else if (task.size && task.size <= 5) score += 5;

      return { task, score };
    });

    type ScoredTask = { task: Task; score: number };
    scoredTasks.sort((a: ScoredTask, b: ScoredTask) => b.score - a.score);
    const fallbackTop = scoredTasks.slice(0, 3).map((s: ScoredTask) => s.task);

    const todayStr = todayISOLocal();
    const todayDay = plannerWeek?.days.find((d) => d.date === todayStr);
    const plannerTop: Task[] = [];
    if (todayDay) {
      const ids: string[] = [];
      if (todayDay.oneThingTaskId) ids.push(todayDay.oneThingTaskId);
      todayDay.blocks.forEach((b) => {
        if (b.taskId) ids.push(b.taskId);
      });
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        const t = tasks.find((x: Task) => x.id === id);
        if (t && activeTasks.some((a: Task) => a.id === id)) plannerTop.push(t);
        if (plannerTop.length >= 3) break;
      }
    }
    const topTasks = plannerTop.length > 0 ? plannerTop : fallbackTop;

    const capHint = plannerWeek?.velocity
      ? ` Capacity ~${plannerWeek.velocity.dailyCapacityStoryPoints} pts/day.`
      : '';
    let briefing = '';
    if (energyLevel === 'morning') {
      briefing = `Good morning! You have ${topTasks.length} priority tasks, ${dailyHabits.length} habits to build, and ${activeMetrics.length} metrics to track.${capHint} Start your day strong!`;
    } else if (energyLevel === 'afternoon') {
      briefing = `Good afternoon! ${topTasks.length} tasks await your focus. Don't forget your ${dailyHabits.length} daily habits!${capHint}`;
    } else {
      briefing = `Good evening! Wind down by completing ${topTasks.length} remaining tasks and logging your ${dailyHabits.length} habits for today.${capHint}`;
    }

    setPlan({
      topTasks,
      habitsToComplete: dailyHabits,
      metricsToLog: activeMetrics.slice(0, 3),
      energyLevel,
      briefing,
    });

    setIsGeneratingPlan(false);
    hasGenerated.current = true;
  }, [tasks, habits, metrics, plannerWeek]);

  useEffect(() => {
    // Only generate once data is loaded (not in error state) or after initial load
    // Note: generateDailyPlan is memoized with useCallback and only runs when data actually changes
    // due to our data signature comparison, so this pattern is safe and necessary for syncing with React Query data
    if (!hasNetworkError || hasGenerated.current) {
      generateDailyPlan();
    }
  }, [generateDailyPlan, hasNetworkError]);

  if (hasNetworkError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to load daily plan
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Backend connection unavailable
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Please check the connection status and try again
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || isGeneratingPlan || !plan) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Sun className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Planning</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {plan.energyLevel === 'morning' && 'Start your day right'}
              {plan.energyLevel === 'afternoon' && 'Maintain momentum'}
              {plan.energyLevel === 'evening' && 'Finish strong'}
            </p>
          </div>
        </div>
        {onStartDay && (
          <Button
            onClick={onStartDay}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Rocket className="w-4 h-4" />
            Start Day
          </Button>
        )}
      </div>

      <div className="mb-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <span>{plan.briefing}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Top 3 Tasks for Today
            </h3>
            <div className="flex gap-3">
              <Link
                to={ROUTES.admin.planner}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Planner
              </Link>
              <Link
                to={ROUTES.admin.tasks}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
          {plan.topTasks.length > 0 ? (
            <div className="space-y-2">
              {plan.topTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          task.priority === 'P1'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : task.priority === 'P2'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : task.priority === 'P3'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.size ? (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {task.size}pts
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No tasks for today. Enjoy your free time!
            </p>
          )}
        </div>

        {isExpanded && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Habits to Complete
                </h3>
                <Link
                  to={ROUTES.admin.habits}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>
              {plan.habitsToComplete.length > 0 ? (
                <div className="space-y-2">
                  {plan.habitsToComplete.slice(0, 5).map((habit) => (
                    <div
                      key={habit.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <p className="flex-1 font-medium text-gray-900 dark:text-white">
                        {habit.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No daily habits configured
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Metrics to Log
                </h3>
                <Link
                  to={ROUTES.admin.metrics}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>
              {plan.metricsToLog.length > 0 ? (
                <div className="space-y-2">
                  {plan.metricsToLog.map((metric) => (
                    <div
                      key={metric.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{metric.name}</p>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.unit === 'custom' ? metric.customUnit : metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No active metrics
                </p>
              )}
            </div>
          </>
        )}

        <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)} className="w-full">
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      </div>
    </div>
  );
}
