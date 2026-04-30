import { Target, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Goal } from '@/types/growth-system';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { ROUTES } from '@/routes';

interface GoalWithProgress {
  goal: Goal;
  progress: number;
  daysRemaining: number | null;
}

interface GoalsDashboardWidgetProps {
  goals: Goal[];
  goalsProgress: Map<string, number>;
  className?: string;
}

export function GoalsDashboardWidget({
  goals,
  goalsProgress,
  className = '',
}: GoalsDashboardWidgetProps) {
  // Get top 3 priority goals
  const activeGoals = goals
    .filter((g) => g.status === 'Active' || g.status === 'On Track' || g.status === 'At Risk')
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by progress (lower progress first for focus)
      const progressA = goalsProgress.get(a.id) || 0;
      const progressB = goalsProgress.get(b.id) || 0;
      return progressA - progressB;
    })
    .slice(0, 3);

  const goalsWithData: GoalWithProgress[] = activeGoals.map((goal) => {
    const progress = goalsProgress.get(goal.id) || 0;
    const daysRemaining = goal.targetDate
      ? Math.ceil(
          (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return { goal, progress, daysRemaining };
  });

  if (goalsWithData.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Focus Goals
          </h2>
          <Link
            to={ROUTES.admin.goals}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No active goals. Create your first goal to get started!
        </p>
        <Link to={ROUTES.admin.goals}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Goal
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Focus Goals
        </h2>
        <Link
          to={ROUTES.admin.goals}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goalsWithData.map((item, index) => {
          const { goal, progress, daysRemaining } = item;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`${ROUTES.admin.goals}?goalId=${goal.id}`}>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all group min-h-[140px] flex flex-col">
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <PriorityIndicator priority={goal.priority} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {goal.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <AreaBadge area={goal.area} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {goal.timeHorizon}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ProgressRing progress={progress} size="sm" />
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          progress >= 75
                            ? 'bg-green-500'
                            : progress >= 50
                              ? 'bg-blue-500'
                              : progress >= 25
                                ? 'bg-yellow-500'
                                : 'bg-orange-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Bottom Row - push to bottom */}
                  <div className="flex items-center justify-between text-xs mt-auto">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{progress}% complete</span>
                    </div>
                    {daysRemaining !== null && (
                      <div
                        className={`flex items-center gap-1 ${
                          daysRemaining < 0
                            ? 'text-red-600 dark:text-red-400'
                            : daysRemaining <= 7
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)}d overdue`
                            : `${daysRemaining}d left`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
