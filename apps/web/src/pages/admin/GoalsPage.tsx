import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Target,
  LayoutGrid,
  Layers,
  Calendar,
  Kanban,
  Filter,
  X,
  Network,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalStatus,
  EntitySummary,
  FilterOptions,
  GoalProgressBreakdown,
  Task,
  Metric,
  MetricLog,
  Habit,
  Priority,
  Area,
} from '@/types/growth-system';
import type { ApiError } from '@/types/api-contracts';
import { goalsService } from '@/services/growth-system/goals.service';
import { goalProgressService } from '@/services/growth-system/goal-progress.service';
import { useTasks, useProjects, useMetrics, useHabits, useGoals } from '@/hooks/useGrowthSystem';
import { useQueryClient } from '@tanstack/react-query';
import { upsertGoalCache } from '@/lib/react-query/growth-system-cache';
import {
  getTasksByGoal,
  getProjectsByGoal,
  getMetricsByGoal,
  getHabitsByGoal,
} from '@/utils/growth-system-filters';
import Button from '@/components/atoms/Button';
import { GoalCard } from '@/components/molecules/GoalCard';
import { QuickFilterBar } from '@/components/molecules/QuickFilterBar';
import { BulkActionsBar } from '@/components/molecules/BulkActionsBar';
import { GoalCreateForm } from '@/components/organisms/GoalCreateForm';
import { GoalEditForm } from '@/components/organisms/GoalEditForm';
import { GoalDetailView } from '@/components/organisms/GoalDetailView';
import { GoalKanbanView } from '@/components/organisms/GoalKanbanView';
import { GoalTimelineView } from '@/components/organisms/GoalTimelineView';
import { GoalHierarchicalTimeView } from '@/components/organisms/GoalHierarchicalTimeView';
import { GoalMindmapView } from '@/components/organisms/GoalMindmapView';
import { GoalMindmapLoadingSkeleton } from '@/components/organisms/GoalMindmapLoadingSkeleton';
import Dialog from '@/components/molecules/Dialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { CelebrationEffect } from '@/components/atoms/CelebrationEffect';
import { GOAL_STATUSES, AREAS, PRIORITIES, AREA_LABELS } from '@/constants/growth-system';
import { migrateGoals, needsMigration } from '@/utils/goal-migration';
import { getStorageAdapter } from '@/lib/storage';

const STATUSES: GoalStatus[] = [...GOAL_STATUSES];
const AREA_OPTIONS: Area[] = [...AREAS];
const PRIORITY_OPTIONS: Priority[] = [...PRIORITIES];

type ViewMode = 'timeHorizon' | 'area' | 'kanban' | 'timeline' | 'mindmap';

// Animation variants for mobile UI enhancements
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
  },
};

const filterPanelVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
  show: {
    opacity: 1,
    height: 'auto',
    marginBottom: '1rem',
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
};
type QuickFilter =
  | 'at_risk'
  | 'due_this_week'
  | 'needs_attention'
  | 'recently_completed'
  | 'dormant';

export default function GoalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewMode, setViewMode] = useState<ViewMode>('mindmap');
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get cached data from React Query hooks
  const queryClient = useQueryClient();
  const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { tasks: allTasks } = useTasks();
  const { projects: allProjects } = useProjects();
  const { metrics: allMetrics } = useMetrics();
  const { habits: allHabits } = useHabits();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [parentGoalForSubgoal, setParentGoalForSubgoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [createError, setCreateError] = useState<string | ApiError | null>(null);

  const [goalProjects, setGoalProjects] = useState<Map<string, EntitySummary[]>>(new Map());
  const [goalTasks, setGoalTasks] = useState<Map<string, Task[]>>(new Map());
  const [goalMetrics, setGoalMetrics] = useState<Map<string, Metric[]>>(new Map());
  const [goalMetricLogs, setGoalMetricLogs] = useState<Map<string, MetricLog[]>>(new Map());
  const [goalHabits, setGoalHabits] = useState<Map<string, Habit[]>>(new Map());
  const [goalsProgress, setGoalsProgress] = useState<Map<string, GoalProgressBreakdown>>(new Map());
  const [goalsLinkedCounts, setGoalsLinkedCounts] = useState<
    Map<string, { tasks: number; metrics: number; habits: number; projects: number }>
  >(new Map());
  const [goalsHealth, setGoalsHealth] = useState<
    Map<
      string,
      {
        status: 'healthy' | 'at_risk' | 'behind' | 'dormant';
        daysRemaining: number | null;
        momentum: 'active' | 'dormant';
      }
    >
  >(new Map());

  type CelebrationType =
    | 'goal_achieved'
    | 'criteria_completed'
    | 'milestone_25'
    | 'milestone_50'
    | 'milestone_75'
    | 'streak';
  const [celebration, setCelebration] = useState<{
    show: boolean;
    type: CelebrationType;
    message?: string;
  }>({ show: false, type: 'milestone_25' });

  // Track which goals are currently loading to prevent duplicate loads
  const loadingGoalsRef = useRef<Set<string>>(new Set());

  // Use refs to store latest values without causing callback recreation
  const allTasksRef = useRef(allTasks);
  const allProjectsRef = useRef(allProjects);
  const allMetricsRef = useRef(allMetrics);
  const allHabitsRef = useRef(allHabits);

  // Keep refs in sync with latest values
  useEffect(() => {
    allTasksRef.current = allTasks;
    allProjectsRef.current = allProjects;
    allMetricsRef.current = allMetrics;
    allHabitsRef.current = allHabits;
  }, [allTasks, allProjects, allMetrics, allHabits]);

  const loadGoalData = useCallback(async (goalId: string, goal?: Goal) => {
    // Prevent duplicate concurrent loads of the same goal
    if (loadingGoalsRef.current.has(goalId)) {
      return;
    }

    loadingGoalsRef.current.add(goalId);

    try {
      // Parse tasks, projects, metrics, and habits from cached data instead of making API calls
      // Use refs to get latest values without including them in dependencies
      const tasks = getTasksByGoal(allTasksRef.current, goalId);
      const projects = getProjectsByGoal(allProjectsRef.current, goalId);
      const metrics = getMetricsByGoal(allMetricsRef.current, goalId);
      const habits = getHabitsByGoal(allHabitsRef.current, goalId);

      // Store linked entities (always store tasks, habits, even if empty, to indicate we've loaded them)
      setGoalTasks((prev) => new Map(prev).set(goalId, tasks));
      setGoalHabits((prev) => new Map(prev).set(goalId, habits));

      // Always store metrics (even if empty) to indicate we've loaded them
      setGoalMetrics((prev) => new Map(prev).set(goalId, metrics));

      // Load metric logs once for all metrics (optimization: load all logs once, not per metric)
      if (metrics.length > 0) {
        const storage = getStorageAdapter();
        const allLogs = await storage.getAll<MetricLog>('metricLogs');

        // Filter and sort logs for each metric
        for (const metric of metrics) {
          const metricLogs = allLogs
            .filter((log) => log.metricId === metric.id)
            .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
          if (metricLogs.length > 0) {
            setGoalMetricLogs((prev) => new Map(prev).set(metric.id, metricLogs));
          }
        }
      }

      // Always store projects (even if empty) to indicate we've loaded them
      // Convert to EntitySummary
      const projectEntities: EntitySummary[] = projects.map((project) => ({
        id: project.id,
        title: project.name,
        type: 'project',
        area: project.area,
        status: project.status,
      }));
      setGoalProjects((prev) => new Map(prev).set(goalId, projectEntities));

      // Calculate linked counts from data we already have (avoid duplicate API calls)
      const counts = {
        tasks: tasks.length,
        metrics: metrics.length,
        habits: habits.length,
        projects: projects.length,
      };
      setGoalsLinkedCounts((prev) => new Map(prev).set(goalId, counts));

      // Use the goal we already have instead of fetching again
      let goalForHealth = goal;
      if (!goalForHealth) {
        // Only fetch if we don't have it
        const goalResponse = await goalsService.getById(goalId);
        if (!goalResponse.success || !goalResponse.data) {
          return;
        }
        goalForHealth = goalResponse.data;
      }

      // Compute progress using data we already fetched (avoid duplicate API calls)
      const weights = goalForHealth.progressConfig || {
        criteriaWeight: 40,
        tasksWeight: 30,
        metricsWeight: 20,
        habitsWeight: 10,
      };

      // Calculate criteria progress
      const criteriaProgress = goalProgressService.calculateCriteriaProgress(
        goalForHealth.successCriteria
      );

      // Calculate tasks progress
      const tasksProgress = goalProgressService.calculateTasksProgress(tasks);

      // Calculate metrics progress (requires fetching metric details and logs)
      const metricsProgress = await goalProgressService.calculateMetricsProgress(
        metrics.map((m) => m.id)
      );

      // Calculate habits progress
      const habitsProgress = await goalProgressService.calculateHabitsProgress(habits);

      // Calculate weighted overall progress
      const totalWeight =
        weights.criteriaWeight + weights.tasksWeight + weights.metricsWeight + weights.habitsWeight;
      let overall = 0;
      if (totalWeight > 0) {
        overall =
          ((criteriaProgress.percentage * weights.criteriaWeight) / 100 +
            (tasksProgress.percentage * weights.tasksWeight) / 100 +
            (metricsProgress.percentage * weights.metricsWeight) / 100 +
            (habitsProgress.consistency * weights.habitsWeight) / 100) /
          (totalWeight / 100);
      }

      const progressData: GoalProgressBreakdown = {
        overall: Math.round(overall),
        criteria: criteriaProgress,
        tasks: tasksProgress,
        metrics: metricsProgress,
        habits: habitsProgress,
      };
      setGoalsProgress((prev) => new Map(prev).set(goalId, progressData));

      // Calculate health using the goal we have
      const healthData = await goalProgressService.calculateHealth(goalForHealth, progressData);
      setGoalsHealth((prev) => new Map(prev).set(goalId, healthData));
    } catch (error) {
      console.error('Failed to load goal data:', error);
    } finally {
      loadingGoalsRef.current.delete(goalId);
    }
    // No dependencies - we use refs to access latest values to prevent infinite loops
  }, []);

  // Migrate goals if needed when they're loaded from React Query
  const migratedGoals = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    const needsMigrationCheck = goals.some(needsMigration);
    if (needsMigrationCheck) {
      return migrateGoals(goals);
    }
    return goals;
  }, [goals]);

  // Track the last loaded goal ID to prevent unnecessary reloads
  const lastLoadedGoalIdRef = useRef<string | null>(null);
  const lastLoadedGoalVersionRef = useRef<string | null>(null);

  // Extract stable values from selectedGoal to use as dependencies
  const selectedGoalId = selectedGoal?.id;
  const selectedGoalUpdatedAt = selectedGoal?.updatedAt;

  useEffect(() => {
    if (!selectedGoal) {
      lastLoadedGoalIdRef.current = null;
      lastLoadedGoalVersionRef.current = null;
      return;
    }

    // Create a version string from the goal's updatedAt timestamp to detect actual changes
    const goalVersion = `${selectedGoal.id}-${selectedGoal.updatedAt}`;

    // Only reload if the goal ID changed OR the goal was actually updated
    if (
      lastLoadedGoalIdRef.current === selectedGoal.id &&
      lastLoadedGoalVersionRef.current === goalVersion
    ) {
      return;
    }

    lastLoadedGoalIdRef.current = selectedGoal.id;
    lastLoadedGoalVersionRef.current = goalVersion;
    loadGoalData(selectedGoal.id, selectedGoal);
    // loadGoalData is stable (no dependencies), so we only need to track selectedGoal changes
    // We use extracted values to avoid including the whole object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoalId, selectedGoalUpdatedAt]);

  const handleCreateGoal = async (input: CreateGoalInput) => {
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const response = await createGoal(input);
      if (response.success && response.data) {
        // React Query mutation automatically updates the cache via upsertGoalCache
        setIsCreateDialogOpen(false);
        setParentGoalForSubgoal(null); // Reset parent goal after creation
        setCreateError(null);
      } else if (response.error) {
        // Pass the full error object so the form can display detailed validation errors
        setCreateError(response.error);
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
      setCreateError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async (id: string, input: UpdateGoalInput) => {
    setIsSubmitting(true);
    try {
      const response = await updateGoal({ id, input });
      if (response.success && response.data) {
        // React Query mutation automatically updates the cache via upsertGoalCache
        if (selectedGoal && selectedGoal.id === id) {
          // Reset the ref so the useEffect will reload the goal data
          lastLoadedGoalIdRef.current = null;
          // Update selectedGoal - this will trigger the useEffect to reload data
          setSelectedGoal(response.data);
        }
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await deleteGoal(goalToDelete.id);
      if (response.success) {
        // React Query mutation automatically updates the cache via removeGoalCache
        if (selectedGoal && selectedGoal.id === goalToDelete.id) {
          setSelectedGoal(null);
        }
        setGoalToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleBackToGrid = () => {
    setSelectedGoal(null);
  };

  const handleToggleCriterion = async (criterionId: string, isCompleted: boolean) => {
    if (!selectedGoal) return;

    try {
      const response = await goalsService.updateCriterion(selectedGoal.id, criterionId, {
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      });

      if (response.success && response.data) {
        // Normalize the response to ensure success criteria are properly formatted
        const normalizedGoal = response.data;
        setSelectedGoal(normalizedGoal);

        // Update React Query cache manually since updateCriterion doesn't use a mutation hook
        upsertGoalCache(queryClient, normalizedGoal);

        // Log activity
        await goalsService.logActivity(selectedGoal.id, {
          type: 'criterion_completed',
          title: 'Success criterion completed',
          description: `Marked criterion as completed`,
          entityType: null,
          entityId: null,
        });

        // Check for celebrations
        const criteria = response.data.successCriteria;
        const allCompleted =
          Array.isArray(criteria) &&
          criteria.length > 0 &&
          criteria.every((c: unknown) =>
            typeof c === 'string' ? c.includes('✓') : (c as { isCompleted: boolean }).isCompleted
          );

        if (allCompleted) {
          setCelebration({
            show: true,
            type: 'criteria_completed',
            message: 'All Success Criteria Met!',
          });
        }

        // Reload progress
        loadGoalData(selectedGoal.id, response.data);
      }
    } catch (error) {
      console.error('Failed to toggle criterion:', error);
    }
  };

  const handleBulkStatusChange = async (status: GoalStatus) => {
    for (const goalId of selectedGoalIds) {
      await updateGoal({ id: goalId, input: { status } });
    }
    setSelectedGoalIds([]);
    // React Query mutations automatically update the cache
  };

  const handleBulkPriorityChange = async (priority: Goal['priority']) => {
    for (const goalId of selectedGoalIds) {
      await updateGoal({ id: goalId, input: { priority } });
    }
    setSelectedGoalIds([]);
    // React Query mutations automatically update the cache
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedGoalIds.length} goals? This cannot be undone.`)) {
      for (const goalId of selectedGoalIds) {
        await deleteGoal(goalId);
      }
      setSelectedGoalIds([]);
      // React Query mutations automatically update the cache
    }
  };

  const handleQuickFilterToggle = (filter: QuickFilter) => {
    setQuickFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = [
    filters.area,
    filters.status,
    filters.priority,
    filters.momentum,
    filters.hasLinkedTasks,
    filters.hasLinkedMetrics,
  ].filter(Boolean).length;

  const filteredGoals = useMemo(() => {
    // Note: Area layout shows all goals regardless of parentGoalId (parent/child relationships)
    // Only apply filters that are explicitly set by the user
    return migratedGoals.filter((goal) => {
      const matchesSearch =
        !searchQuery ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesArea = !filters.area || goal.area === filters.area;
      const matchesStatus = !filters.status || goal.status === filters.status;
      const matchesPriority = !filters.priority || goal.priority === filters.priority;
      // Momentum filter: if not set, include all goals; if set, only include goals that match
      // If goal health data isn't loaded yet, default to including it (don't filter out)
      const matchesMomentum =
        !filters.momentum ||
        (filters.momentum === 'active'
          ? goalsHealth.get(goal.id)?.momentum === 'active'
          : filters.momentum === 'dormant'
            ? goalsHealth.get(goal.id)?.momentum === 'dormant'
            : true);
      const matchesHasLinkedTasks =
        !filters.hasLinkedTasks || (goalsLinkedCounts.get(goal.id)?.tasks || 0) > 0;
      const matchesHasLinkedMetrics =
        !filters.hasLinkedMetrics || (goalsLinkedCounts.get(goal.id)?.metrics || 0) > 0;

      // Quick filters
      if (quickFilters.length > 0) {
        const now = new Date();
        const matchesQuickFilters = quickFilters.every((qf) => {
          switch (qf) {
            case 'at_risk':
              return goal.status === 'At Risk';
            case 'due_this_week': {
              if (!goal.targetDate) return false;
              const target = new Date(goal.targetDate);
              const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              return target >= now && target <= oneWeekFromNow;
            }
            case 'needs_attention': {
              const lastActivity = goal.lastActivityAt
                ? new Date(goal.lastActivityAt)
                : new Date(goal.createdAt);
              const daysSinceActivity = Math.ceil(
                (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
              );
              return daysSinceActivity > 7 && goal.status === 'Active';
            }
            case 'dormant':
              return goalsHealth.get(goal.id)?.momentum === 'dormant';
            case 'recently_completed': {
              if (!goal.completedDate) return false;
              const completed = new Date(goal.completedDate);
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return completed >= sevenDaysAgo;
            }
            default:
              return true;
          }
        });
        if (!matchesQuickFilters) return false;
      }

      return (
        matchesSearch &&
        matchesArea &&
        matchesStatus &&
        matchesPriority &&
        matchesMomentum &&
        matchesHasLinkedTasks &&
        matchesHasLinkedMetrics
      );
    });
  }, [migratedGoals, searchQuery, filters, quickFilters, goalsHealth, goalsLinkedCounts]);

  const groupedByArea = useMemo(() => {
    const grouped = filteredGoals.reduce(
      (acc, goal) => {
        // Ensure all goals are grouped by area, regardless of parentGoalId
        if (!goal.area) {
          console.warn(`[GoalsPage] Goal "${goal.title}" (${goal.id}) is missing area field`);
          return acc;
        }
        if (!acc[goal.area]) acc[goal.area] = [];
        acc[goal.area].push(goal);
        return acc;
      },
      {} as Record<string, Goal[]>
    );
    // Debug: Log grouped goals to help identify rendering issues
    if (process.env.NODE_ENV === 'development') {
      Object.entries(grouped).forEach(([area, goals]) => {
        console.log(
          `[GoalsPage] Area "${area}": ${goals.length} goals`,
          goals.map((g) => ({ id: g.id, title: g.title, parentGoalId: g.parentGoalId }))
        );
        // Warn if count doesn't match what's being rendered
        if (goals.length !== filteredGoals.filter((g) => g.area === area).length) {
          console.warn(
            `[GoalsPage] Mismatch: Area "${area}" has ${goals.length} goals in groupedByArea but ${filteredGoals.filter((g) => g.area === area).length} in filteredGoals`
          );
        }
      });
    }
    return grouped;
  }, [filteredGoals]);

  // Memoize goal detail data to prevent unnecessary re-renders
  const goalDetailData = useMemo(() => {
    if (!selectedGoal) return null;

    const tasks = goalTasks.get(selectedGoal.id) || [];
    const metrics = (goalMetrics.get(selectedGoal.id) || []).map((m) => ({
      metric: m,
      latestLog: (goalMetricLogs.get(m.id) || [])[0] || null,
      progress: 0, // Would calculate from logs
    }));
    const habits = (goalHabits.get(selectedGoal.id) || []).map((h) => ({
      habit: h,
      currentStreak: 0,
      completedToday: false,
      weeklyProgress: 0,
    }));
    const projects = goalProjects.get(selectedGoal.id) || [];

    return { tasks, metrics, habits, projects };
  }, [selectedGoal?.id, goalTasks, goalMetrics, goalMetricLogs, goalHabits, goalProjects]);

  if (selectedGoal && goalDetailData) {
    const { tasks, metrics, habits, projects } = goalDetailData;

    return (
      <>
        <AnimatePresence mode="wait">
          <GoalDetailView
            key={selectedGoal.id}
            goal={selectedGoal}
            tasks={tasks}
            metrics={metrics}
            habits={habits}
            projects={projects}
            onBack={handleBackToGrid}
            onEdit={() => setIsEditDialogOpen(true)}
            onDelete={() => setGoalToDelete(selectedGoal)}
            onToggleCriterion={handleToggleCriterion}
            onUpdateCriterion={(criterionId, updates) => {
              console.log('Update criterion', criterionId, updates);
            }}
            onAddTask={() => console.log('Add task')}
            onLinkMetric={() => console.log('Link metric')}
            onLinkHabit={() => console.log('Link habit')}
            onCompleteHabit={(habitId) => console.log('Complete habit', habitId)}
            onLogMetric={(metricId) => console.log('Log metric', metricId)}
          />
        </AnimatePresence>

        <Dialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="Edit Goal"
          className="max-w-2xl"
        >
          <GoalEditForm
            goal={selectedGoal}
            onSubmit={handleUpdateGoal}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isSubmitting}
            allGoals={migratedGoals}
          />
        </Dialog>

        <CelebrationEffect
          show={celebration.show}
          type={celebration.type}
          message={celebration.message}
          onComplete={() => setCelebration({ show: false, type: 'milestone_25' })}
        />

        <Dialog isOpen={!!goalToDelete} onClose={() => setGoalToDelete(null)} title="Delete Goal">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            {goalToDelete && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="font-semibold text-gray-900 dark:text-white">{goalToDelete.title}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setGoalToDelete(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteGoal}
                disabled={isSubmitting}
                className="!bg-red-600 hover:!bg-red-700"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Goal'}
              </Button>
            </div>
          </div>
        </Dialog>
      </>
    );
  }

  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals Vision Board</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your goals and success criteria
          </p>
        </div>
        <motion.div
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className="min-h-[44px] min-w-[44px]"
        >
          <Button
            variant="primary"
            onClick={() => {
              setParentGoalForSubgoal(null);
              setIsCreateDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Goal
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick Filters */}
      <div className="mb-4">
        <QuickFilterBar
          goals={goals}
          activeFilters={quickFilters}
          onFilterToggle={handleQuickFilterToggle}
          onClearFilters={() => setQuickFilters([])}
        />
      </div>

      {/* Search and View Mode Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-4 flex items-center gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <motion.div
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className="min-h-[44px] min-w-[44px]"
        >
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="relative w-full sm:w-auto"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </Button>
        </motion.div>

        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
          {(['timeHorizon', 'area', 'kanban', 'timeline', 'mindmap'] as ViewMode[]).map(
            (mode, index) => {
              const icons = {
                timeHorizon: Layers,
                area: LayoutGrid,
                kanban: Kanban,
                timeline: Calendar,
                mindmap: Network,
              };
              const labels = {
                timeHorizon: 'Time',
                area: 'Area',
                kanban: 'Board',
                timeline: 'Timeline',
                mindmap: 'Mindmap',
              };
              const titles = {
                timeHorizon: 'Time view',
                area: 'Area view',
                kanban: 'Kanban board',
                timeline: 'Timeline view',
                mindmap: 'Mindmap view',
              };
              const Icon = icons[mode];
              const isActive = viewMode === mode;

              return (
                <motion.button
                  key={mode}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded min-h-[44px] transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={titles[mode]}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{labels[mode]}</span>
                </motion.button>
              );
            }
          )}
        </div>
      </motion.div>

      {/* Inline Collapsible Filters */}
      <AnimatePresence mode="wait">
        {showFilters && (
          <motion.div
            variants={filterPanelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] px-2"
                  >
                    Clear all
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFilters(false)}
                  className="p-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Area
                </label>
                <select
                  value={filters.area || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, area: (e.target.value as Area) || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Areas</option>
                  {AREA_OPTIONS.map((area) => (
                    <option key={area} value={area}>
                      {AREA_LABELS[area]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: (e.target.value as Priority) || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Level
                </label>
                <select
                  value={filters.momentum || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, momentum: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Has Linked...
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!filters.hasLinkedTasks}
                      onChange={(e) =>
                        setFilters({ ...filters, hasLinkedTasks: e.target.checked || undefined })
                      }
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tasks</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!filters.hasLinkedMetrics}
                      onChange={(e) =>
                        setFilters({ ...filters, hasLinkedMetrics: e.target.checked || undefined })
                      }
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Metrics</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        viewMode === 'mindmap' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GoalMindmapLoadingSkeleton />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {[1, 2, 3].map((areaIndex) => (
              <div key={areaIndex}>
                {/* Area header skeleton */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                {/* Goal cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((cardIndex) => (
                    <motion.div
                      key={cardIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (areaIndex - 1) * 0.1 + cardIndex * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[280px]"
                    >
                      <div className="space-y-4">
                        {/* Header skeleton */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </div>
                          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        </div>
                        {/* Title skeleton */}
                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        {/* Description skeleton */}
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                        {/* Tags skeleton */}
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        </div>
                        {/* Footer skeleton */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals found"
          description={
            searchQuery ||
            filters.area ||
            filters.status ||
            filters.priority ||
            quickFilters.length > 0
              ? 'Try adjusting your filters or search query'
              : 'Get started by creating your first goal'
          }
          actionLabel="Create Goal"
          onAction={() => {
            setParentGoalForSubgoal(null);
            setIsCreateDialogOpen(true);
          }}
          variant={migratedGoals.length === 0 ? 'onboarding' : 'default'}
          onboardingSteps={
            migratedGoals.length === 0
              ? [
                  'Start with a yearly goal that represents your big vision',
                  'Break it down into quarterly and monthly milestones',
                  'Define 3-5 success criteria to measure achievement',
                  'Link tasks, metrics, and habits to track progress',
                ]
              : []
          }
          proTips={
            migratedGoals.length === 0
              ? [
                  'Use SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound',
                  'Start with 1-3 goals per area to avoid overwhelm',
                  'Review your goals weekly to stay on track',
                ]
              : []
          }
        />
      ) : viewMode === 'kanban' ? (
        <GoalKanbanView
          goals={filteredGoals}
          goalsProgress={goalsProgress}
          goalsLinkedCounts={goalsLinkedCounts}
          goalsHealth={goalsHealth}
          onGoalClick={handleGoalClick}
          onGoalUpdate={async (goalId, updates) => {
            await handleUpdateGoal(goalId, updates as UpdateGoalInput);
            // React Query mutations automatically update the cache
          }}
          onCreateGoal={() => {
            setParentGoalForSubgoal(null);
            setIsCreateDialogOpen(true);
          }}
        />
      ) : viewMode === 'timeline' ? (
        <GoalTimelineView goals={filteredGoals} onGoalClick={handleGoalClick} />
      ) : viewMode === 'mindmap' ? (
        <GoalMindmapView
          goals={filteredGoals}
          goalsProgress={goalsProgress}
          goalsHealth={goalsHealth}
          onGoalClick={handleGoalClick}
          onCreateSubgoal={(parentGoal) => {
            setParentGoalForSubgoal(parentGoal);
            setIsCreateDialogOpen(true);
          }}
        />
      ) : viewMode === 'timeHorizon' ? (
        <GoalHierarchicalTimeView
          goals={filteredGoals}
          goalsProgress={goalsProgress}
          goalsLinkedCounts={goalsLinkedCounts}
          goalsHealth={goalsHealth}
          onGoalClick={handleGoalClick}
          onCreateSubgoal={(parentGoal) => {
            setParentGoalForSubgoal(parentGoal);
            setIsCreateDialogOpen(true);
          }}
        />
      ) : (
        <motion.div
          key={`area-layout-${viewMode}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
          className="space-y-8"
        >
          {Object.entries(groupedByArea).map(([area, areaGoals]) => (
            <motion.div key={area} variants={itemVariants} transition={{ duration: 0.3 }}>
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
              >
                <AreaBadge area={area as Goal['area']} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({areaGoals.length} {areaGoals.length === 1 ? 'goal' : 'goals'})
                </span>
              </motion.h2>
              <motion.div
                key={`area-${area}-goals`}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {areaGoals.map((goal) => {
                  // Ensure all goals are rendered - no filtering by parentGoalId in Area layout
                  // Use a unique key that includes the view mode to prevent Framer Motion layoutId conflicts
                  return (
                    <motion.div
                      key={`area-goal-${goal.id}`}
                      variants={itemVariants}
                      // Remove layoutId for Area layout to prevent rendering issues on navigation
                      // layoutId is only needed for shared layout animations (e.g., detail view transitions)
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GoalCard
                        goal={goal}
                        onClick={handleGoalClick}
                        progress={goalsProgress.get(goal.id)}
                        linkedCounts={goalsLinkedCounts.get(goal.id)}
                        healthStatus={goalsHealth.get(goal.id)?.status}
                        daysRemaining={goalsHealth.get(goal.id)?.daysRemaining}
                        momentum={goalsHealth.get(goal.id)?.momentum}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedGoalIds.length}
        onStatusChange={handleBulkStatusChange}
        onPriorityChange={handleBulkPriorityChange}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedGoalIds([])}
      />

      {/* Celebration Effect */}
      <CelebrationEffect
        show={celebration.show}
        type={celebration.type}
        message={celebration.message}
        onComplete={() => setCelebration({ show: false, type: 'milestone_25' })}
      />

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setParentGoalForSubgoal(null);
        }}
        title={
          parentGoalForSubgoal
            ? `Create Subgoal for "${parentGoalForSubgoal.title}"`
            : 'Create New Goal'
        }
        className="max-w-2xl"
      >
        <GoalCreateForm
          onSubmit={handleCreateGoal}
          onCancel={() => {
            setIsCreateDialogOpen(false);
            setParentGoalForSubgoal(null);
            setCreateError(null);
          }}
          isLoading={isSubmitting}
          parentGoal={parentGoalForSubgoal}
          error={createError}
          allGoals={migratedGoals}
        />
      </Dialog>

      <Dialog isOpen={!!goalToDelete} onClose={() => setGoalToDelete(null)} title="Delete Goal">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this goal? This action cannot be undone.
          </p>
          {goalToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white">{goalToDelete.title}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setGoalToDelete(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteGoal}
              disabled={isSubmitting}
              className="!bg-red-600 hover:!bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Goal'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
