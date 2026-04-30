import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type {
  Goal,
  Task,
  Metric,
  MetricLog,
  Habit,
  EntitySummary,
  GoalProgressBreakdown,
  SuccessCriterion,
} from '@/types/growth-system';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import Button from '@/components/atoms/Button';
import { GoalProgressDashboard } from '@/components/molecules/GoalProgressDashboard';
import { GoalTasksSection } from '@/components/molecules/GoalTasksSection';
import { GoalMetricsSection } from '@/components/molecules/GoalMetricsSection';
import { GoalHabitsSection } from '@/components/molecules/GoalHabitsSection';
import { SuccessCriteriaList } from '@/components/molecules/SuccessCriteriaList';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';
import { goalProgressService } from '@/services/growth-system/goal-progress.service';
import { formatDateString } from '@/utils/date-formatters';

interface MetricWithLogs {
  metric: Metric;
  latestLog: MetricLog | null;
  progress: number;
}

interface HabitWithStreak {
  habit: Habit;
  currentStreak: number;
  completedToday: boolean;
  weeklyProgress: number;
}

// Animation variants for mobile UI enhancements
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: 'blur(4px)' },
  show: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const headerVariants = {
  hidden: { y: -20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

interface GoalDetailViewProps {
  goal: Goal;
  tasks: Task[];
  metrics: MetricWithLogs[];
  habits: HabitWithStreak[];
  projects: EntitySummary[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleCriterion?: (criterionId: string, isCompleted: boolean) => void;
  onUpdateCriterion?: (criterionId: string, updates: Partial<SuccessCriterion>) => void;
  onAddTask?: () => void;
  onLinkMetric?: () => void;
  onLinkHabit?: () => void;
  onCompleteHabit?: (habitId: string) => void;
  onLogMetric?: (metricId: string) => void;
}

export function GoalDetailView({
  goal,
  tasks,
  metrics,
  habits,
  projects,
  onBack,
  onEdit,
  onDelete,
  onToggleCriterion,
  onUpdateCriterion,
  onAddTask,
  onLinkMetric,
  onLinkHabit,
  onCompleteHabit,
  onLogMetric,
}: GoalDetailViewProps) {
  const [progress, setProgress] = useState<GoalProgressBreakdown | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);

  // Use refs to store latest values for use in effect without causing re-renders
  const latestValuesRef = useRef({ goal, tasks, metrics, habits });
  latestValuesRef.current = { goal, tasks, metrics, habits };

  // Create stable ID arrays for dependency tracking to avoid infinite loops
  const taskIds = useMemo(
    () =>
      tasks
        .map((t) => t.id)
        .sort()
        .join(','),
    [tasks]
  );
  const metricIds = useMemo(
    () =>
      metrics
        .map((m) => m.metric.id)
        .sort()
        .join(','),
    [metrics]
  );
  const habitIds = useMemo(
    () =>
      habits
        .map((h) => h.habit.id)
        .sort()
        .join(','),
    [habits]
  );
  const successCriteriaHash = useMemo(() => {
    if (!goal.successCriteria || goal.successCriteria.length === 0) return '';
    return JSON.stringify(
      goal.successCriteria.map((c): { id: string; isCompleted: boolean } => {
        if (typeof c === 'string') {
          const str = c as string;
          return { id: str, isCompleted: str.includes('✓') };
        }
        const criterion = c as SuccessCriterion;
        return { id: criterion.id, isCompleted: criterion.isCompleted };
      })
    );
  }, [goal.successCriteria]);

  useEffect(() => {
    const loadProgress = async () => {
      setIsLoadingProgress(true);
      try {
        // Get latest values from ref to ensure we use current props
        const {
          goal: currentGoal,
          tasks: currentTasks,
          metrics: currentMetrics,
          habits: currentHabits,
        } = latestValuesRef.current;

        // Pass goal object and tasks, metrics, and habits to avoid API calls - they're already filtered from cache
        const metricsArray = currentMetrics.map((m) => m.metric);
        const habitsArray = currentHabits.map((h) => h.habit);
        const progressData = await goalProgressService.computeProgress(
          currentGoal,
          currentTasks,
          metricsArray,
          habitsArray
        );
        setProgress(progressData);
      } catch (error) {
        console.error('Failed to compute progress:', error);
        // Fallback to basic criteria-based progress
        const { goal: currentGoal } = latestValuesRef.current;
        const criteriaProgress = goalProgressService.calculateCriteriaProgress(
          currentGoal.successCriteria
        );
        setProgress({
          overall: criteriaProgress.percentage,
          criteria: criteriaProgress,
          tasks: { completed: 0, total: 0, percentage: 0 },
          metrics: { atTarget: 0, total: 0, percentage: 0 },
          habits: { streakDays: 0, consistency: 0 },
        });
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress();
  }, [goal.id, successCriteriaHash, taskIds, metricIds, habitIds]);

  // Swipe gesture handler for mobile
  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe left to go back (mobile only)
    if (info.offset.x < -100 && Math.abs(info.offset.y) < 50) {
      onBack();
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 md:!drag-none"
      style={
        {
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        } as React.CSSProperties
      }
      drag={typeof window !== 'undefined' && window.innerWidth < 768 ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          handleSwipe(e as MouseEvent | TouchEvent | PointerEvent, info);
        }
      }}
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 lg:py-8">
        {/* Back Button - Enhanced for mobile */}
        <motion.button
          variants={headerVariants}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={onBack}
          className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 lg:mb-8 transition-colors min-h-[44px] min-w-[44px] -m-2 p-2 touch-manipulation"
          aria-label="Back to Goals"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
          <span className="text-sm sm:text-base lg:text-lg font-medium">Back to Goals</span>
        </motion.button>

        {/* Header Card - Enhanced desktop layout with better horizontal space */}
        <motion.div
          layoutId={`goal-card-${goal.id}`}
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 xl:p-10 mb-4 sm:mb-6 lg:mb-8 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Top Section: Title, Context, Actions - Simplified desktop layout */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <motion.div variants={itemVariants} className="flex items-center gap-2 mb-2">
                <PriorityIndicator priority={goal.priority} size="md" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white break-words leading-tight">
                  {goal.title}
                </h1>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="font-medium">{goal.area}</span>
                {goal.subCategory && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span>{SUBCATEGORY_LABELS[goal.subCategory]}</span>
                  </>
                )}
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span>{goal.timeHorizon}</span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="capitalize">{goal.status.toLowerCase()}</span>
              </motion.div>
              {goal.description && (
                <motion.p
                  variants={itemVariants}
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  {goal.description}
                </motion.p>
              )}
            </div>

            {/* Action Buttons - Horizontal layout */}
            <motion.div variants={itemVariants} className="flex flex-row gap-2 flex-shrink-0">
              <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onEdit}
                  className="min-h-[44px] touch-manipulation"
                >
                  <Edit2 className="w-4 h-4 mr-1.5" strokeWidth={2} />
                  <span className="text-sm">Edit</span>
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDelete}
                  className="hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-900/30 dark:hover:!text-red-400 min-h-[44px] touch-manipulation"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" strokeWidth={2} />
                  <span className="text-sm">Delete</span>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Desktop: Enhanced two-column layout for metadata and criteria with better spacing */}
          {goal.successCriteria && goal.successCriteria.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8 xl:gap-10 pt-4 sm:pt-6 lg:pt-8 border-t border-gray-200 dark:border-gray-700">
              {/* Left Column: Target Date & Notes - Takes 2/5 on desktop */}
              <div className="xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8 xl:border-r border-gray-200 dark:border-gray-700 xl:pr-6 lg:pr-8">
                {goal.targetDate && (
                  <motion.div variants={itemVariants}>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                      Target Date
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDateString(goal.targetDate, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </motion.div>
                )}

                {goal.notes && (
                  <motion.div
                    variants={itemVariants}
                    className={goal.targetDate ? 'pt-4 sm:pt-6 lg:pt-8' : ''}
                  >
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Notes
                    </h3>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                      {goal.notes}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Success Criteria - Takes 3/5 on desktop */}
              <motion.div variants={itemVariants} className="xl:col-span-3 xl:pl-6 lg:pl-8">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 lg:mb-6">
                  Success Criteria
                </h3>
                <SuccessCriteriaList
                  criteria={goal.successCriteria as SuccessCriterion[]}
                  onToggleComplete={onToggleCriterion}
                  onUpdateCriterion={onUpdateCriterion}
                  editable={true}
                />
              </motion.div>
            </div>
          ) : (
            /* Single column layout when no success criteria */
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 pt-4 sm:pt-6 lg:pt-8 border-t border-gray-200 dark:border-gray-700 max-w-3xl">
              {goal.targetDate && (
                <motion.div variants={itemVariants}>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                    Target Date
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDateString(goal.targetDate, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </motion.div>
              )}

              {goal.notes && (
                <motion.div
                  variants={itemVariants}
                  className={goal.targetDate ? 'pt-4 sm:pt-6 lg:pt-8' : ''}
                >
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Notes
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {goal.notes}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Progress Dashboard - Full width, grid-like feel */}
        <AnimatePresence mode="wait">
          {isLoadingProgress ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-4 sm:mb-6 lg:mb-8 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 shadow-sm"
            >
              {/* Skeleton loader matching GoalProgressDashboard geometry */}
              <div className="space-y-6 lg:space-y-8">
                <div className="flex items-center justify-between">
                  <div className="h-6 lg:h-7 w-32 lg:w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-8 lg:h-10 w-24 lg:w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="space-y-4 lg:space-y-6">
                  <div className="h-4 lg:h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 lg:h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : progress ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              variants={itemVariants}
              className="mb-4 sm:mb-6 lg:mb-8"
            >
              <GoalProgressDashboard progress={progress} showBreakdown={true} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Entity Sections Grid - Grid-like feel: 2x2 layout on desktop with equal heights */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 auto-rows-fr"
        >
          {/* Tasks Section */}
          <motion.div variants={itemVariants} className="h-full">
            <div className="h-full">
              <GoalTasksSection tasks={tasks} onAddTask={onAddTask} showEmpty={true} />
            </div>
          </motion.div>

          {/* Metrics Section */}
          <motion.div variants={itemVariants} className="h-full">
            <div className="h-full">
              <GoalMetricsSection
                metrics={metrics}
                onLinkMetric={onLinkMetric}
                onLogMetric={onLogMetric}
                showEmpty={true}
              />
            </div>
          </motion.div>

          {/* Habits Section */}
          <motion.div variants={itemVariants} className="h-full">
            <div className="h-full">
              <GoalHabitsSection
                habits={habits}
                onLinkHabit={onLinkHabit}
                onCompleteHabit={onCompleteHabit}
                showEmpty={true}
              />
            </div>
          </motion.div>

          {/* Projects Section */}
          <motion.div
            variants={itemVariants}
            className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">
              Projects ({projects.length})
            </h3>
            <div className="flex-1 flex flex-col">
              {projects.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer min-h-[44px] touch-manipulation"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white break-words flex-1">
                          {project.title}
                        </p>
                        <span className="text-xs sm:text-sm px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex-shrink-0">
                          {project.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 flex-1 flex flex-col justify-center">
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-2">
                    No projects linked
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                    Link projects that contribute to achieving this goal
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile: Expandable Breakdown Section */}
        <AnimatePresence>
          {isBreakdownExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 overflow-hidden"
            >
              {progress && <GoalProgressDashboard progress={progress} showBreakdown={true} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: Toggle Button for Breakdown */}
        {progress && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
            className="md:hidden w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-center justify-between min-h-[44px] touch-manipulation"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {isBreakdownExpanded ? 'Hide' : 'Show'} Progress Breakdown
            </span>
            <motion.div
              animate={{ rotate: isBreakdownExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
            </motion.div>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
