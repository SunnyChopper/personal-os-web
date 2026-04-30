import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  Target,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Filter,
  X,
  Star,
  Link2Off,
} from 'lucide-react';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  UpdateTaskInput,
  ProjectStatus,
  Task,
  EntitySummary,
  FilterOptions,
  Area,
  Priority,
  Goal,
} from '@/types/growth-system';
import { useProjects, useGoals, useTasks } from '@/hooks/useGrowthSystem';
import { useProjectHealthMap } from '@/hooks/useProjectHealthMap';
import { tasksService } from '@/services/growth-system/tasks.service';
import { projectsService } from '@/services/growth-system/projects.service';
import { useQueryClient } from '@tanstack/react-query';
import {
  addTaskDependencyToCache,
  removeTaskDependencyFromCache,
} from '@/lib/react-query/growth-system-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import { getTasksByProject } from '@/utils/growth-system-filters';
import Button from '@/components/atoms/Button';
import { ProjectCard } from '@/components/molecules/ProjectCard';
import { ProjectListItem } from '@/components/molecules/ProjectListItem';
import { ProjectTimelineView } from '@/components/organisms/ProjectTimelineView';
import { ProjectCreateForm } from '@/components/organisms/ProjectCreateForm';
import { ProjectEditForm } from '@/components/organisms/ProjectEditForm';
import { TaskEditPanel } from '@/components/organisms/TaskEditPanel';
import Dialog from '@/components/molecules/Dialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import {
  SUBCATEGORY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  AREAS,
  AREA_LABELS,
  PRIORITIES,
} from '@/constants/growth-system';
import { TaskListItem } from '@/components/molecules/TaskListItem';
import { RelationshipPicker } from '@/components/organisms/RelationshipPicker';
import { AIProjectAssistPanel } from '@/components/molecules/AIProjectAssistPanel';
import { AISuggestionBanner } from '@/components/molecules/AISuggestionBanner';
import { llmConfig } from '@/lib/llm';
import { formatDateString } from '@/utils/date-formatters';
import { cn } from '@/lib/utils';
import { getGoalCriteriaProgressPercent, getProjectDisplayModel } from '@/utils/project-summary';

const STATUSES: ProjectStatus[] = [...PROJECT_STATUSES];
const AREA_OPTIONS: Area[] = [...AREAS];
const PRIORITY_OPTIONS: Priority[] = [...PRIORITIES];

type ViewMode = 'grid' | 'list' | 'timeline';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [projectGoals, setProjectGoals] = useState<Map<string, EntitySummary[]>>(new Map());
  const [isGoalPickerOpen, setIsGoalPickerOpen] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [isGoalSaving, setIsGoalSaving] = useState(false);
  const [goalSaveError, setGoalSaveError] = useState<string | null>(null);
  const [goalActionError, setGoalActionError] = useState<string | null>(null);

  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiMode, setAIMode] = useState<'health' | 'generate' | 'risks'>('health');
  const isAIConfigured = llmConfig.isConfigured();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Use individual hooks to fetch data from their respective endpoints
  const {
    projects,
    isLoading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { tasks, isLoading: tasksLoading, updateTask } = useTasks();

  const isLoading = projectsLoading || goalsLoading || tasksLoading;

  // Convert goals to EntitySummary format
  const allGoals = useMemo<EntitySummary[]>(
    () =>
      goals.map((g) => ({
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

  const goalsById = useMemo(() => new Map(allGoals.map((goal) => [goal.id, goal])), [allGoals]);

  const goalsByIdFull = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  const getLinkedGoalsFull = useCallback(
    (project: Project) =>
      (project.goalIds ?? [])
        .map((id) => goalsByIdFull.get(id))
        .filter((g): g is Goal => g !== undefined),
    [goalsByIdFull]
  );

  const allProjects = useMemo<EntitySummary[]>(
    () =>
      projects.map((project) => ({
        id: project.id,
        title: project.name,
        type: 'project' as const,
        area: project.area,
        status: project.status,
      })),
    [projects]
  );

  // Get tasks for a specific project from dashboard data
  const getProjectTasks = useCallback(
    (projectId: string): Task[] => {
      return getTasksByProject(tasks, projectId);
    },
    [tasks]
  );

  // Convert tasks to EntitySummary format for picker
  const allTasksForPicker = useMemo<EntitySummary[]>(
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

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      return (
        (!searchQuery || project.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!filters.status || project.status === filters.status) &&
        (!filters.area || project.area === filters.area) &&
        (!filters.priority || project.priority === filters.priority)
      );
    });
  }, [projects, searchQuery, filters]);

  const filteredProjectIds = useMemo(
    () => filteredProjects.map((project) => project.id),
    [filteredProjects]
  );

  const { projectHealthMap, isLoading: isHealthLoading } = useProjectHealthMap(filteredProjectIds);

  const getProjectStats = useCallback(
    (projectId: string) => {
      const projectTasks = getTasksByProject(tasks, projectId);
      const completedTasks = projectTasks.filter((t) => t.status === 'Done').length;
      const hasLocalTasks = projectTasks.length > 0;

      if (hasLocalTasks) {
        return {
          taskCount: projectTasks.length,
          completedTaskCount: completedTasks,
          hasHealthData: true,
          isHealthLoading: false,
        };
      }

      const health = projectHealthMap.get(projectId);
      if (health && health.taskCount > 0) {
        return {
          taskCount: health.taskCount,
          completedTaskCount: health.completedTaskCount,
          hasHealthData: true,
          isHealthLoading,
        };
      }

      return {
        taskCount: 0,
        completedTaskCount: 0,
        hasHealthData: health !== undefined,
        isHealthLoading,
      };
    },
    [tasks, projectHealthMap, isHealthLoading]
  );

  const getProjectDisplay = useCallback(
    (project: Project) => {
      const stats = getProjectStats(project.id);
      return getProjectDisplayModel(
        project,
        stats.taskCount,
        stats.completedTaskCount,
        getLinkedGoalsFull(project)
      );
    },
    [getProjectStats, getLinkedGoalsFull]
  );

  const { incompleteProjects, completeProjects } = useMemo(() => {
    const inc: Project[] = [];
    const comp: Project[] = [];
    for (const p of filteredProjects) {
      if (getProjectDisplay(p).isWorkComplete) comp.push(p);
      else inc.push(p);
    }
    return { incompleteProjects: inc, completeProjects: comp };
  }, [filteredProjects, getProjectDisplay]);

  const handleCreateProject = async (input: CreateProjectInput) => {
    setIsSubmitting(true);
    try {
      await createProject(input);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (id: string, input: UpdateProjectInput) => {
    setIsSubmitting(true);
    try {
      const response = await updateProject({ id, input });
      if (response.success && response.data) {
        if (selectedProject && selectedProject.id === id) {
          setSelectedProject(response.data);
        }
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsSubmitting(true);
    try {
      await deleteProject(projectToDelete.id);
      if (selectedProject && selectedProject.id === projectToDelete.id) {
        setSelectedProject(null);
      }
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToGrid = () => {
    setSelectedProject(null);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = useMemo(() => {
    return [filters.area, filters.status, filters.priority].filter(Boolean).length;
  }, [filters]);

  const updateProjectGoals = useCallback(
    (projectId: string, updater: (goals: EntitySummary[]) => EntitySummary[]) => {
      setProjectGoals((prev) => {
        const next = new Map(prev);
        const current = next.get(projectId) || [];
        next.set(projectId, updater(current));
        return next;
      });
    },
    []
  );

  // Parse linked goals from project data when a project is selected
  useEffect(() => {
    if (!selectedProject) return;

    // First, try to parse goalIds directly from the project
    if (selectedProject.goalIds && selectedProject.goalIds.length > 0) {
      const linkedGoalSummaries: EntitySummary[] = selectedProject.goalIds
        .map((goalId) => allGoals.find((g) => g.id === goalId))
        .filter((goal): goal is EntitySummary => goal !== undefined);

      updateProjectGoals(selectedProject.id, () => linkedGoalSummaries);
      return;
    }

    // Fall back to deriving from tasks if goalIds is not available
    const projectTasks = getProjectTasks(selectedProject.id);
    const goalIdsFromTasks = new Set<string>();

    projectTasks.forEach((task) => {
      if (task.goalIds && task.goalIds.length > 0) {
        task.goalIds.forEach((goalId) => goalIdsFromTasks.add(goalId));
      }
    });

    const derivedGoals = allGoals.filter((goal) => goalIdsFromTasks.has(goal.id));
    updateProjectGoals(selectedProject.id, () => derivedGoals);
  }, [selectedProject, allGoals, getProjectTasks, updateProjectGoals]);

  const handleGoalLink = async (projectId: string, goalId: string) => {
    const response = await projectsService.linkToGoal(projectId, goalId);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to link goal');
    }
    // After linking, manually add the goal to the displayed goals
    const goal = goalsById.get(goalId);
    if (goal) {
      updateProjectGoals(projectId, (currentGoals) => {
        // Only add if not already present
        if (!currentGoals.some((g) => g.id === goalId)) {
          return [...currentGoals, goal];
        }
        return currentGoals;
      });
    }
  };

  const handleGoalUnlink = async (projectId: string, goalId: string) => {
    const response = await projectsService.unlinkFromGoal(projectId, goalId);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unlink goal');
    }
    // After unlinking, manually remove the goal from displayed goals
    updateProjectGoals(projectId, (currentGoals) => currentGoals.filter((g) => g.id !== goalId));
  };

  const handleGoalSave = async () => {
    if (!selectedProject) return;

    setIsGoalSaving(true);
    setGoalSaveError(null);

    try {
      const currentGoals = projectGoals.get(selectedProject.id) || [];
      const currentIds = new Set(currentGoals.map((g) => g.id));
      const newIds = new Set(selectedGoalIds);

      const linkIds = selectedGoalIds.filter((id) => !currentIds.has(id));
      const unlinkIds = currentGoals.map((g) => g.id).filter((id) => !newIds.has(id));

      const linkResults = await Promise.allSettled(
        linkIds.map((id) => handleGoalLink(selectedProject.id, id))
      );
      const unlinkResults = await Promise.allSettled(
        unlinkIds.map((id) => handleGoalUnlink(selectedProject.id, id))
      );

      const failedLinks = linkResults.filter((result) => result.status === 'rejected');
      const failedUnlinks = unlinkResults.filter((result) => result.status === 'rejected');

      if (unlinkIds.length > 0) {
        const successfulUnlinks = unlinkIds.filter(
          (_id, index) => unlinkResults[index]?.status === 'fulfilled'
        );
        if (successfulUnlinks.length > 0) {
          updateProjectGoals(selectedProject.id, (goals) =>
            goals.filter((goal) => !successfulUnlinks.includes(goal.id))
          );
        }
      }

      if (linkIds.length > 0) {
        const successfulLinks = linkIds.filter(
          (_id, index) => linkResults[index]?.status === 'fulfilled'
        );
        if (successfulLinks.length > 0) {
          updateProjectGoals(selectedProject.id, (goals) => {
            const next = [...goals];
            successfulLinks.forEach((id) => {
              const goal = goalsById.get(id);
              if (goal && !next.some((existing) => existing.id === id)) {
                next.push(goal);
              }
            });
            return next;
          });
        }
      }

      if (failedLinks.length > 0 || failedUnlinks.length > 0) {
        setGoalSaveError(
          `Failed to update ${failedLinks.length + failedUnlinks.length} goal link${
            failedLinks.length + failedUnlinks.length === 1 ? '' : 's'
          }. Please try again.`
        );
        throw new Error('Goal link updates failed');
      }

      // Note: Local state is already updated above. The project's goalIds will be
      // refreshed from the backend on the next data fetch, and the useEffect will
      // automatically parse and display them.
    } finally {
      setIsGoalSaving(false);
    }
  };

  const handleGoalChipRemove = async (goalId: string) => {
    if (!selectedProject) return;
    setGoalActionError(null);
    try {
      await handleGoalUnlink(selectedProject.id, goalId);
      updateProjectGoals(selectedProject.id, (goals) => goals.filter((goal) => goal.id !== goalId));
      setSelectedGoalIds((prev) => prev.filter((id) => id !== goalId));
    } catch (error) {
      setGoalActionError(error instanceof Error ? error.message : 'Failed to unlink goal');
    }
  };

  const handleCreateTasksFromAI = async (
    newTasks: import('../../types/growth-system').CreateTaskInput[]
  ) => {
    if (!selectedProject) return;

    for (const task of newTasks) {
      const taskInput = {
        ...task,
        area: selectedProject.area,
        projectIds: [selectedProject.id],
      };
      await tasksService.create(taskInput);
    }
    // Note: Tasks will be automatically updated when dashboard data refreshes
  };

  const handleLinkTaskToProject = async (taskId: string, projectId: string) => {
    await tasksService.linkToProject(taskId, projectId);
    // Invalidate tasks query to refresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
  };

  const handleUnlinkTaskFromProject = async (taskId: string, projectId: string) => {
    await tasksService.unlinkFromProject(taskId, projectId);
    // Invalidate tasks query to refresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskEditOpen(true);
  };

  const handleUpdateTask = async (id: string, input: UpdateTaskInput) => {
    setIsTaskSubmitting(true);
    try {
      await updateTask({ id, input });
      // Cache is automatically updated by the mutation
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleTaskLink = async (projectId: string, taskId: string) => {
    await handleLinkTaskToProject(taskId, projectId);
  };

  const handleTaskUnlink = async (projectId: string, taskId: string) => {
    await handleUnlinkTaskFromProject(taskId, projectId);
  };

  const handleTaskSave = () => {
    if (!selectedProject) return;
    const projectTasks = getProjectTasks(selectedProject.id);
    const currentIds = new Set(projectTasks.map((t) => t.id));
    const newIds = new Set(selectedTaskIds);

    currentIds.forEach((id) => {
      if (!newIds.has(id)) {
        handleTaskUnlink(selectedProject.id, id);
      }
    });

    newIds.forEach((id) => {
      if (!currentIds.has(id)) {
        handleTaskLink(selectedProject.id, id);
      }
    });
  };

  if (selectedProject) {
    const projectTasks = getProjectTasks(selectedProject.id);
    const completedTasks = projectTasks.filter((t) => t.status === 'Done').length;
    const goalIdsForDetail =
      selectedProject.goalIds && selectedProject.goalIds.length > 0
        ? selectedProject.goalIds
        : (projectGoals.get(selectedProject.id) || []).map((g) => g.id);
    const linkedFullGoalsForDetail = goalIdsForDetail
      .map((id) => goalsByIdFull.get(id))
      .filter((g): g is Goal => g !== undefined);
    const detailDisplay = getProjectDisplayModel(
      selectedProject,
      projectTasks.length,
      completedTasks,
      linkedFullGoalsForDetail
    );
    const progress = detailDisplay.progressPercent;
    const linkedGoals = projectGoals.get(selectedProject.id) || [];
    const pendingTasks = projectTasks.filter((t) => t.status !== 'Done');
    const doneTasks = projectTasks.filter((t) => t.status === 'Done');
    const getLinkedProjectsForTask = (task: Task) =>
      allProjects.filter((project) => task.projectIds?.includes(project.id));
    const getLinkedGoalsForTask = (task: Task) =>
      allGoals.filter((goal) => task.goalIds?.includes(goal.id));

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <button
            onClick={handleBackToGrid}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 mb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8 mb-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 mb-4">
                  <PriorityIndicator
                    priority={selectedProject.priority}
                    size="lg"
                    className="shrink-0 sm:mt-1"
                  />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                    {selectedProject.name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                  <AreaBadge area={selectedProject.area} />
                  {selectedProject.subCategory && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {SUBCATEGORY_LABELS[selectedProject.subCategory]}
                    </span>
                  )}
                  <StatusBadge status={detailDisplay.effectiveStatus} size="sm" />
                </div>
                {selectedProject.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  'flex w-full flex-shrink-0 flex-row flex-wrap items-center justify-between gap-4',
                  'sm:justify-start lg:w-auto lg:flex-col lg:items-center lg:justify-start'
                )}
              >
                <div className="shrink-0 scale-[0.9] sm:scale-100">
                  <ProgressRing progress={progress} size="lg" showLabel />
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setProjectToDelete(selectedProject)}
                    className="hover:!bg-red-50 hover:!text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {selectedProject.impact > 0 && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impact Score</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star
                          key={starValue}
                          className={cn(
                            'w-5 h-5',
                            starValue <= selectedProject.impact
                              ? 'fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400'
                              : 'fill-none text-gray-300 dark:text-gray-600'
                          )}
                        />
                      ))}
                      <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedProject.impact}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedProject.impact === 5
                          ? 'Very High Impact'
                          : selectedProject.impact === 4
                            ? 'High Impact'
                            : selectedProject.impact === 3
                              ? 'Medium Impact'
                              : selectedProject.impact === 2
                                ? 'Low Impact'
                                : 'Very Low Impact'}
                      </span>
                      {selectedProject.impact === 5 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Max Impact
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selectedProject.startDate && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDateString(selectedProject.startDate) || '—'}
                  </div>
                </div>
              )}
              {selectedProject.targetEndDate && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target End</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDateString(selectedProject.targetEndDate) || '—'}
                  </div>
                </div>
              )}
            </div>

            {selectedProject.notes && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {selectedProject.notes}
                </p>
              </div>
            )}

            {isAIConfigured && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAIAssist(!showAIAssist)}
                  className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                >
                  <Sparkles size={18} />
                  <span>AI Project Tools</span>
                  {showAIAssist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAIAssist && (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setAIMode('health')}
                        className={`px-3 py-1.5 text-sm rounded-full transition ${
                          aiMode === 'health'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Health Analysis
                      </button>
                      <button
                        onClick={() => setAIMode('generate')}
                        className={`px-3 py-1.5 text-sm rounded-full transition ${
                          aiMode === 'generate'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Generate Tasks
                      </button>
                      <button
                        onClick={() => setAIMode('risks')}
                        className={`px-3 py-1.5 text-sm rounded-full transition ${
                          aiMode === 'risks'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Risk Assessment
                      </button>
                    </div>

                    <AIProjectAssistPanel
                      mode={aiMode}
                      project={selectedProject}
                      tasks={projectTasks}
                      onClose={() => setShowAIAssist(false)}
                      onCreateTasks={handleCreateTasksFromAI}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  <CheckSquare className="h-5 w-5 shrink-0" />
                  Tasks ({projectTasks.length})
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={() => {
                    setSelectedTaskIds(projectTasks.map((t) => t.id));
                    setIsTaskPickerOpen(true);
                  }}
                >
                  Link Tasks
                </Button>
              </div>
              {projectTasks.length === 0 ? (
                <EmptyState
                  title="No tasks linked"
                  description="Link tasks to this project to track progress"
                  actionLabel="Link Tasks"
                  onAction={() => setIsTaskPickerOpen(true)}
                />
              ) : (
                <div className="min-w-0 space-y-4">
                  {pendingTasks.length > 0 && (
                    <div className="space-y-3">
                      {pendingTasks.map((task) => (
                        <TaskListItem
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={() => handleUnlinkTaskFromProject(task.id, selectedProject.id)}
                          deleteLabel="Unlink task"
                          deleteAriaLabel={`Unlink ${task.title} from ${selectedProject.name}`}
                          deleteIcon={<Link2Off className="w-4 h-4" />}
                          deleteButtonClassName="hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
                        />
                      ))}
                    </div>
                  )}
                  {doneTasks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Completed ({doneTasks.length})
                      </h3>
                      <div className="space-y-3">
                        {doneTasks.map((task) => (
                          <TaskListItem
                            key={task.id}
                            task={task}
                            onEdit={handleEditTask}
                            onDelete={() =>
                              handleUnlinkTaskFromProject(task.id, selectedProject.id)
                            }
                            deleteLabel="Unlink task"
                            deleteAriaLabel={`Unlink ${task.title} from ${selectedProject.name}`}
                            deleteIcon={<Link2Off className="w-4 h-4" />}
                            deleteButtonClassName="hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-5 lg:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  <Target className="h-5 w-5 shrink-0" />
                  Goals ({linkedGoals.length})
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={() => {
                    setSelectedGoalIds(linkedGoals.map((g) => g.id));
                    setGoalSaveError(null);
                    setGoalActionError(null);
                    setIsGoalPickerOpen(true);
                  }}
                >
                  Link Goals
                </Button>
              </div>
              {goalActionError && (
                <div className="mb-3 text-sm text-red-600 dark:text-red-400">{goalActionError}</div>
              )}
              {linkedGoals.length === 0 ? (
                <EmptyState
                  title="No linked goals"
                  description="Link this project to strategic goals"
                  actionLabel="Link Goals"
                  onAction={() => {
                    setSelectedGoalIds(linkedGoals.map((g) => g.id));
                    setGoalSaveError(null);
                    setGoalActionError(null);
                    setIsGoalPickerOpen(true);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const entries = linkedGoals
                      .map((goalSummary) => {
                        const fullGoal = goals.find((g) => g.id === goalSummary.id);
                        return fullGoal ? { fullGoal } : null;
                      })
                      .filter((x): x is { fullGoal: Goal } => x != null);
                    const pendingGoalRows = entries.filter((e) => e.fullGoal.status !== 'Achieved');
                    const achievedGoalRows = entries.filter(
                      (e) => e.fullGoal.status === 'Achieved'
                    );

                    const renderGoalRow = (fullGoal: Goal) => {
                      const criteriaProgress = getGoalCriteriaProgressPercent(fullGoal);
                      return (
                        <div
                          key={fullGoal.id}
                          className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
                                <PriorityIndicator
                                  priority={fullGoal.priority}
                                  size="sm"
                                  variant="badge"
                                />
                                <Target className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                <h3 className="min-w-0 flex-1 break-words text-base font-semibold leading-tight text-gray-900 dark:text-white sm:truncate">
                                  {fullGoal.title}
                                </h3>
                                <StatusBadge status={fullGoal.status} size="sm" />
                              </div>

                              {fullGoal.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                                  {fullGoal.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                                <AreaBadge area={fullGoal.area} size="sm" />
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  {fullGoal.timeHorizon}
                                </span>
                                {criteriaProgress > 0 && (
                                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                    <span className="text-xs font-medium">{criteriaProgress}%</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleGoalChipRemove(fullGoal.id)}
                                className="!p-2 hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
                                aria-label={`Unlink ${fullGoal.title} from ${selectedProject.name}`}
                              >
                                <Link2Off className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        {pendingGoalRows.length > 0 && (
                          <div className="space-y-3">
                            {pendingGoalRows.map(({ fullGoal }) => renderGoalRow(fullGoal))}
                          </div>
                        )}
                        {achievedGoalRows.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Completed goals ({achievedGoalRows.length})
                            </h3>
                            <div className="space-y-3">
                              {achievedGoalRows.map(({ fullGoal }) => renderGoalRow(fullGoal))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <Dialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="Edit Project"
          className="max-w-2xl"
        >
          <ProjectEditForm
            key={selectedProject.id}
            project={selectedProject}
            onSubmit={handleUpdateProject}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </Dialog>

        <RelationshipPicker
          isOpen={isGoalPickerOpen}
          onClose={() => {
            setIsGoalPickerOpen(false);
            setGoalSaveError(null);
          }}
          title="Link to Goals"
          entities={allGoals}
          selectedIds={selectedGoalIds}
          onSelectionChange={setSelectedGoalIds}
          onSave={handleGoalSave}
          isSaving={isGoalSaving}
          saveError={goalSaveError}
          entityType="goal"
        />

        <RelationshipPicker
          isOpen={isTaskPickerOpen}
          onClose={() => setIsTaskPickerOpen(false)}
          title="Link Tasks to Project"
          entities={allTasksForPicker}
          selectedIds={selectedTaskIds}
          onSelectionChange={setSelectedTaskIds}
          onSave={handleTaskSave}
          entityType="task"
        />

        {selectedTask && (
          <TaskEditPanel
            task={selectedTask}
            isOpen={isTaskEditOpen}
            onClose={() => {
              setIsTaskEditOpen(false);
              setSelectedTask(null);
            }}
            onSave={handleUpdateTask}
            isLoading={isTaskSubmitting}
            availableTasks={tasks}
            availableProjects={allProjects}
            availableGoals={allGoals}
            dependencies={[]}
            blockedBy={[]}
            linkedProjects={getLinkedProjectsForTask(selectedTask)}
            linkedGoals={getLinkedGoalsForTask(selectedTask)}
            onDependencyAdd={async (taskId, dependsOnId) => {
              const response = await tasksService.addDependency(taskId, dependsOnId);
              if (response.success && response.data) {
                addTaskDependencyToCache(queryClient, response.data);
              }
            }}
            onDependencyRemove={async (taskId, dependsOnId) => {
              await tasksService.removeDependency(taskId, dependsOnId);
              removeTaskDependencyFromCache(queryClient, taskId, dependsOnId);
            }}
            onProjectLink={async (taskId, projectId) => {
              await tasksService.linkToProject(taskId, projectId);
              // Invalidate tasks query to refresh data
              queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
            }}
            onProjectUnlink={async (taskId, projectId) => {
              await tasksService.unlinkFromProject(taskId, projectId);
              // Invalidate tasks query to refresh data
              queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
            }}
            onGoalLink={async (taskId, goalId) => {
              await tasksService.linkToGoal(taskId, goalId);
              // Invalidate tasks query to refresh data
              queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
            }}
            onGoalUnlink={async (taskId, goalId) => {
              await tasksService.unlinkFromGoal(taskId, goalId);
              // Invalidate tasks query to refresh data
              queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
            }}
          />
        )}

        <Dialog
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          title="Delete Project"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            {projectToDelete && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {projectToDelete.name}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setProjectToDelete(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteProject}
                disabled={isSubmitting}
                className="!bg-red-600 hover:!bg-red-700"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Projects
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              Manage your projects and track progress
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full shrink-0 sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="relative w-full shrink-0 sm:w-auto"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <div className="flex w-full items-center justify-between gap-1 rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800 sm:w-auto sm:justify-start">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Timeline view"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Timeline</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
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
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: (e.target.value as ProjectStatus) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
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
                    setFilters({
                      ...filters,
                      priority: (e.target.value as Priority) || undefined,
                    })
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
            </div>
          </div>
        )}

        <AISuggestionBanner entityType="project" />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description={
              searchQuery || filters.area || filters.status || filters.priority
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first project'
            }
            actionLabel="Create Project"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <div className="space-y-8">
            {incompleteProjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
                {incompleteProjects.map((project) => {
                  const stats = getProjectStats(project.id);
                  const display = getProjectDisplay(project);
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                      viewMode="grid"
                      display={display}
                      linkedGoalCount={getLinkedGoalsFull(project).length}
                      {...stats}
                    />
                  );
                })}
              </div>
            )}
            {completeProjects.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Completed ({completeProjects.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
                  {completeProjects.map((project) => {
                    const stats = getProjectStats(project.id);
                    const display = getProjectDisplay(project);
                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={handleProjectClick}
                        viewMode="grid"
                        display={display}
                        linkedGoalCount={getLinkedGoalsFull(project).length}
                        {...stats}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="w-full space-y-2">
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredProjects.length}{' '}
              {filteredProjects.length === 1 ? 'project' : 'projects'}
            </div>
            {incompleteProjects.length > 0 && (
              <div className="space-y-2">
                {incompleteProjects.map((project) => {
                  const stats = getProjectStats(project.id);
                  const display = getProjectDisplay(project);
                  return (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                      onEdit={(p) => {
                        setSelectedProject(p);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={setProjectToDelete}
                      display={display}
                      linkedGoalCount={getLinkedGoalsFull(project).length}
                      {...stats}
                    />
                  );
                })}
              </div>
            )}
            {completeProjects.length > 0 && (
              <div className="space-y-2 pt-4">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Completed ({completeProjects.length})
                </h2>
                {completeProjects.map((project) => {
                  const stats = getProjectStats(project.id);
                  const display = getProjectDisplay(project);
                  return (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                      onEdit={(p) => {
                        setSelectedProject(p);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={setProjectToDelete}
                      display={display}
                      linkedGoalCount={getLinkedGoalsFull(project).length}
                      {...stats}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <ProjectTimelineView
            projects={filteredProjects}
            onProjectClick={handleProjectClick}
            projectHealthMap={projectHealthMap}
            isHealthLoading={isHealthLoading}
            resolveProjectDisplay={getProjectDisplay}
          />
        )}
      </div>

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Create New Project"
        className="max-w-2xl"
      >
        <ProjectCreateForm
          onSubmit={handleCreateProject}
          onCancel={() => setIsCreateDialogOpen(false)}
          isLoading={isSubmitting}
        />
      </Dialog>

      <Dialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
          {projectToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white">{projectToDelete.name}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setProjectToDelete(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteProject}
              disabled={isSubmitting}
              className="!bg-red-600 hover:!bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
