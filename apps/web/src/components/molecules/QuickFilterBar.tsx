import { AlertCircle, Clock, Activity, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal } from '@/types/growth-system';

type QuickFilter =
  | 'at_risk'
  | 'due_this_week'
  | 'needs_attention'
  | 'recently_completed'
  | 'dormant';

interface QuickFilterBarProps {
  goals: Goal[];
  activeFilters: QuickFilter[];
  onFilterToggle: (filter: QuickFilter) => void;
  onClearFilters?: () => void;
}

interface FilterConfig {
  id: QuickFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count: (goals: Goal[]) => number;
  filter: (goal: Goal) => boolean;
}

export function QuickFilterBar({
  goals,
  activeFilters,
  onFilterToggle,
  onClearFilters,
}: QuickFilterBarProps) {
  const now = new Date();

  const filterConfigs: FilterConfig[] = [
    {
      id: 'at_risk',
      label: 'At Risk',
      icon: AlertCircle,
      color:
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
      count: (goals) => goals.filter((g) => g.status === 'At Risk').length,
      filter: (goal) => goal.status === 'At Risk',
    },
    {
      id: 'due_this_week',
      label: 'Due This Week',
      icon: Clock,
      color:
        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800',
      count: (goals) => {
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return goals.filter((g) => {
          if (!g.targetDate) return false;
          const target = new Date(g.targetDate);
          return target >= now && target <= oneWeekFromNow;
        }).length;
      },
      filter: (goal) => {
        if (!goal.targetDate) return false;
        const target = new Date(goal.targetDate);
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return target >= now && target <= oneWeekFromNow;
      },
    },
    {
      id: 'needs_attention',
      label: 'Needs Attention',
      icon: AlertCircle,
      color:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
      count: (goals) => {
        return goals.filter((g) => {
          const lastActivity = g.lastActivityAt
            ? new Date(g.lastActivityAt)
            : new Date(g.createdAt);
          const daysSinceActivity = Math.ceil(
            (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceActivity > 7 && g.status === 'Active';
        }).length;
      },
      filter: (goal) => {
        const lastActivity = goal.lastActivityAt
          ? new Date(goal.lastActivityAt)
          : new Date(goal.createdAt);
        const daysSinceActivity = Math.ceil(
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceActivity > 7 && goal.status === 'Active';
      },
    },
    {
      id: 'dormant',
      label: 'Dormant',
      icon: Activity,
      color:
        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600',
      count: (goals) => {
        return goals.filter((g) => {
          const lastActivity = g.lastActivityAt
            ? new Date(g.lastActivityAt)
            : new Date(g.createdAt);
          const daysSinceActivity = Math.ceil(
            (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceActivity > 14;
        }).length;
      },
      filter: (goal) => {
        const lastActivity = goal.lastActivityAt
          ? new Date(goal.lastActivityAt)
          : new Date(goal.createdAt);
        const daysSinceActivity = Math.ceil(
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceActivity > 14;
      },
    },
    {
      id: 'recently_completed',
      label: 'Recently Completed',
      icon: Activity,
      color:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800',
      count: (goals) => {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return goals.filter((g) => {
          if (!g.completedDate) return false;
          const completed = new Date(g.completedDate);
          return completed >= sevenDaysAgo;
        }).length;
      },
      filter: (goal) => {
        if (!goal.completedDate) return false;
        const completed = new Date(goal.completedDate);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return completed >= sevenDaysAgo;
      },
    },
  ];

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Filters:</span>

      {filterConfigs.map((config, index) => {
        const Icon = config.icon;
        const count = config.count(goals);
        const isActive = activeFilters.includes(config.id);

        if (count === 0 && !isActive) return null;

        return (
          <motion.button
            key={config.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onFilterToggle(config.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isActive
                ? `${config.color} ring-2 ring-offset-2 dark:ring-offset-gray-900`
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{config.label}</span>
            {count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}

      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
