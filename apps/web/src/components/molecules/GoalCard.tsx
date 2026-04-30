import { useState } from 'react';
import {
  Target,
  Calendar,
  TrendingUp,
  CheckSquare,
  Activity,
  Zap,
  Moon,
  Plus,
  BarChart3,
  Repeat,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Goal, GoalProgressBreakdown, SuccessCriterion } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';
import { formatDateString } from '@/utils/date-formatters';

type HealthStatus = 'healthy' | 'at_risk' | 'behind' | 'dormant';

interface GoalCardProps {
  goal: Goal;
  onClick: (goal: Goal) => void;
  progress?: GoalProgressBreakdown;
  linkedCounts?: { tasks: number; metrics: number; habits: number; projects: number };
  healthStatus?: HealthStatus;
  daysRemaining?: number | null;
  momentum?: 'active' | 'dormant';
  onQuickAction?: (action: 'add_task' | 'log_metric' | 'complete_criterion') => void;
}

export function GoalCard({
  goal,
  onClick,
  progress,
  linkedCounts = { tasks: 0, metrics: 0, habits: 0, projects: 0 },
  healthStatus = 'healthy',
  daysRemaining = null,
  momentum = 'active',
  onQuickAction,
}: GoalCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Fallback progress calculation if not provided
  const criteriaProgress =
    progress?.criteria.percentage ||
    (() => {
      if (Array.isArray(goal.successCriteria)) {
        if (typeof goal.successCriteria[0] === 'string') {
          const completed = (goal.successCriteria as unknown as string[]).filter((c) =>
            c.includes('✓')
          ).length;
          const total = goal.successCriteria.length;
          return total > 0 ? Math.round((completed / total) * 100) : 0;
        }
        const completed = (goal.successCriteria as SuccessCriterion[]).filter(
          (c) => c.isCompleted
        ).length;
        const total = goal.successCriteria.length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      }
      return 0;
    })();

  const overallProgress = progress?.overall || criteriaProgress;

  const getUrgencyColor = () => {
    if (!daysRemaining) return 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    if (daysRemaining < 0)
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 animate-pulse';
    if (daysRemaining <= 7)
      return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
    if (daysRemaining <= 30)
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
  };

  const getHealthBadge = () => {
    const configs = {
      healthy: {
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        label: 'On Track',
      },
      at_risk: {
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        label: 'At Risk',
      },
      behind: {
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        label: 'Behind',
      },
      dormant: {
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
        label: 'Dormant',
      },
    };
    return configs[healthStatus];
  };

  const healthBadge = getHealthBadge();

  const handleQuickAction = (
    e: React.MouseEvent,
    action: 'add_task' | 'log_metric' | 'complete_criterion'
  ) => {
    e.stopPropagation();
    onQuickAction?.(action);
  };

  return (
    <motion.div
      layoutId={`goal-card-${goal.id}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(goal)}
      className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer min-h-[280px] flex flex-col"
    >
      {/* Header with Priority and Progress */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <PriorityIndicator priority={goal.priority} size="md" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {goal.timeHorizon}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${healthBadge.color}`}>
                {healthBadge.label}
              </span>
              {momentum === 'active' ? (
                <Zap className="w-3.5 h-3.5 text-amber-500" aria-label="Active" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-gray-400" aria-label="Dormant" />
              )}
            </div>
          </div>
        </div>
        <ProgressRing progress={overallProgress} size="md" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
        {goal.title}
      </h3>

      {/* Description */}
      <div className="mb-4 min-h-[2.5rem]">
        {goal.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {goal.description}
          </p>
        ) : (
          <div className="h-10" /> // Spacer to maintain consistent height
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap min-h-[1.75rem]">
        <AreaBadge area={goal.area} />
        {goal.subCategory && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {SUBCATEGORY_LABELS[goal.subCategory]}
          </span>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400 min-h-[1.25rem]">
        {linkedCounts.tasks > 0 && (
          <div className="flex items-center gap-1" title="Linked Tasks">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{linkedCounts.tasks}</span>
          </div>
        )}
        {linkedCounts.metrics > 0 && (
          <div className="flex items-center gap-1" title="Linked Metrics">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{linkedCounts.metrics}</span>
          </div>
        )}
        {linkedCounts.habits > 0 && (
          <div className="flex items-center gap-1" title="Linked Habits">
            <Repeat className="w-3.5 h-3.5" />
            <span>{linkedCounts.habits}</span>
          </div>
        )}
      </div>

      {/* Footer - push to bottom */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
        <StatusBadge status={goal.status} size="sm" />

        <div className="flex items-center gap-3 text-xs">
          {progress && progress.criteria.total > 0 && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {progress.criteria.completed}/{progress.criteria.total}
              </span>
            </div>
          )}
          {goal.targetDate && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{formatDateString(goal.targetDate) || ''}</span>
              {daysRemaining !== null && (
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${getUrgencyColor()}`}>
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)}d overdue`
                    : daysRemaining === 0
                      ? 'Due today'
                      : `${daysRemaining}d left`}
                </span>
              )}
            </div>
          )}
          {!goal.targetDate && daysRemaining !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getUrgencyColor()}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)}d overdue`
                  : daysRemaining === 0
                    ? 'Due today'
                    : `${daysRemaining}d left`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons (on hover) */}
      <AnimatePresence>
        {isHovered && onQuickAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 right-2 flex gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleQuickAction(e, 'add_task')}
              className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 transition-colors"
              title="Add Task"
            >
              <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleQuickAction(e, 'log_metric')}
              className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-500 transition-colors"
              title="Log Metric"
            >
              <Activity className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
