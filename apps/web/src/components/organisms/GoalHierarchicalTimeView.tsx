import { useState, useMemo } from 'react';
import { ChevronLeft, Plus, Home, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal, TimeHorizon, GoalProgressBreakdown } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { GoalCard } from '@/components/molecules/GoalCard';
import { formatDateString } from '@/utils/date-formatters';

interface GoalHierarchicalTimeViewProps {
  goals: Goal[];
  goalsProgress: Map<string, GoalProgressBreakdown>;
  goalsLinkedCounts: Map<
    string,
    { tasks: number; metrics: number; habits: number; projects: number }
  >;
  goalsHealth: Map<
    string,
    {
      status: 'healthy' | 'at_risk' | 'behind' | 'dormant';
      daysRemaining: number | null;
      momentum: 'active' | 'dormant';
    }
  >;
  onGoalClick: (goal: Goal) => void;
  onCreateSubgoal?: (parentGoal: Goal) => void;
}

const TIME_HORIZONS: TimeHorizon[] = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];

// Navigation can be by specific goal (drill into its children) OR by time horizon (show all goals at that horizon)
type NavigationItem = { type: 'goal'; goal: Goal } | { type: 'horizon'; horizon: TimeHorizon };

export function GoalHierarchicalTimeView({
  goals,
  goalsProgress,
  goalsLinkedCounts,
  goalsHealth,
  onGoalClick,
  onCreateSubgoal,
}: GoalHierarchicalTimeViewProps) {
  // Track navigation history for breadcrumb trail
  const [navigationStack, setNavigationStack] = useState<NavigationItem[]>([]);

  // Get child count for a goal (explicit children via parentGoalId)
  const getChildCount = (goalId: string): number => {
    return goals.filter((g) => g.parentGoalId === goalId).length;
  };

  // Get subgoal counts by horizon (explicit children only)
  const getSubgoalCounts = (goalId: string) => {
    const children = goals.filter((g) => g.parentGoalId === goalId);
    const counts: Partial<Record<TimeHorizon, number>> = {};

    children.forEach((child) => {
      counts[child.timeHorizon] = (counts[child.timeHorizon] || 0) + 1;
    });

    return counts;
  };

  // Get the next time horizon level (not used but kept for future reference)
  // const getNextHorizon = (currentHorizon: TimeHorizon): TimeHorizon | null => {
  //   const currentIndex = TIME_HORIZONS.indexOf(currentHorizon);
  //   return currentIndex < TIME_HORIZONS.length - 1 ? TIME_HORIZONS[currentIndex + 1] : null;
  // };

  // Zoom into a goal (drill down by explicit children OR by time horizon)
  // This shows the goal details AND its subgoals in one view
  const handleZoomInto = (goal: Goal) => {
    // Always show goal details when zooming in
    setNavigationStack((prev) => [...prev, { type: 'goal', goal }]);
  };

  // Navigate back one level
  const handleNavigateBack = () => {
    setNavigationStack((prev) => prev.slice(0, -1));
  };

  // Navigate to a specific level in breadcrumb
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go to root
      setNavigationStack([]);
    } else {
      setNavigationStack((prev) => prev.slice(0, index + 1));
    }
  };

  // Get goals to display at current level
  const currentLevelGoals = useMemo(() => {
    if (navigationStack.length === 0) {
      // Root level - show ALL parent goals (goals without a parentGoalId), regardless of timeHorizon
      return goals.filter((g) => !g.parentGoalId);
    }

    const lastNav = navigationStack[navigationStack.length - 1];

    if (lastNav.type === 'goal') {
      // Showing children of a specific goal
      return goals.filter((g) => g.parentGoalId === lastNav.goal.id);
    } else {
      // Showing all goals at a specific time horizon
      return goals.filter((g) => g.timeHorizon === lastNav.horizon && !g.parentGoalId);
    }
  }, [goals, navigationStack]);

  // Group by time horizon and sort by due date (earliest first)
  const groupedGoals = useMemo(() => {
    return TIME_HORIZONS.reduce(
      (acc, horizon) => {
        const horizonGoals = currentLevelGoals.filter((g) => g.timeHorizon === horizon);
        // Sort by targetDate: goals with dates first (earliest first), then goals without dates
        acc[horizon] = horizonGoals.sort((a, b) => {
          if (!a.targetDate && !b.targetDate) return 0;
          if (!a.targetDate) return 1; // Goals without dates go to end
          if (!b.targetDate) return -1; // Goals with dates come first
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        });
        return acc;
      },
      {} as Record<TimeHorizon, Goal[]>
    );
  }, [currentLevelGoals]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div
        className={`rounded-lg p-4 border-2 transition-colors ${
          navigationStack.length > 0
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              navigationStack.length === 0
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700'
            }`}
            title="Go to root"
          >
            <Home className="w-4 h-4" />
            <span>All Goals</span>
          </button>

          {navigationStack.map((navItem, index) => {
            const isLast = index === navigationStack.length - 1;
            const label = navItem.type === 'goal' ? navItem.goal.title : `${navItem.horizon} Goals`;

            return (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isLast
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700'
                  }`}
                >
                  {navItem.type === 'horizon' && (
                    <span className="text-xs mr-1 opacity-70">[{navItem.horizon}]</span>
                  )}
                  {label}
                </button>
              </div>
            );
          })}

          {navigationStack.length > 0 && (
            <button
              onClick={handleNavigateBack}
              className="ml-auto flex items-center gap-1 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-300 dark:border-blue-700 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Current Context Info */}
        {navigationStack.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            {(() => {
              const lastNav = navigationStack[navigationStack.length - 1];
              if (lastNav.type === 'goal') {
                const explicitChildCount = getChildCount(lastNav.goal.id);
                if (explicitChildCount > 0) {
                  return (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        📂 Viewing subgoals of:
                      </span>
                      <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm font-semibold">
                        {lastNav.goal.timeHorizon}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {lastNav.goal.title}
                      </span>
                    </div>
                  );
                }
              } else if (lastNav.type === 'horizon') {
                return (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      📊 Showing all {lastNav.horizon.toLowerCase()} goals
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Show Goal Details when viewing a specific goal's subgoals */}
      {(() => {
        const lastNav = navigationStack[navigationStack.length - 1];
        if (lastNav && lastNav.type === 'goal') {
          const goal = lastNav.goal;
          const progress = goalsProgress.get(goal.id);
          const linkedCounts = goalsLinkedCounts.get(goal.id);
          const health = goalsHealth.get(goal.id);
          const overallProgress = progress?.overall || 0;
          const explicitChildCount = getChildCount(goal.id);

          // Get the next time horizon (one level lower)
          const getNextTimeHorizon = (currentHorizon: TimeHorizon): TimeHorizon | null => {
            const currentIndex = TIME_HORIZONS.indexOf(currentHorizon);
            return currentIndex < TIME_HORIZONS.length - 1 ? TIME_HORIZONS[currentIndex + 1] : null;
          };

          const nextHorizon = getNextTimeHorizon(goal.timeHorizon);
          const canCreateSubgoal =
            explicitChildCount > 0 &&
            goal.timeHorizon !== 'Daily' &&
            nextHorizon !== null &&
            onCreateSubgoal;

          return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <PriorityIndicator priority={goal.priority} size="md" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {goal.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <AreaBadge area={goal.area} />
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {goal.timeHorizon}
                    </span>
                    <StatusBadge status={goal.status} size="sm" />
                    {health?.status && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          health.status === 'healthy'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : health.status === 'at_risk'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : health.status === 'behind'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {health.status === 'healthy'
                          ? 'On Track'
                          : health.status === 'at_risk'
                            ? 'At Risk'
                            : health.status === 'behind'
                              ? 'Behind'
                              : 'Dormant'}
                      </span>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {goal.description}
                    </p>
                  )}
                  {goal.targetDate && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Due:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDateString(goal.targetDate) || ''}
                        </span>
                      </div>
                    </div>
                  )}
                  {linkedCounts && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {linkedCounts.tasks > 0 && (
                        <span>
                          {linkedCounts.tasks} task{linkedCounts.tasks !== 1 ? 's' : ''}
                        </span>
                      )}
                      {linkedCounts.metrics > 0 && (
                        <span>
                          {linkedCounts.metrics} metric{linkedCounts.metrics !== 1 ? 's' : ''}
                        </span>
                      )}
                      {linkedCounts.habits > 0 && (
                        <span>
                          {linkedCounts.habits} habit{linkedCounts.habits !== 1 ? 's' : ''}
                        </span>
                      )}
                      {linkedCounts.projects > 0 && (
                        <span>
                          {linkedCounts.projects} project{linkedCounts.projects !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <ProgressRing progress={overallProgress} size="lg" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Progress</p>
                  </div>
                  <button
                    onClick={() => onGoalClick(goal)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Quick Create Subgoal Button */}
              {canCreateSubgoal && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => onCreateSubgoal(goal)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create {nextHorizon} Subgoal</span>
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Quickly create a {nextHorizon?.toLowerCase()} goal one timeframe lower
                  </p>
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Goals at Current Level */}
      {currentLevelGoals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {(() => {
              if (navigationStack.length === 0) return 'No goals found at this level';
              const lastNav = navigationStack[navigationStack.length - 1];
              if (lastNav.type === 'goal') {
                return `No subgoals found for "${lastNav.goal.title}"`;
              } else {
                return `No ${lastNav.horizon.toLowerCase()} goals found`;
              }
            })()}
          </p>
          {(() => {
            if (!onCreateSubgoal || navigationStack.length === 0) return null;
            const lastNav = navigationStack[navigationStack.length - 1];
            if (lastNav.type === 'goal') {
              return (
                <button
                  onClick={() => onCreateSubgoal(lastNav.goal)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Subgoal
                </button>
              );
            }
            return null;
          })()}
        </div>
      ) : (
        <div className="space-y-8">
          {TIME_HORIZONS.map((horizon) => {
            const horizonGoals = groupedGoals[horizon];
            if (horizonGoals.length === 0) return null;

            return (
              <div key={horizon}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    {horizon}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({horizonGoals.length} {horizonGoals.length === 1 ? 'goal' : 'goals'})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {horizonGoals.map((goal) => {
                    const progress = goalsProgress.get(goal.id);
                    const linkedCounts = goalsLinkedCounts.get(goal.id);
                    const health = goalsHealth.get(goal.id);
                    const explicitChildCount = getChildCount(goal.id);
                    const subgoalCounts = getSubgoalCounts(goal.id);

                    // All goals support drill-down to show unified view of goal details + subgoals

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="relative group">
                          {/* All goals support drill-down to show details + subgoals */}
                          <div>
                            {/* Overlay indicator for drill-down */}
                            <div className="absolute -inset-0.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-blue-500/50 dark:border-blue-400/50" />

                            {/* Click to drill down */}
                            <div
                              onClick={() => handleZoomInto(goal)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleZoomInto(goal);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`Zoom into goal: ${goal.title}`}
                              className="cursor-pointer relative"
                            >
                              <GoalCard
                                goal={goal}
                                onClick={() => {}} // Prevent default card click
                                progress={progress}
                                linkedCounts={linkedCounts}
                                healthStatus={health?.status}
                                daysRemaining={health?.daysRemaining}
                                momentum={health?.momentum}
                              />

                              {/* Zoom indicator badge on card */}
                              <div className="absolute top-3 right-3 bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Zoom In</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>

                            {/* Subgoal indicator */}
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <button
                                onClick={() => handleZoomInto(goal)}
                                className="flex-1 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 text-blue-700 dark:text-blue-400 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/40 rounded-lg transition-all border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow"
                              >
                                <span className="font-semibold">
                                  {explicitChildCount > 0 ? (
                                    <>
                                      {explicitChildCount}{' '}
                                      {explicitChildCount === 1 ? 'subgoal' : 'subgoals'}
                                      {Object.keys(subgoalCounts).length > 0 && (
                                        <span className="text-xs ml-2 font-normal">
                                          (
                                          {Object.entries(subgoalCounts)
                                            .map(([h, c]) => `${c} ${h.toLowerCase()}`)
                                            .join(', ')}
                                          )
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    'View goal details'
                                  )}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">View</span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </button>
                              {onCreateSubgoal && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateSubgoal(goal);
                                  }}
                                  className="px-3 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                  title="Add subgoal"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
