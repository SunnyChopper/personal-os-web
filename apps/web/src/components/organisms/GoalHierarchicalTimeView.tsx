import { useState, useMemo } from 'react';
import { ChevronLeft, Plus, Home, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal, GoalHealth, TimeHorizon, GoalProgressBreakdown } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { HealthBadge } from '@/components/atoms/HealthBadge';
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
      status: GoalHealth;
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

  const lastNav = navigationStack[navigationStack.length - 1];
  const activeGoal = lastNav?.type === 'goal' ? lastNav.goal : null;

  const getNextTimeHorizon = (currentHorizon: TimeHorizon): TimeHorizon | null => {
    const currentIndex = TIME_HORIZONS.indexOf(currentHorizon);
    return currentIndex < TIME_HORIZONS.length - 1 ? TIME_HORIZONS[currentIndex + 1] : null;
  };

  const activeGoalProgress = activeGoal ? goalsProgress.get(activeGoal.id) : undefined;
  const activeGoalLinkedCounts = activeGoal ? goalsLinkedCounts.get(activeGoal.id) : undefined;
  const activeGoalHealth = activeGoal ? goalsHealth.get(activeGoal.id) : undefined;
  const activeGoalNextHorizon = activeGoal ? getNextTimeHorizon(activeGoal.timeHorizon) : null;
  const activeGoalChildCount = activeGoal ? getChildCount(activeGoal.id) : 0;
  const canCreateActiveSubgoal =
    !!activeGoal &&
    !!onCreateSubgoal &&
    activeGoal.timeHorizon !== 'Daily' &&
    activeGoalNextHorizon !== null &&
    (activeGoalChildCount > 0 || currentLevelGoals.length === 0);

  return (
    <div className="space-y-4">
      {/* Breadcrumb — title lives here when drilled into a goal; no duplicate banner below */}
      <nav className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm" aria-label="Breadcrumb">
        <button
          onClick={() => handleBreadcrumbClick(-1)}
          className={`flex items-center gap-1 transition-colors ${
            navigationStack.length === 0
              ? 'font-semibold text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          title="Go to root"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>All Goals</span>
        </button>

        {navigationStack.map((navItem, index) => {
          const isLast = index === navigationStack.length - 1;
          const label = navItem.type === 'goal' ? navItem.goal.title : `${navItem.horizon} Goals`;

          return (
            <div key={index} className="flex items-center gap-2 min-w-0">
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {navItem.type === 'goal' && (
                    <span className="mr-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {navItem.goal.timeHorizon}
                    </span>
                  )}
                  {navItem.type === 'horizon' && (
                    <span className="mr-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {navItem.horizon}
                    </span>
                  )}
                  {label}
                </span>
              ) : (
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors truncate"
                >
                  {navItem.type === 'goal' && (
                    <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">
                      {navItem.goal.timeHorizon}
                    </span>
                  )}
                  {label}
                </button>
              )}
            </div>
          );
        })}

        {navigationStack.length > 0 && (
          <button
            onClick={handleNavigateBack}
            className="ml-auto flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
      </nav>

      {/* Compact parent context when viewing subgoals — metadata only, title is in breadcrumb */}
      {activeGoal && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <PriorityIndicator priority={activeGoal.priority} size="sm" />
            <AreaBadge area={activeGoal.area} />
            <StatusBadge status={activeGoal.status} size="sm" />
            {activeGoal.status === 'Active' && (activeGoal.health ?? activeGoalHealth?.status) && (
              <HealthBadge health={activeGoal.health ?? activeGoalHealth!.status} />
            )}
            {activeGoal.targetDate && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateString(activeGoal.targetDate)}
              </span>
            )}
            {activeGoalLinkedCounts && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {[
                  activeGoalLinkedCounts.tasks > 0 &&
                    `${activeGoalLinkedCounts.tasks} task${activeGoalLinkedCounts.tasks !== 1 ? 's' : ''}`,
                  activeGoalLinkedCounts.metrics > 0 &&
                    `${activeGoalLinkedCounts.metrics} metric${activeGoalLinkedCounts.metrics !== 1 ? 's' : ''}`,
                  activeGoalLinkedCounts.habits > 0 &&
                    `${activeGoalLinkedCounts.habits} habit${activeGoalLinkedCounts.habits !== 1 ? 's' : ''}`,
                  activeGoalLinkedCounts.projects > 0 &&
                    `${activeGoalLinkedCounts.projects} project${activeGoalLinkedCounts.projects !== 1 ? 's' : ''}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ProgressRing progress={activeGoalProgress?.overall || 0} size="md" />
            <button
              onClick={() => onGoalClick(activeGoal)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              View Details
            </button>
            {canCreateActiveSubgoal && activeGoalNextHorizon && (
              <button
                onClick={() => onCreateSubgoal(activeGoal)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add {activeGoalNextHorizon}
              </button>
            )}
          </div>
        </div>
      )}

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

                              <div className="absolute top-3 right-3 bg-blue-600 dark:bg-blue-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                              </div>
                            </div>

                            {/* Subgoal indicator */}
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <button
                                onClick={() => handleZoomInto(goal)}
                                className="flex-1 flex items-center justify-between px-3 py-2 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <span className="font-medium">
                                  {explicitChildCount > 0 ? (
                                    <>
                                      {explicitChildCount}{' '}
                                      {explicitChildCount === 1 ? 'subgoal' : 'subgoals'}
                                      {Object.keys(subgoalCounts).length > 0 && (
                                        <span className="text-xs ml-2 font-normal text-gray-500 dark:text-gray-400">
                                          (
                                          {Object.entries(subgoalCounts)
                                            .map(([h, c]) => `${c} ${h.toLowerCase()}`)
                                            .join(', ')}
                                          )
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    'View subgoals'
                                  )}
                                </span>
                                <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
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
