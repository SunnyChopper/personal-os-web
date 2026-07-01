import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  List,
  Kanban,
  Calendar as CalendarIcon,
  Network,
  Filter,
  X,
  Loader2,
  AlertCircle,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Area,
  Priority,
  TaskStatus,
  EntitySummary,
  TaskDependency,
  FilterOptions,
  TaskListSortField,
} from '@/types/growth-system';
import { useTasks, useProjects, useGoals, useTaskDependencies } from '@/hooks/useGrowthSystem';
import { tasksService, goalsService, projectsService } from '@/services/growth-system';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import {
  addTaskDependencyToCache,
  removeTaskDependencyFromCache,
} from '@/lib/react-query/growth-system-cache';
import Button from '@/components/atoms/Button';
import { TaskListItem } from '@/components/molecules/TaskListItem';
import { TaskCreateForm } from '@/components/organisms/TaskCreateForm';
import { TaskEditPanel } from '@/components/organisms/TaskEditPanel';
import { TaskKanbanBoard } from '@/components/organisms/TaskKanbanBoard';
import { TaskCalendarView } from '@/components/organisms/TaskCalendarView';
import DependencyGraph from '@/components/organisms/DependencyGraph';
import { TaskDetailDialog } from '@/components/organisms/TaskDetailDialog';
import Dialog from '@/components/molecules/Dialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AISuggestionBanner } from '@/components/molecules/AISuggestionBanner';
import { useToast } from '@/hooks/use-toast';
import { addCalendarDays, localCalendarDate } from '@/lib/date/local-calendar';
import {
  AREAS,
  PRIORITIES,
  TASK_STATUSES,
  AREA_LABELS,
  TASK_STATUS_LABELS,
} from '@/constants/growth-system';
import { Select } from '@/components/atoms/Select';
import type { KanbanCardDensity } from '@/lib/growth-system/kanban-constants';
import {
  persistKanbanCardDensity,
  readKanbanCardDensity,
} from '@/components/organisms/kanban/kanban-density';

type ViewMode = 'list' | 'kanban' | 'calendar' | 'graph';

const AREA_OPTIONS: Area[] = [...AREAS];
const STATUS_OPTIONS: TaskStatus[] = [...TASK_STATUSES];
const PRIORITY_OPTIONS: Priority[] = [...PRIORITIES];

type DuePreset = 'none' | 'today' | 'tomorrow' | 'week' | 'month';

// Animation variants for mobile UI enhancements
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
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

const filterPanelVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
  show: {
    opacity: 1,
    height: 'auto',
    marginBottom: '0.75rem',
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
};

export default function TasksPage() {
  const { showToast, ToastContainer } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<Area | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<Priority | undefined>();
  const [duePreset, setDuePreset] = useState<DuePreset>('none');
  const [taskSortField, setTaskSortField] = useState<TaskListSortField>('priority');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [cardDensity, setCardDensity] = useState<KanbanCardDensity>(() => readKanbanCardDensity());

  const isKanbanCompact = cardDensity === 'compact';

  const setCardDensityMode = (mode: KanbanCardDensity) => {
    setCardDensity(mode);
    persistKanbanCardDensity(mode);
  };

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus | undefined>();
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [splitDragError, setSplitDragError] = useState<string | null>(null);

  const apiTaskFilters = useMemo<FilterOptions>(() => {
    const f: FilterOptions = {
      pageSize: 100,
      sortBy: taskSortField,
      sortOrder: 'asc',
    };
    if (selectedArea) f.area = selectedArea;
    if (selectedStatus) f.status = selectedStatus;
    if (selectedPriority) f.priority = selectedPriority;

    const todayKey = localCalendarDate();
    if (duePreset === 'today') {
      f.dueDateFrom = todayKey;
      f.dueDateTo = todayKey;
    } else if (duePreset === 'tomorrow') {
      const tk = addCalendarDays(todayKey, 1);
      f.dueDateFrom = tk;
      f.dueDateTo = tk;
    } else if (duePreset === 'week') {
      const dow = new Date().getDay();
      const weekStartKey = addCalendarDays(todayKey, -dow);
      const weekEndKey = addCalendarDays(weekStartKey, 6);
      f.dueDateFrom = weekStartKey;
      f.dueDateTo = weekEndKey;
    } else if (duePreset === 'month') {
      const ref = new Date();
      const y = ref.getFullYear();
      const m = ref.getMonth();
      const pad = (n: number) => String(n).padStart(2, '0');
      f.dueDateFrom = `${y}-${pad(m + 1)}-01`;
      const lastDom = localCalendarDate(new Date(y, m + 1, 0));
      f.dueDateTo = lastDom;
    }
    return f;
  }, [selectedArea, selectedStatus, selectedPriority, duePreset, taskSortField]);

  // Use individual hooks for data fetching and mutations
  const {
    tasks,
    isLoading: tasksDataLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    splitDraggedTask,
    isSplittingDraggedTask,
  } = useTasks(apiTaskFilters);
  const { projects } = useProjects();
  const { goals } = useGoals();

  // Prefetch goals and projects if they haven't been loaded yet (tasks depend on them)
  useEffect(() => {
    const goalsQueryKey = queryKeys.growthSystem.goals.lists();
    const projectsQueryKey = queryKeys.growthSystem.projects.lists();

    // Check if data is already in cache
    const goalsData = queryClient.getQueryData(goalsQueryKey);
    const projectsData = queryClient.getQueryData(projectsQueryKey);

    // Prefetch goals if not in cache
    if (!goalsData) {
      queryClient.prefetchQuery({
        queryKey: goalsQueryKey,
        queryFn: async () => {
          const result = await goalsService.getAll();
          return result;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    }

    // Prefetch projects if not in cache
    if (!projectsData) {
      queryClient.prefetchQuery({
        queryKey: projectsQueryKey,
        queryFn: async () => {
          const result = await projectsService.getAll();
          return result;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    }
  }, [queryClient]);

  // Convert projects and goals to EntitySummary format
  const allProjects = useMemo<EntitySummary[]>(
    () =>
      projects.map((p) => ({
        id: p.id,
        title: p.name,
        type: 'project' as const,
        area: p.area,
        status: p.status,
      })),
    [projects]
  );

  const allGoals = useMemo<EntitySummary[]>(
    () =>
      goals
        .filter((g) => g.status !== 'Abandoned' && g.status !== 'Achieved')
        .map((g) => ({
          id: g.id,
          title: g.title,
          type: 'goal' as const,
          area: g.area,
          status: g.status,
          parentGoalId: g.parentGoalId,
          targetDate: g.targetDate,
          completedDate: g.completedDate,
        })),
    [goals]
  );

  const taskEntitiesForCreateDeps = useMemo<EntitySummary[]>(
    () =>
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        type: 'task' as const,
        area: t.area,
        status: t.status,
      })),
    [tasks]
  );

  // Primary filters + sort applied server-side; search stays client-side (no backend full-text contract).
  const filteredTasks = useMemo(() => {
    let result = tasks;
    // List/calendar/graph: hide capture-only Backlog unless user filters by status (contract §5).
    if (!selectedStatus && viewMode !== 'kanban') {
      result = result.filter((task) => task.status !== 'Backlog');
    }
    const sq = searchQuery.trim().toLowerCase();
    if (!sq) return result;
    return result.filter((task) => task.title.toLowerCase().includes(sq));
  }, [tasks, searchQuery, selectedStatus, viewMode]);

  // Graph dependencies for currently visible tasks
  const taskIds = useMemo(() => filteredTasks.map((t) => t.id), [filteredTasks]);
  const {
    dependencyMap,
    allDependencies: rawDependencies,
    isLoading: dependenciesLoading,
  } = useTaskDependencies(taskIds);

  // Convert raw dependencies to TaskDependency format
  const allDependencies = useMemo<TaskDependency[]>(() => {
    return rawDependencies as TaskDependency[];
  }, [rawDependencies]);

  // Compute dependency and blocked-by maps
  const { taskDependencies, taskBlockedBy } = useMemo(() => {
    const depMap = new Map<string, string[]>();
    const blockedMap = new Map<string, string[]>();
    const taskMap = new Map(filteredTasks.map((t) => [t.id, t]));

    dependencyMap.forEach((deps, taskId) => {
      const depIds = deps.map((d: { dependsOnTaskId: string }) => d.dependsOnTaskId);
      depMap.set(taskId, depIds);

      const incompleteDeps = depIds.filter((depId: string) => {
        const depTask = taskMap.get(depId);
        return depTask && depTask.status !== 'Done';
      });

      incompleteDeps.forEach((depId: string) => {
        const current = blockedMap.get(taskId) || [];
        blockedMap.set(taskId, [...current, depId]);
      });
    });

    return { taskDependencies: depMap, taskBlockedBy: blockedMap };
  }, [dependencyMap, filteredTasks]);

  const graphViewLoading = tasksDataLoading || dependenciesLoading;

  const handleCreateTask = async (input: CreateTaskInput) => {
    setIsSubmitting(true);
    try {
      if (createStatus) {
        input.status = createStatus;
      }
      await createTask(input);
      setIsCreateDialogOpen(false);
      setCreateStatus(undefined);
      showToast({
        type: 'success',
        title: 'Task created',
        message: `"${input.title}" has been created successfully.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create task. Please try again.';
      showToast({
        type: 'error',
        title: 'Failed to create task',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSplitDraggedTask = async (task: Task) => {
    setSplitDragError(null);
    try {
      const result = await splitDraggedTask(task);
      showToast({
        type: 'success',
        title: 'Task split',
        message: `Created ${result.created.length} subtasks (1 pt each). ${result.reasoning}`,
      });
      setIsDetailDialogOpen(false);
      setTaskToView(null);
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to split task. Try again.');
      setSplitDragError(message);
      showToast({ type: 'error', title: 'Split failed', message });
    }
  };

  const handleCreateSubtasks = async (subtasks: CreateTaskInput[]) => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      for (const st of subtasks) {
        await createTask({
          ...st,
          parentTaskId: selectedTask.id,
          size: 1,
          area: selectedTask.area,
          priority: selectedTask.priority,
        });
      }
      showToast({
        type: 'success',
        title: 'Subtasks created',
        message: `Added ${subtasks.length} one-point subtasks.`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to create subtasks',
        message: extractErrorMessage(error, 'Could not create subtasks.'),
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    input: UpdateTaskInput,
    options?: { trackSubmitting?: boolean; notifyOnError?: boolean }
  ): Promise<void> => {
    const trackSubmitting = options?.trackSubmitting !== false;
    const notifyOnError = options?.notifyOnError === true;
    const previousProjectIds =
      input.projectIds !== undefined
        ? (tasks.find((t) => t.id === taskId)?.projectIds ?? [])
        : undefined;
    if (trackSubmitting) {
      setIsSubmitting(true);
    }
    try {
      const response = await updateTask({ id: taskId, input });
      if (response.success && response.data) {
        if (selectedTask?.id === taskId) {
          setSelectedTask(response.data);
        }
        if (taskToView?.id === taskId) {
          setTaskToView(response.data);
        }
        if (previousProjectIds !== undefined) {
          const nextProjectIds = response.data.projectIds ?? [];
          const changedIds = new Set([...previousProjectIds, ...nextProjectIds]);
          for (const projectId of changedIds) {
            const wasLinked = previousProjectIds.includes(projectId);
            const isLinked = nextProjectIds.includes(projectId);
            if (wasLinked !== isLinked) {
              window.dispatchEvent(
                new CustomEvent('task-project-link-changed', { detail: { projectId } })
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      if (notifyOnError) {
        showToast({
          type: 'error',
          title: "Couldn't update task",
          message: extractErrorMessage(error, 'Failed to update task. Please try again.'),
        });
        return;
      }
      throw error;
    } finally {
      if (trackSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  const handleKanbanTaskUpdate = async (id: string, input: UpdateTaskInput) => {
    if (input.status === 'Done') {
      try {
        await completeTask(id);
      } catch (error) {
        console.error('Failed to complete task:', error);
        showToast({
          type: 'error',
          title: "Couldn't complete task",
          message: extractErrorMessage(error, 'Failed to complete task. Please try again.'),
        });
      }
      return;
    }
    await handleUpdateTask(id, input, { trackSubmitting: false, notifyOnError: true });
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteTask(taskToDelete.id);

      // Success: show toast and close dialog
      showToast({
        type: 'success',
        title: 'Task deleted',
        message: `"${taskToDelete.title}" has been deleted successfully.`,
      });

      setTaskToDelete(null);
      setIsEditPanelOpen(false);
    } catch (error) {
      // Error: show error message and keep dialog open
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete task. Please try again.';
      setDeleteError(errorMessage);
      showToast({
        type: 'error',
        title: 'Failed to delete task',
        message: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditPanelOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setTaskToView(task);
    setIsDetailDialogOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedArea(undefined);
    setSelectedStatus(undefined);
    setSelectedPriority(undefined);
    setDuePreset('none');
  };

  const handleDependencyAdd = async (taskId: string, dependsOnId: string) => {
    const response = await tasksService.addDependency(taskId, dependsOnId);
    if (response.success && response.data) {
      // Update the cache optimistically
      addTaskDependencyToCache(queryClient, response.data);
    }
  };

  const handleDependencyRemove = async (taskId: string, dependsOnId: string) => {
    await tasksService.removeDependency(taskId, dependsOnId);
    // Update the cache optimistically
    removeTaskDependencyFromCache(queryClient, taskId, dependsOnId);
  };

  const getTaskDependencies = (taskId: string): Task[] => {
    const depIds = taskDependencies.get(taskId) || [];
    return tasks.filter((t) => depIds.includes(t.id));
  };

  const getTaskBlockedBy = (taskId: string): Task[] => {
    const blockedIds = taskBlockedBy.get(taskId) || [];
    return tasks.filter((t) => blockedIds.includes(t.id));
  };

  const getLinkedProjects = (taskId: string): EntitySummary[] => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.projectIds?.length) return [];
    const projectIdSet = new Set(task.projectIds);
    return allProjects.filter((p) => projectIdSet.has(p.id));
  };

  const getLinkedGoals = (taskId: string): EntitySummary[] => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.goalIds?.length) return [];
    const goalIdSet = new Set(task.goalIds);
    return allGoals.filter((g) => goalIdSet.has(g.id));
  };

  const activeFilterCount = [
    selectedArea,
    selectedStatus,
    selectedPriority,
    duePreset !== 'none' ? duePreset : null,
  ].filter(Boolean).length;

  const hasTaskRefinements =
    !!searchQuery.trim() ||
    !!selectedArea ||
    !!selectedStatus ||
    !!selectedPriority ||
    duePreset !== 'none';

  return (
    <PageContainer
      width="full"
      className={viewMode === 'kanban' ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col' : 'min-h-0'}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4 ${
          viewMode === 'kanban' ? 'shrink-0' : ''
        }`}
      >
        <h1 className="shrink-0 text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>

        <div className="relative min-w-0 flex-1 xl:max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-gray-900 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 xl:min-h-[36px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
          <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative min-h-[44px] xl:min-h-[36px]"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                >
                  {activeFilterCount}
                </motion.span>
              ) : null}
            </Button>
          </motion.div>

          {viewMode === 'kanban' ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setCardDensityMode(isKanbanCompact ? 'cards' : 'compact')}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 xl:min-h-[36px]"
              title={
                isKanbanCompact
                  ? 'Show card details on all columns'
                  : 'Use compact rows on all columns'
              }
              aria-pressed={isKanbanCompact}
              aria-label={
                isKanbanCompact
                  ? 'Switch to detailed cards on all columns'
                  : 'Switch to compact rows on all columns'
              }
            >
              {isKanbanCompact ? (
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {isKanbanCompact ? 'Detailed cards' : 'Compact rows'}
              </span>
            </motion.button>
          ) : null}

          <div className="flex items-center gap-0.5 rounded-lg border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-800">
            {(['list', 'kanban', 'calendar', 'graph'] as ViewMode[]).map((mode, index) => {
              const icons = {
                list: List,
                kanban: Kanban,
                calendar: CalendarIcon,
                graph: Network,
              };
              const labels = {
                list: 'List',
                kanban: 'Board',
                calendar: 'Calendar',
                graph: 'Graph',
              };
              const titles = {
                list: 'List view',
                kanban: 'Kanban board',
                calendar: 'Calendar view',
                graph: 'Dependency graph',
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
                  className={`flex min-h-[44px] items-center gap-1.5 rounded px-2.5 py-1.5 transition-colors xl:min-h-[36px] ${
                    isActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  title={titles[mode]}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden text-sm font-medium sm:inline">{labels[mode]}</span>
                </motion.button>
              );
            })}
          </div>

          <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="min-h-[44px] w-full sm:w-auto xl:min-h-[36px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {showFilters && (
          <motion.div
            variants={filterPanelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearFilters}
                    className="min-h-[36px] px-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Clear all
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFilters(false)}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by
                </label>
                <Select
                  value={taskSortField}
                  onChange={(e) => setTaskSortField(e.target.value as TaskListSortField)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="priority">Priority</option>
                  <option value="size">Story points</option>
                  <option value="pointValue">Reward points</option>
                  <option value="dueDate">Due date</option>
                  <option value="createdAt">Created</option>
                  <option value="updatedAt">Updated</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due date
                </label>
                <Select
                  value={duePreset}
                  onChange={(e) => setDuePreset(e.target.value as DuePreset)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="none">Any due date</option>
                  <option value="today">Due today</option>
                  <option value="tomorrow">Due tomorrow</option>
                  <option value="week">Due this week</option>
                  <option value="month">Due this month</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area
                </label>
                <Select
                  value={selectedArea || ''}
                  onChange={(e) => setSelectedArea((e.target.value as Area) || undefined)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Areas</option>
                  {AREA_OPTIONS.map((area) => (
                    <option key={area} value={area}>
                      {AREA_LABELS[area]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <Select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus((e.target.value as TaskStatus) || undefined)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <Select
                  value={selectedPriority || ''}
                  onChange={(e) => setSelectedPriority((e.target.value as Priority) || undefined)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={viewMode === 'kanban' ? 'shrink-0' : undefined}>
        <AISuggestionBanner entityType="task" />
      </div>

      {viewMode === 'list' && (
        <div>
          {tasksDataLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading tasks"
            >
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 lg:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
                    <div className="min-w-0 flex-1 space-y-3 lg:pr-6 xl:pr-8">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="h-7 w-10 shrink-0 rounded bg-gray-200 dark:bg-gray-600" />
                        <div className="h-5 min-w-[8rem] flex-1 rounded bg-gray-200 dark:bg-gray-600 lg:h-6" />
                        <div className="h-6 w-20 shrink-0 rounded-full bg-gray-200 dark:bg-gray-600 lg:hidden" />
                      </div>
                      <div className="h-3.5 w-full max-w-3xl rounded bg-gray-200 dark:bg-gray-600" />
                      <div className="h-3.5 w-4/5 max-w-2xl rounded bg-gray-200 dark:bg-gray-600 lg:hidden" />
                    </div>
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-700/80 lg:min-w-[10rem] lg:max-w-xs lg:border-t-0 lg:border-l lg:border-gray-200 lg:pt-0 xl:max-w-md dark:lg:border-gray-700">
                      <div className="hidden h-6 w-24 shrink-0 rounded-full bg-gray-200 dark:bg-gray-600 lg:ml-auto lg:block" />
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-600" />
                        <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-600" />
                        <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-600" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700/80 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:border-gray-200 lg:pt-0 lg:pl-6 xl:pl-8 dark:lg:border-gray-700">
                      <div className="h-11 w-11 rounded-lg bg-gray-200 dark:bg-gray-600" />
                      <div className="h-11 w-11 rounded-lg bg-gray-200 dark:bg-gray-600" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState
                title="No tasks found"
                description={
                  hasTaskRefinements
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by creating your first task'
                }
                actionLabel="Create Task"
                onAction={() => setIsCreateDialogOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 dark:text-gray-400 mb-4"
              >
                Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </motion.div>
              {filteredTasks.map((task) => (
                <motion.div key={task.id} variants={itemVariants} layoutId={`task-${task.id}`}>
                  <TaskListItem
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onClick={handleViewTask}
                    dependencyCount={taskDependencies.get(task.id)?.length || 0}
                    blockedByCount={taskBlockedBy.get(task.id)?.length || 0}
                    blockedByTasks={getTaskBlockedBy(task.id)}
                    projectCount={0}
                    goalCount={0}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'kanban' && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="-mx-6 -mb-12 mt-6 flex min-h-0 min-w-0 flex-1 flex-col self-stretch lg:-mx-12 lg:-mb-12 lg:mt-8"
          >
            <TaskKanbanBoard
              tasks={filteredTasks}
              projects={projects}
              cardDensity={cardDensity}
              isLoading={tasksDataLoading}
              onTaskUpdate={handleKanbanTaskUpdate}
              onTaskEdit={handleEditTask}
              onTaskClick={handleViewTask}
              onTaskCreate={(status) => {
                setCreateStatus(status);
                setIsCreateDialogOpen(true);
              }}
            />
          </motion.div>
        )}

        {viewMode === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TaskCalendarView
              tasks={filteredTasks}
              isLoading={tasksDataLoading}
              onTaskClick={handleEditTask}
            />
          </motion.div>
        )}

        {viewMode === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DependencyGraph
              tasks={filteredTasks}
              dependencies={allDependencies}
              isLoading={graphViewLoading}
              onTaskClick={(taskId) => {
                const task = filteredTasks.find((t) => t.id === taskId);
                if (task) handleEditTask(task);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setCreateStatus(undefined);
        }}
        title="Create New Task"
      >
        <TaskCreateForm
          dependencyPickerEntities={taskEntitiesForCreateDeps}
          projectPickerEntities={allProjects}
          goalPickerEntities={allGoals}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setIsCreateDialogOpen(false);
            setCreateStatus(undefined);
          }}
          isLoading={isSubmitting}
        />
      </Dialog>

      {selectedTask && (
        <TaskEditPanel
          task={selectedTask}
          isOpen={isEditPanelOpen}
          onClose={() => {
            setIsEditPanelOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleUpdateTask}
          isLoading={isSubmitting}
          availableTasks={tasks}
          availableProjects={allProjects}
          availableGoals={allGoals}
          dependencies={getTaskDependencies(selectedTask.id)}
          blockedBy={getTaskBlockedBy(selectedTask.id)}
          linkedProjects={getLinkedProjects(selectedTask.id)}
          linkedGoals={getLinkedGoals(selectedTask.id)}
          onDependencyAdd={handleDependencyAdd}
          onDependencyRemove={handleDependencyRemove}
          onCreateSubtasks={handleCreateSubtasks}
        />
      )}

      <Dialog
        isOpen={!!taskToDelete}
        onClose={() => !isDeleting && setTaskToDelete(null)}
        title="Delete Task"
      >
        <div className="space-y-4 relative">
          {/* Loading Overlay */}
          {isDeleting && (
            <div
              className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deleting task...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {deleteError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error</p>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">{deleteError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteError(null)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          )}

          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
          </p>
          <div
            className={`flex justify-end gap-3 ${isDeleting ? 'pointer-events-none opacity-60' : ''}`}
          >
            <Button
              variant="secondary"
              onClick={() => {
                setTaskToDelete(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>

      <ToastContainer />

      <TaskDetailDialog
        task={taskToView}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setTaskToView(null);
          setSplitDragError(null);
        }}
        onEdit={handleEditTask}
        onSplitDraggedTask={handleSplitDraggedTask}
        isSplittingDraggedTask={isSplittingDraggedTask}
        splitDragError={splitDragError}
      />
    </PageContainer>
  );
}
