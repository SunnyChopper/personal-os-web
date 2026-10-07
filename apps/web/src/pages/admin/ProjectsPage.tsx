import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  Target,
  CheckSquare,
  Sparkles,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Grid2x2,
  Filter,
  Star,
  Link2Off,
  MoreHorizontal,
  Archive,
  RotateCcw,
  GitBranch,
} from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import type {
  Project,
  CreateProjectInput,
  CreateTaskInput,
  UpdateProjectInput,
  UpdateTaskInput,
  ProjectStatus,
  Task,
  EntitySummary,
  FilterOptions,
  Goal,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
  ProjectDependency,
} from '@/types/growth-system';
import { useProjects, useGoals, useTasks, useLogbook } from '@/hooks/useGrowthSystem';
import { useProjectHealthMap } from '@/hooks/useProjectHealthMap';
import {
  useProjectDependencies,
  useProjectDependencyNeighborhood,
  useProjectTimelineUpdate,
} from '@/hooks/useProjectDependencies';
import { tasksService } from '@/services/growth-system/tasks.service';
import { projectsService } from '@/services/growth-system/projects.service';
import { goalsService } from '@/services/growth-system/goals.service';
import { useQueryClient } from '@tanstack/react-query';
import {
  addTaskDependencyToCache,
  removeTaskDependencyFromCache,
} from '@/lib/react-query/growth-system-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  buildLinkedGoalTree,
  getTasksByProject,
  type LinkedGoalNode,
} from '@/utils/growth-system-filters';
import Button from '@/components/atoms/Button';
import { ProjectCard } from '@/components/molecules/ProjectCard';
import { ProjectListItem } from '@/components/molecules/ProjectListItem';
import { ProjectTimelineView } from '@/components/organisms/ProjectTimelineView';
import { ImpactEffortMatrix } from '@/components/organisms/ImpactEffortMatrix';
import ProjectDependencyMiniGraph from '@/components/organisms/ProjectDependencyMiniGraph';
import { EntityMemoryThreadPanel } from '@/components/organisms/growth-system/EntityMemoryThreadPanel';
import { ProjectCreateForm } from '@/components/organisms/ProjectCreateForm';
import { ProjectEditForm } from '@/components/organisms/ProjectEditForm';
import { TaskEditPanel } from '@/components/organisms/TaskEditPanel';
import { TaskCreateForm } from '@/components/organisms/TaskCreateForm';
import { TaskDetailDialog } from '@/components/organisms/TaskDetailDialog';
import { LogbookEditor } from '@/components/organisms/LogbookEditor';
import Dialog from '@/components/molecules/Dialog';
import { ProjectLinkedGoalCard } from '@/components/molecules/ProjectLinkedGoalCard';
import DropdownMenuButton from '@/components/molecules/DropdownMenuButton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { PointBadge } from '@/components/atoms/PointBadge';
import { pointBadgeStatusFromProject } from '@/lib/point-badge';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';
import { TaskListItem } from '@/components/molecules/TaskListItem';
import { ProjectCompletedTasksSection } from '@/components/molecules/ProjectCompletedTasksSection';
import { ProjectsPortfolioCompletedSection } from '@/components/molecules/ProjectsPortfolioCompletedSection';
import { ProjectDetailCollapsible } from '@/components/molecules/ProjectDetailCollapsible';
import { RelationshipPicker } from '@/components/organisms/RelationshipPicker';
import { AIProjectAssistPanel } from '@/components/molecules/AIProjectAssistPanel';
import { EntityExplainButton } from '@/components/molecules/EntityExplainButton';
import { useEntityExplainChatOptional } from '@/contexts/EntityExplainChatContext';
import {
  AI_PROJECT_ASSIST_PANEL_ID,
  AI_PROJECT_TOOL_MODES,
  aiProjectToolPillClassName,
  aiProjectToolTabId,
  type AIProjectToolMode,
} from '@/lib/projects/ai-project-tools-surfaces';
import { taskCreatePrefillFromProject } from '@/lib/projects/task-create-prefill-from-project';
import { AISuggestionBanner } from '@/components/molecules/AISuggestionBanner';
import { AmbientPresenceStrip } from '@/components/organisms/assistant/AmbientPresenceStrip';
import ProjectPortfolioHealthStrip from '@/components/molecules/projects/ProjectPortfolioHealthStrip';
import {
  countPortfolioBuckets,
  resolvePortfolioHealthScore,
} from '@/lib/projects/portfolio-health';
import { llmConfig } from '@/lib/llm';
import { formatDateString } from '@/utils/date-formatters';
import { cn } from '@/lib/utils';
import {
  getGoalCriteriaProgressPercent,
  getProjectDisplayModel,
  resolveProjectBadgeStatus,
  projectProgressRingColor,
} from '@/utils/project-summary';
import { useToast } from '@/hooks/use-toast';
import type { ProjectHealthPriorityAction } from '@/types/llm';
import { formatApiError } from '@/utils/api-error-formatter';
import ProjectsActiveFilterChips from '@/components/molecules/ProjectsActiveFilterChips';
import PriorityLegendInfoTip from '@/components/molecules/PriorityLegendInfoTip';
import ProjectsFiltersBar, {
  PROJECTS_FILTERS_PANEL_ID,
} from '@/components/molecules/ProjectsFiltersBar';
import {
  countProjectsActiveFilters,
  filterProjectsForView,
} from '@/lib/growth-system/projects-filters';
import {
  projectDetailImpactClusterClassName,
  projectDetailImpactRowClassName,
} from '@/lib/projects/project-detail-surfaces';
import { buildProjectNeighborhood } from '@/lib/projects/project-graph-utils';
import { useEntityLogbookLinkPicker } from '@/lib/growth-system/logbook-entity-links';
import { buildGoalDetailUrl } from '@/lib/growth-system/goal-deep-link';

type ViewMode = 'grid' | 'list' | 'timeline' | 'matrix';

export default function ProjectsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [goalLinkWeights, setGoalLinkWeights] = useState<Record<string, number>>({});

  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showDependenciesPanel, setShowDependenciesPanel] = useState(false);
  const [aiMode, setAIMode] = useState<AIProjectToolMode>('health');
  const isAIConfigured = llmConfig.isConfigured();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskInitialValues, setCreateTaskInitialValues] =
    useState<Partial<CreateTaskInput> | null>(null);
  const [createTaskFormKey, setCreateTaskFormKey] = useState(0);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [logActivitySeed, setLogActivitySeed] = useState<{ notes: string } | null>(null);
  const [isCreatingLogActivity, setIsCreatingLogActivity] = useState(false);
  const [isCompletedTasksModalOpen, setIsCompletedTasksModalOpen] = useState(false);
  const [isPortfolioCompletedOpen, setIsPortfolioCompletedOpen] = useState(false);

  const {
    isLogbookPickerOpen,
    setIsLogbookPickerOpen,
    openLogbookPicker,
    logbookPickerEntities,
    selectedLogbookIds,
    setSelectedLogbookIds,
    handleLogbookSave,
    isLogbookSaving,
    isLogbookLoading,
    logbookSaveError,
    setLogbookSaveError,
    memoryReloadKey,
    bumpMemoryReload,
  } = useEntityLogbookLinkPicker({
    entityType: 'project',
    entityId: selectedProject?.id ?? '',
    entityName: selectedProject?.name ?? '',
    onError: (message) => {
      showToast({ type: 'error', title: 'Could not open logbook picker', message });
    },
  });
  const explainChat = useEntityExplainChatOptional();

  // Use individual hooks to fetch data from their respective endpoints
  const {
    projects,
    isLoading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { tasks, isLoading: tasksLoading, updateTask, createTask, deleteTask } = useTasks();
  const { createEntry: createLogbookEntry } = useLogbook();

  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [deleteTaskError, setDeleteTaskError] = useState<string | null>(null);

  const isLoading = projectsLoading || goalsLoading || tasksLoading;

  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (!projectId || projectsLoading) return;
    const match = projects.find((project) => project.id === projectId);
    if (!match) return;
    setSelectedProject(match);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('projectId');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, projects, projectsLoading]);

  // Convert goals to EntitySummary format
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
          updatedAt: g.updatedAt,
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
      projects
        .filter((project) => project.status !== 'Archived')
        .map((project) => ({
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
        updatedAt: t.updatedAt,
      })),
    [tasks]
  );

  const filteredProjects = useMemo(() => {
    return filterProjectsForView(projects, {
      searchQuery,
      filters: {
        area: filters.area,
        status: filters.status as ProjectStatus | undefined,
        priority: filters.priority,
      },
    });
  }, [projects, searchQuery, filters]);

  const filteredProjectIds = useMemo(
    () => filteredProjects.map((project) => project.id),
    [filteredProjects]
  );

  const openProjectIds = useMemo(
    () =>
      projects
        .filter(
          (project) =>
            project.status === 'Planning' ||
            project.status === 'Active' ||
            project.status === 'On Hold'
        )
        .map((project) => project.id),
    [projects]
  );

  const { projectHealthMap, isLoading: isHealthLoading } = useProjectHealthMap(openProjectIds);

  const {
    dependencies: projectDependencies,
    addDependency: addProjectDependency,
    removeDependency: removeProjectDependency,
  } = useProjectDependencies(filteredProjectIds);
  const projectTimelineUpdate = useProjectTimelineUpdate();

  const {
    predecessors: detailPredecessors,
    successors: detailSuccessors,
    edgeCount: detailDepEdgeCount,
    isLoading: isDetailDepsLoading,
  } = useProjectDependencyNeighborhood(selectedProject?.id);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const detailGraphNeighborhood = useMemo(() => {
    if (!selectedProject) return null;
    return buildProjectNeighborhood({
      focusProject: selectedProject,
      predecessors: detailPredecessors,
      successors: detailSuccessors,
      projectsById,
    });
  }, [selectedProject, detailPredecessors, detailSuccessors, projectsById]);

  useEffect(() => {
    if (selectedProject) {
      setShowDependenciesPanel(detailDepEdgeCount > 0);
    } else {
      setShowDependenciesPanel(false);
    }
  }, [selectedProject?.id, detailDepEdgeCount]);

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
  const activeSelectedProjectId: string | undefined = selectedProject?.id ?? undefined;

  const portfolioBucketCounts = useMemo(
    () => countPortfolioBuckets(projects, getProjectDisplay),
    [projects, getProjectDisplay]
  );

  const portfolioHealthScore = useMemo(
    () => resolvePortfolioHealthScore(projects, projectHealthMap),
    [projects, projectHealthMap]
  );

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

  const handleUpdateProject = async (id: string, input: UpdateProjectInput): Promise<void> => {
    setIsSubmitting(true);
    try {
      const response = await updateProject({ id, input });
      if (response.success && response.data) {
        const updated = 'project' in response.data ? response.data.project : response.data;
        if (selectedProject && selectedProject.id === id) {
          setSelectedProject(updated);
        }
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWeeklyRiskPinChange = useCallback(
    async (pinned: boolean): Promise<boolean> => {
      if (!selectedProject) return false;
      const response = await updateProject({
        id: selectedProject.id,
        input: { weeklyRiskAssessmentPinned: pinned },
      });
      if (response?.success && response.data) {
        const updated = 'project' in response.data ? response.data.project : response.data;
        setSelectedProject(updated);
        showToast({
          type: 'success',
          title: pinned
            ? 'Project pinned for weekly risk assessment'
            : 'Weekly risk assessment pin removed',
        });
        return true;
      }
      showToast({
        type: 'error',
        title: 'Could not update pin',
        message:
          response?.error?.message ||
          'You may already have five projects pinned for weekly review.',
      });
      return false;
    },
    [selectedProject, updateProject, showToast]
  );

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

  const handleArchiveProject = async (project: Project) => {
    setIsSubmitting(true);
    try {
      const response = await updateProject({
        id: project.id,
        input: { status: 'Archived' },
      });
      if (response.success && response.data) {
        const updated = 'project' in response.data ? response.data.project : response.data;
        if (selectedProject?.id === project.id) {
          setSelectedProject(updated);
        }
      }
    } catch (error) {
      console.error('Failed to archive project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviveProject = async (project: Project) => {
    setIsSubmitting(true);
    try {
      const response = await updateProject({
        id: project.id,
        input: { status: 'Active' },
      });
      if (response.success && response.data) {
        const updated = 'project' in response.data ? response.data.project : response.data;
        if (selectedProject?.id === project.id) {
          setSelectedProject(updated);
        }
      }
    } catch (error) {
      console.error('Failed to revive project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleDetailGraphProjectClick = useCallback(
    (projectId: string) => {
      const project = projects.find((entry) => entry.id === projectId);
      if (project) {
        handleProjectClick(project);
      }
    },
    [projects]
  );

  const handleRemoveDetailDependency = useCallback(
    async (dependency: ProjectDependency) => {
      try {
        await removeProjectDependency({
          successorProjectId: dependency.successorProjectId,
          predecessorProjectId: dependency.predecessorProjectId,
        });
        showToast({ type: 'success', title: 'Dependency removed' });
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Could not remove dependency',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred. Please try again.',
        });
      }
    },
    [removeProjectDependency, showToast]
  );

  const handleBackToGrid = () => {
    setSelectedProject(null);
    setIsCompletedTasksModalOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const selectedStatusFilter = filters.status as ProjectStatus | undefined;

  const activeFilterCount = useMemo(
    () =>
      countProjectsActiveFilters({
        selectedArea: filters.area,
        selectedStatus: selectedStatusFilter,
        selectedPriority: filters.priority,
      }),
    [filters.area, selectedStatusFilter, filters.priority]
  );

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

  useEffect(() => {
    if (!selectedProject?.goalIds?.length) {
      setGoalLinkWeights({});
      return;
    }

    let cancelled = false;
    const loadWeights = async () => {
      const weights: Record<string, number> = {};
      await Promise.all(
        selectedProject.goalIds!.map(async (goalId) => {
          const response = await goalsService.getLinks(goalId);
          if (!response.success || !response.data) return;
          const link = response.data.projects.find(
            (projectLink) => projectLink.entityId === selectedProject.id
          );
          if (link) {
            weights[goalId] = link.contributionWeight ?? 1;
          }
        })
      );
      if (!cancelled) {
        setGoalLinkWeights(weights);
      }
    };

    void loadWeights();
    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id, selectedProject?.goalIds]);

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
      setGoalLinkWeights((prev) => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
    } catch (error) {
      setGoalActionError(error instanceof Error ? error.message : 'Failed to unlink goal');
    }
  };

  const handleGoalContributionWeightChange = async (goalId: string, contributionWeight: number) => {
    if (!selectedProject) return;
    setGoalActionError(null);
    const response = await projectsService.updateGoalLinkWeight(
      selectedProject.id,
      goalId,
      contributionWeight
    );
    if (!response.success) {
      setGoalActionError(response.error?.message ?? 'Failed to update contribution weight');
      return;
    }
    setGoalLinkWeights((prev) => ({ ...prev, [goalId]: contributionWeight }));
  };

  const handleOpenLinkedGoal = useCallback(
    (goal: Goal) => {
      if (!selectedProject) return;
      navigate(buildGoalDetailUrl(goal.id, selectedProject.id));
    },
    [navigate, selectedProject]
  );

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

  const priorityActionToTaskPrefill = (text: string): Partial<CreateTaskInput> => {
    const title = text.length > 100 ? `${text.slice(0, 97)}...` : text;
    return {
      title,
      description: text,
    };
  };

  const openCreateTaskDialog = (extra?: Partial<CreateTaskInput>) => {
    if (!selectedProject) return;
    setCreateTaskInitialValues({
      ...taskCreatePrefillFromProject(selectedProject),
      ...extra,
    });
    setCreateTaskFormKey((key) => key + 1);
    setIsCreateTaskOpen(true);
  };

  const handleCreateTaskFromHealthAction = (action: ProjectHealthPriorityAction) => {
    openCreateTaskDialog(priorityActionToTaskPrefill(action.text));
  };

  const handleLogActivityFromHealthAction = (action: ProjectHealthPriorityAction) => {
    setLogActivitySeed({ notes: action.text });
    setIsLogActivityOpen(true);
  };

  const handleCreateTaskForProject = async (input: CreateTaskInput) => {
    if (!selectedProject) return;
    setIsCreatingTask(true);
    try {
      const response = await createTask({
        ...input,
        projectIds: [selectedProject.id],
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to create task');
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.growthSystem.projects.lists(),
      });
      setIsCreateTaskOpen(false);
      setCreateTaskInitialValues(null);
      showToast({
        type: 'success',
        title: 'Task created',
        message: `"${input.title}" linked to ${selectedProject.name}.`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create task. Please try again.';
      showToast({
        type: 'error',
        title: 'Failed to create task',
        message,
      });
      throw err;
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateLogActivityForProject = async (
    input: CreateLogbookEntryInput | UpdateLogbookEntryInput
  ) => {
    if (!selectedProject) return;
    setIsCreatingLogActivity(true);
    try {
      const createInput = input as CreateLogbookEntryInput;
      const response = await createLogbookEntry(createInput);
      if (!response.success || !response.data) {
        throw new Error(formatApiError(response.error));
      }
      setIsLogActivityOpen(false);
      setLogActivitySeed(null);
      bumpMemoryReload();
      showToast({
        type: 'success',
        title: 'Activity logged',
        message: `Entry linked to ${selectedProject.name}.`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to log activity. Please try again.';
      showToast({
        type: 'error',
        title: 'Failed to log activity',
        message,
      });
      throw err;
    } finally {
      setIsCreatingLogActivity(false);
    }
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

  const handleViewTask = (task: Task) => {
    setTaskToView(task);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteTaskError(null);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setDeleteTaskError(null);
    setIsDeletingTask(true);
    try {
      await deleteTask(taskToDelete.id);
      showToast({
        type: 'success',
        title: 'Task moved to trash',
        message: `"${taskToDelete.title}" can be restored from Deleted filter.`,
      });
      setTaskToDelete(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete task. Please try again.';
      setDeleteTaskError(errorMessage);
      showToast({
        type: 'error',
        title: 'Failed to delete task',
        message: errorMessage,
      });
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleUpdateTask = async (id: string, input: UpdateTaskInput) => {
    setIsTaskSubmitting(true);
    try {
      const response = await updateTask({ id, input });
      if (response.success && response.data && selectedTask?.id === id) {
        setSelectedTask(response.data);
      }
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
    const detailProgressRingColor = projectProgressRingColor(
      resolveProjectBadgeStatus(selectedProject, detailDisplay)
    );
    const linkedGoals = projectGoals.get(selectedProject.id) || [];
    const linkedGoalTree = buildLinkedGoalTree(
      linkedGoals.map((g) => g.id),
      goals
    );
    const rootGoalCount = linkedGoalTree.length;
    const pendingTasks = projectTasks.filter((t) => t.status !== 'Done');
    const doneTasks = [...projectTasks.filter((t) => t.status === 'Done')].sort((a, b) => {
      const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
      const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
      return dateB - dateA;
    });
    const mostRecentDoneTask = doneTasks[0];
    const olderDoneTasks = doneTasks.slice(1);
    const getLinkedProjectsForTask = (task: Task) =>
      allProjects.filter((project) => task.projectIds?.includes(project.id));
    const getLinkedGoalsForTask = (task: Task) =>
      allGoals.filter((goal) => task.goalIds?.includes(goal.id));
    const openProjectExplain = () => {
      explainChat?.open({
        entityType: 'project',
        entity: selectedProject,
        projectEnrichment: {
          taskCount: projectTasks.length,
          completedTaskCount: completedTasks,
          linkedGoalCount: linkedGoals.length,
          progressPercent: progress,
        },
      });
    };

    return (
      <PageContainer className="py-6 sm:py-8">
        <button
          onClick={handleBackToGrid}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <PriorityIndicator
                  priority={selectedProject.priority}
                  size="lg"
                  className="shrink-0 sm:mt-1"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                    {selectedProject.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <AreaBadge area={selectedProject.area} />
                    {selectedProject.subCategory && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {SUBCATEGORY_LABELS[selectedProject.subCategory]}
                      </span>
                    )}
                    <StatusBadge
                      status={resolveProjectBadgeStatus(selectedProject, detailDisplay)}
                      size="sm"
                      appearance="quiet"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <div className="shrink-0 scale-75 sm:scale-90 md:scale-100">
                <ProgressRing
                  progress={progress}
                  size="md"
                  showLabel
                  color={detailProgressRingColor}
                />
              </div>
              {explainChat != null ? (
                <EntityExplainButton
                  entityType="project"
                  entityTitle={selectedProject.name}
                  onClick={openProjectExplain}
                  alwaysVisible
                />
              ) : null}
              <DropdownMenuButton
                icon={MoreHorizontal}
                ariaLabel="Project options"
                align="end"
                items={[
                  {
                    key: 'edit',
                    label: 'Edit',
                    icon: Edit2,
                    onClick: () => setIsEditDialogOpen(true),
                  },
                  ...(selectedProject.status === 'Archived'
                    ? [
                        {
                          key: 'revive',
                          label: 'Revive',
                          icon: RotateCcw,
                          onClick: () => void handleReviveProject(selectedProject),
                        },
                      ]
                    : [
                        {
                          key: 'archive',
                          label: 'Archive',
                          icon: Archive,
                          onClick: () => void handleArchiveProject(selectedProject),
                        },
                      ]),
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    tone: 'danger' as const,
                    onClick: () => setProjectToDelete(selectedProject),
                  },
                ]}
              />
            </div>
          </div>

          {selectedProject.description && (
            <p className="mb-3 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
              {selectedProject.description}
            </p>
          )}

          <div className={projectDetailImpactRowClassName}>
            {selectedProject.impact > 0 && (
              <div className={projectDetailImpactClusterClassName}>
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
            {(selectedProject.completionBonusPoints ?? 0) > 0 &&
            selectedProject.rewardLedgerStatus === 'awarded' ? (
              <div className={projectDetailImpactClusterClassName}>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Completion bonus
                </div>
                <div className="flex items-center gap-2">
                  <PointBadge
                    value={selectedProject.completionBonusPoints ?? 0}
                    status={pointBadgeStatusFromProject(selectedProject)}
                    size="md"
                    showPlus
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Wallet credit for completing this project
                  </span>
                </div>
              </div>
            ) : null}
            {selectedProject.startDate && (
              <div className={projectDetailImpactClusterClassName}>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDateString(selectedProject.startDate) || '—'}
                </div>
              </div>
            )}
            {selectedProject.targetEndDate && (
              <div className={projectDetailImpactClusterClassName}>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target End</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDateString(selectedProject.targetEndDate) || '—'}
                </div>
              </div>
            )}
          </div>

          {selectedProject.notes && (
            <ProjectDetailCollapsible
              key={`notes-${selectedProject.id}`}
              title="Notes"
              defaultOpen={false}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {selectedProject.notes}
              </p>
            </ProjectDetailCollapsible>
          )}

          <EntityMemoryThreadPanel
            key={`memory-${selectedProject.id}`}
            entityType="project"
            entityId={selectedProject.id}
            fetchThread={projectsService.getMemoryThread}
            onEmptyAction={openLogbookPicker}
            reloadKey={memoryReloadKey}
            isEmptyActionLoading={isLogbookLoading}
            collapsible
            defaultOpen={false}
          />

          <ProjectDetailCollapsible
            key={`deps-${selectedProject.id}`}
            title="Dependencies"
            count={detailDepEdgeCount}
            icon={GitBranch}
            isOpen={showDependenciesPanel}
            onOpenChange={setShowDependenciesPanel}
          >
            {selectedProject && detailGraphNeighborhood ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Finish-to-start links with this project. Drag the right connector on the Timeline
                  to add new dependencies.
                </p>
                <ProjectDependencyMiniGraph
                  focusProject={selectedProject}
                  projects={detailGraphNeighborhood.projects}
                  dependencies={detailGraphNeighborhood.dependencies}
                  isLoading={isDetailDepsLoading}
                  onProjectClick={handleDetailGraphProjectClick}
                  onRemoveDependency={handleRemoveDetailDependency}
                />
              </div>
            ) : null}
          </ProjectDetailCollapsible>

          {isAIConfigured && (
            <ProjectDetailCollapsible
              key={`ai-${selectedProject.id}`}
              title="AI Project Tools"
              icon={Sparkles}
              tone="amber"
              isOpen={showAIAssist}
              onOpenChange={setShowAIAssist}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="AI project tools">
                  {AI_PROJECT_TOOL_MODES.map(({ id, label }) => {
                    const tabId = aiProjectToolTabId(id);
                    const selected = aiMode === id;
                    return (
                      <button
                        key={id}
                        id={tabId}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={AI_PROJECT_ASSIST_PANEL_ID}
                        onClick={() => setAIMode(id)}
                        className={aiProjectToolPillClassName(selected)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <AIProjectAssistPanel
                  mode={aiMode}
                  project={selectedProject}
                  tasks={projectTasks}
                  onClose={() => setShowAIAssist(false)}
                  onCreateTasks={handleCreateTasksFromAI}
                  onCreateTaskFromAction={handleCreateTaskFromHealthAction}
                  onLogActivityFromAction={handleLogActivityFromHealthAction}
                  onRequestGenerateTasks={() => setAIMode('generate')}
                  onWeeklyRiskPinChange={handleWeeklyRiskPinChange}
                  labelledBy={aiProjectToolTabId(aiMode)}
                />
              </div>
            </ProjectDetailCollapsible>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                <CheckSquare className="h-5 w-5 shrink-0" />
                Tasks ({projectTasks.length})
              </h2>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => openCreateTaskDialog()}
                >
                  Create Task
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setSelectedTaskIds(projectTasks.map((t) => t.id));
                    setIsTaskPickerOpen(true);
                  }}
                >
                  Link Tasks
                </Button>
              </div>
            </div>
            {projectTasks.length === 0 ? (
              <EmptyState
                title="No tasks linked"
                description="Create a new task linked to this project, or link existing tasks"
                actionLabel="Create Task"
                onAction={() => openCreateTaskDialog()}
                secondaryActionLabel="Link Tasks"
                onSecondaryAction={() => {
                  setSelectedTaskIds([]);
                  setIsTaskPickerOpen(true);
                }}
              />
            ) : (
              <div className="min-w-0 space-y-4">
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        presentation="project"
                        onView={handleViewTask}
                        onClick={handleViewTask}
                        onEdit={handleEditTask}
                        onUnlink={() => handleUnlinkTaskFromProject(task.id, selectedProject.id)}
                        onDelete={handleDeleteTask}
                        deleteLabel="Unlink task"
                        deleteAriaLabel={`Unlink ${task.title} from ${selectedProject.name}`}
                        deleteIcon={<Link2Off className="w-4 h-4" />}
                        deleteButtonClassName="hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
                      />
                    ))}
                  </div>
                )}
                {doneTasks.length > 0 && mostRecentDoneTask && (
                  <ProjectCompletedTasksSection
                    key={selectedProject.id}
                    doneTasks={doneTasks}
                    mostRecentDoneTask={mostRecentDoneTask}
                    olderDoneTasks={olderDoneTasks}
                    projectName={selectedProject.name}
                    onView={handleViewTask}
                    onEdit={handleEditTask}
                    onUnlink={(taskId) => handleUnlinkTaskFromProject(taskId, selectedProject.id)}
                    onDelete={handleDeleteTask}
                    onViewAllCompleted={() => setIsCompletedTasksModalOpen(true)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-5 lg:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                <Target className="h-5 w-5 shrink-0" />
                Goals ({rootGoalCount})
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
                  const pendingGoalRoots = linkedGoalTree.filter(
                    (node) => node.goal.status !== 'Achieved'
                  );
                  const achievedGoalRoots = linkedGoalTree.filter(
                    (node) => node.goal.status === 'Achieved'
                  );

                  const renderGoalNode = (node: LinkedGoalNode, depth = 0) => {
                    const { goal: fullGoal, children } = node;
                    const criteriaProgress = getGoalCriteriaProgressPercent(fullGoal);
                    const isEmbedded = depth > 0;

                    return (
                      <div key={fullGoal.id} className={cn(isEmbedded && 'ml-3 sm:ml-4')}>
                        <ProjectLinkedGoalCard
                          goal={fullGoal}
                          projectName={selectedProject.name}
                          criteriaProgress={criteriaProgress}
                          isEmbedded={isEmbedded}
                          showContributionWeight={depth === 0}
                          contributionWeight={goalLinkWeights[fullGoal.id] ?? 1}
                          onOpen={handleOpenLinkedGoal}
                          onContributionWeightChange={
                            depth === 0
                              ? (weight) => handleGoalContributionWeightChange(fullGoal.id, weight)
                              : undefined
                          }
                          onUnlink={() => void handleGoalChipRemove(fullGoal.id)}
                        />

                        {children.length > 0 && (
                          <div
                            className="mt-2 space-y-2 border-l-2 border-blue-200/70 pl-3 dark:border-blue-800/50"
                            role="group"
                            aria-label={`Sub-goals under ${fullGoal.title}`}
                          >
                            {children.map((child) => renderGoalNode(child, depth + 1))}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <>
                      {pendingGoalRoots.length > 0 && (
                        <div className="space-y-3">
                          {pendingGoalRoots.map((node) => renderGoalNode(node))}
                        </div>
                      )}
                      {achievedGoalRoots.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Completed goals ({achievedGoalRoots.length})
                          </h3>
                          <div className="space-y-3">
                            {achievedGoalRoots.map((node) => renderGoalNode(node))}
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

        <Dialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="Edit Project"
          className="max-w-2xl"
        >
          <ProjectEditForm
            key={selectedProject.id}
            project={selectedProject}
            onSubmit={async (id, input) => {
              await handleUpdateProject(id, input);
            }}
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
          contextArea={selectedProject.area}
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
          contextArea={selectedProject.area}
        />

        <RelationshipPicker
          isOpen={isLogbookPickerOpen}
          onClose={() => {
            setIsLogbookPickerOpen(false);
            setLogbookSaveError(null);
          }}
          title="Link logbook entries"
          entities={logbookPickerEntities}
          selectedIds={selectedLogbookIds}
          onSelectionChange={setSelectedLogbookIds}
          onSave={handleLogbookSave}
          isSaving={isLogbookSaving}
          saveError={logbookSaveError}
          entityType="logbook"
        />

        <Dialog
          isOpen={isCompletedTasksModalOpen}
          onClose={() => setIsCompletedTasksModalOpen(false)}
          title={`Completed tasks (${doneTasks.length})`}
          size="lg"
          className="max-w-2xl"
        >
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                presentation="projectCompletedModal"
                onView={handleViewTask}
                onClick={handleViewTask}
                onEdit={(t) => {
                  setIsCompletedTasksModalOpen(false);
                  handleEditTask(t);
                }}
                onUnlink={() => handleUnlinkTaskFromProject(task.id, selectedProject.id)}
                onDelete={handleDeleteTask}
                deleteLabel="Unlink task"
                deleteAriaLabel={`Unlink ${task.title} from ${selectedProject.name}`}
                deleteIcon={<Link2Off className="w-4 h-4" />}
                deleteButtonClassName="hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
              />
            ))}
          </div>
        </Dialog>

        <TaskDetailDialog
          task={taskToView}
          isOpen={isDetailDialogOpen}
          layer={isCompletedTasksModalOpen ? 'nested' : undefined}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setTaskToView(null);
          }}
          onEdit={(t) => {
            setIsDetailDialogOpen(false);
            setTaskToView(null);
            setIsCompletedTasksModalOpen(false);
            handleEditTask(t);
          }}
        />

        <Dialog
          isOpen={!!taskToDelete}
          onClose={() => !isDeletingTask && setTaskToDelete(null)}
          title="Move to trash"
          layer={isCompletedTasksModalOpen ? 'nested' : undefined}
        >
          <div className="space-y-4 relative">
            {deleteTaskError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{deleteTaskError}</p>
              </div>
            )}

            <p className="text-gray-700 dark:text-gray-300">
              Move &quot;{taskToDelete?.title}&quot; to trash? You can restore it later from the
              Deleted filter.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setTaskToDelete(null);
                  setDeleteTaskError(null);
                }}
                disabled={isDeletingTask}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTask} disabled={isDeletingTask}>
                {isDeletingTask ? 'Moving...' : 'Move to trash'}
              </Button>
            </div>
          </div>
        </Dialog>

        <Dialog
          isOpen={isCreateTaskOpen}
          onClose={() => {
            setIsCreateTaskOpen(false);
            setCreateTaskInitialValues(null);
          }}
          title={`Create Task in ${selectedProject.name}`}
          className="max-w-2xl"
        >
          <TaskCreateForm
            key={createTaskFormKey}
            initialValues={createTaskInitialValues ?? undefined}
            dependencyPickerEntities={allTasksForPicker}
            onSubmit={handleCreateTaskForProject}
            onCancel={() => {
              setIsCreateTaskOpen(false);
              setCreateTaskInitialValues(null);
            }}
            isLoading={isCreatingTask}
          />
        </Dialog>

        <Dialog
          isOpen={isLogActivityOpen}
          onClose={() => {
            setIsLogActivityOpen(false);
            setLogActivitySeed(null);
          }}
          title="Log activity"
          className="max-w-2xl"
        >
          <LogbookEditor
            key={logActivitySeed?.notes ?? 'log-activity'}
            defaultNotes={logActivitySeed?.notes}
            defaultLinkedEntities={
              selectedProject
                ? [
                    {
                      entityType: 'project',
                      entityId: selectedProject.id,
                      entityName: selectedProject.name,
                    },
                  ]
                : []
            }
            onSubmit={handleCreateLogActivityForProject}
            onCancel={() => {
              setIsLogActivityOpen(false);
              setLogActivitySeed(null);
            }}
            isLoading={isCreatingLogActivity}
          />
        </Dialog>

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
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Projects</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            <span>Manage your projects and track progress</span>
            <PriorityLegendInfoTip />
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
          aria-expanded={showFilters}
          aria-controls={PROJECTS_FILTERS_PANEL_ID}
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
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              viewMode === 'matrix'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Impact vs effort matrix"
          >
            <Grid2x2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Matrix</span>
          </button>
        </div>
      </div>

      <ProjectsActiveFilterChips
        selectedArea={filters.area}
        selectedStatus={selectedStatusFilter}
        selectedPriority={filters.priority}
        onAreaChange={(area) => setFilters({ ...filters, area })}
        onStatusChange={(status) => setFilters({ ...filters, status })}
        onPriorityChange={(priority) => setFilters({ ...filters, priority })}
        onClearAll={handleClearFilters}
      />

      {showFilters && (
        <div className="mb-4 min-w-0 overflow-hidden">
          <ProjectsFiltersBar
            selectedArea={filters.area}
            onAreaChange={(area) => setFilters({ ...filters, area })}
            selectedStatus={selectedStatusFilter}
            onStatusChange={(status) => setFilters({ ...filters, status })}
            selectedPriority={filters.priority}
            onPriorityChange={(priority) => setFilters({ ...filters, priority })}
            activeFilterCount={activeFilterCount}
            onClearAll={handleClearFilters}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {!isLoading && projects.length > 0 ? (
        <ProjectPortfolioHealthStrip
          className="mb-4"
          counts={portfolioBucketCounts}
          portfolioHealthScore={portfolioHealthScore}
          isLoading={isHealthLoading}
        />
      ) : null}

      <AmbientPresenceStrip surface="growthProjects" />
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
            <ProjectsPortfolioCompletedSection
              count={completeProjects.length}
              isOpen={isPortfolioCompletedOpen}
              onOpenChange={setIsPortfolioCompletedOpen}
              contentClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch"
            >
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
            </ProjectsPortfolioCompletedSection>
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
                    onArchive={handleArchiveProject}
                    onRevive={handleReviveProject}
                    display={display}
                    linkedGoalCount={getLinkedGoalsFull(project).length}
                    {...stats}
                  />
                );
              })}
            </div>
          )}
          {completeProjects.length > 0 && (
            <ProjectsPortfolioCompletedSection
              count={completeProjects.length}
              isOpen={isPortfolioCompletedOpen}
              onOpenChange={setIsPortfolioCompletedOpen}
              className="pt-4"
              contentClassName="space-y-2"
            >
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
                    onArchive={handleArchiveProject}
                    onRevive={handleReviveProject}
                    display={display}
                    linkedGoalCount={getLinkedGoalsFull(project).length}
                    {...stats}
                  />
                );
              })}
            </ProjectsPortfolioCompletedSection>
          )}
        </div>
      ) : viewMode === 'matrix' ? (
        <ImpactEffortMatrix
          projects={incompleteProjects}
          tasks={tasks}
          onSelectProject={handleProjectClick}
          selectedProjectId={activeSelectedProjectId}
        />
      ) : (
        <ProjectTimelineView
          projects={filteredProjects}
          dependencies={projectDependencies}
          onProjectClick={handleProjectClick}
          onProjectDatesChange={async (projectId, dates) => {
            await projectTimelineUpdate.mutateAsync({
              id: projectId,
              startDate: dates.startDate,
              targetEndDate: dates.targetEndDate,
            });
          }}
          onAddDependency={async (successorProjectId, predecessorProjectId) => {
            await addProjectDependency({ successorProjectId, predecessorProjectId });
          }}
          projectHealthMap={projectHealthMap}
          isHealthLoading={isHealthLoading}
          resolveProjectDisplay={getProjectDisplay}
        />
      )}
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
    </PageContainer>
  );
}
