import { CheckSquare, TrendingUp, BarChart3, Repeat, FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GoalProgressBreakdown } from '@/types/growth-system';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import {
  buildGoalProgressOverview,
  type GoalProgressFactorKey,
  type GoalProgressOverviewSourceItems,
} from '@/utils/goal-progress-overview';

const FACTOR_ICONS: Record<GoalProgressFactorKey, typeof CheckSquare> = {
  criteria: CheckSquare,
  tasks: TrendingUp,
  metrics: BarChart3,
  habits: Repeat,
  projects: FolderKanban,
};

interface GoalProgressDashboardProps {
  progress: GoalProgressBreakdown;
  showBreakdown?: boolean;
  sourceItems?: GoalProgressOverviewSourceItems;
}

export function GoalProgressDashboard({
  progress,
  showBreakdown = true,
  sourceItems,
}: GoalProgressDashboardProps) {
  const overview = buildGoalProgressOverview(progress, sourceItems);
  const { factors, totalWeight, formulaLabel, manualOverride } = overview;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Progress Overview
      </h3>

      <div className="flex flex-col lg:flex-row lg:gap-6 space-y-4 lg:space-y-0">
        {/* Left Column: Overall Progress Ring and Bar */}
        <div className="flex-1 flex flex-col lg:justify-center">
          <div className="flex flex-col items-center mb-4">
            <ProgressRing progress={progress.overall} size="xl" showLabel color="blue" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Overall Progress</p>
            {manualOverride != null && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Manual override: {manualOverride}%
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Progress Sources
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{progress.overall}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              {factors.map((factor, index) => {
                const sliceWidth = totalWeight > 0 ? (factor.weight / totalWeight) * 100 : 0;
                const fillPct = factor.slicePct;
                return (
                  <motion.div
                    key={factor.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${sliceWidth}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="h-full first:rounded-l-full last:rounded-r-full overflow-hidden flex-shrink-0"
                    title={`${factor.label}: ${factor.slicePct}% (weight ${factor.weight}%)`}
                  >
                    <div className={`h-full ${factor.color}`} style={{ width: `${fillPct}%` }} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Column: Breakdown Cards Grid */}
        {showBreakdown && factors.length > 0 && (
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-2.5">
              {factors.map((factor, index) => {
                const Icon = FACTOR_ICONS[factor.key];
                return (
                  <motion.div
                    key={factor.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {factor.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                        Weight {factor.weight}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {factor.slicePct}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {factor.detail}
                    </p>
                    <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.slicePct}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                        className={`h-full ${factor.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Column: Calculation breakdown */}
        {showBreakdown && factors.length > 0 && (
          <div className="flex-1 lg:max-w-sm border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-600 pt-4 lg:pt-0 lg:pl-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              How this is calculated
            </h4>
            {manualOverride != null ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                Overall progress uses manual override ({manualOverride}%). Weighted breakdown below
                is shown for reference.
              </p>
            ) : null}
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-3 break-words">
              {formulaLabel} = {progress.overall}%
            </p>
            <ul className="space-y-3">
              {factors.map((factor) => (
                <li key={factor.key}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {factor.label}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
                      +{factor.contributionPts} pts
                    </span>
                  </div>
                  {factor.items.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {factor.items.map((item, idx) => (
                        <li
                          key={`${factor.key}-${idx}`}
                          className="flex items-start justify-between gap-2 text-xs text-gray-600 dark:text-gray-400"
                        >
                          <span className="text-gray-800 dark:text-gray-200 truncate">
                            {item.title}
                          </span>
                          <span className="flex-shrink-0">{item.detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                      {factor.detail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
