import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import {
  tasksService,
  habitsService,
  metricsService,
  goalsService,
  projectsService,
  logbookService,
} from '@/services/growth-system';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateHabitInput,
  UpdateHabitInput,
  CreateMetricInput,
  UpdateMetricInput,
  CreateMetricLogInput,
  CreateGoalInput,
  UpdateGoalInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
  LogbookEntry,
} from '@/types/growth-system';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import {
  removeGoalCache,
  removeHabitCache,
  removeLogbookEntryCache,
  removeMetricCache,
  upsertMetricCache,
  addMetricLogToCache,
  removeMetricLogFromCache,
  removeProjectCache,
  removeTaskCache,
  upsertGoalCache,
  upsertHabitCache,
  upsertLogbookEntryCache,
  upsertProjectCache,
  upsertTaskCache,
  mergeTaskWithUpdate,
  findTaskInClientCache,
} from '@/lib/react-query/growth-system-cache';

// TODO: These hooks use React Query to fetch data from backend API
// Currently will fail until backend is implemented or mock data is provided
// Auth requirement is temporarily bypassed (see ProtectedRoute component)

export const useTasks = () => {
  // TODO: Temporarily not checking user authentication (bypassed in ProtectedRoute)
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  // Block list fetches while the dashboard query is pending/successful
  const dashboardQueryState = queryClient.getQueryState(queryKeys.growthSystem.data());
  const dashboardControlsLoading = !!dashboardQueryState && dashboardQueryState.status !== 'error';

  // TODO: Temporarily allowing queries without user authentication
  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.tasks.lists(),
    queryFn: async () => {
      try {
        const result = await tasksService.getAll();
        // Record success if we got data
        if (result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !dashboardControlsLoading, // Only fetch if dashboard isn't controlling data
    staleTime: 10 * 60 * 1000, // 10 minutes - goals don't change frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertTaskCache(queryClient, response.data);
      }
    },
  });

  type TaskUpdateContext = {
    previousLists: [QueryKey, unknown][];
    previousDashboards: [QueryKey, unknown][];
    detailKey: ReturnType<typeof queryKeys.growthSystem.tasks.detail>;
    previousDetail: unknown;
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      const response = await tasksService.update(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update task');
      }
      return response;
    },
    onMutate: async ({ id, input }): Promise<TaskUpdateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.growthSystem.tasks.all() });
      await queryClient.cancelQueries({ queryKey: queryKeys.growthSystem.data() });

      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.growthSystem.tasks.lists(),
      });
      const previousDashboards = queryClient.getQueriesData({
        queryKey: queryKeys.growthSystem.data(),
      });
      const detailKey = queryKeys.growthSystem.tasks.detail(id);
      const previousDetail = queryClient.getQueryData(detailKey);

      const existing = findTaskInClientCache(queryClient, id);
      if (existing) {
        upsertTaskCache(queryClient, mergeTaskWithUpdate(existing, input));
      }

      return { previousLists, previousDashboards, detailKey, previousDetail };
    },
    onError: (_err, _variables, context) => {
      if (!context) return;
      context.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context.previousDashboards.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      queryClient.setQueryData(context.detailKey, context.previousDetail);
    },
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        upsertTaskCache(queryClient, response.data);
        if (variables.input.status !== undefined) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
        }
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await tasksService.complete(id);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to complete task');
      }
      return response;
    },
    onMutate: async (id): Promise<TaskUpdateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.growthSystem.tasks.all() });
      await queryClient.cancelQueries({ queryKey: queryKeys.growthSystem.data() });

      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.growthSystem.tasks.lists(),
      });
      const previousDashboards = queryClient.getQueriesData({
        queryKey: queryKeys.growthSystem.data(),
      });
      const detailKey = queryKeys.growthSystem.tasks.detail(id);
      const previousDetail = queryClient.getQueryData(detailKey);

      const existing = findTaskInClientCache(queryClient, id);
      if (existing) {
        const now = new Date().toISOString();
        const optimisticPointsAwarded =
          existing.pointValue != null && existing.pointValue > 0
            ? true
            : (existing.pointsAwarded ?? false);
        upsertTaskCache(queryClient, {
          ...existing,
          status: 'Done',
          completedDate: now,
          pointsAwarded: optimisticPointsAwarded,
          rewardLedgerStatus: optimisticPointsAwarded
            ? 'awarded'
            : (existing.rewardLedgerStatus ?? 'none'),
        });
      }

      return { previousLists, previousDashboards, detailKey, previousDetail };
    },
    onError: (_err, _id, context) => {
      if (!context) return;
      context.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context.previousDashboards.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      queryClient.setQueryData(context.detailKey, context.previousDetail);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertTaskCache(queryClient, response.data);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: (_response, taskId) => {
      removeTaskCache(queryClient, taskId);
    },
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  const isWaitingForDashboard = dashboardControlsLoading && !data?.data;

  return {
    tasks: isError && isNetworkErr ? [] : data?.data || [],
    isLoading: (isWaitingForDashboard || isLoading) && !isError,
    isError,
    error: apiError || error,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    completeTask: completeMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
  };
};

export const useHabits = () => {
  // TODO: Temporarily not checking user authentication (bypassed in ProtectedRoute)
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  // Block list fetches while the dashboard query is pending/successful
  const dashboardQueryState = queryClient.getQueryState(queryKeys.growthSystem.data());
  const dashboardControlsLoading = !!dashboardQueryState && dashboardQueryState.status !== 'error';

  // TODO: Temporarily allowing queries without user authentication
  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.habits.lists(),
    queryFn: async () => {
      try {
        const result = await habitsService.getAll();
        if (result.success || result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !dashboardControlsLoading, // Only fetch if dashboard isn't controlling data
    staleTime: 5 * 60 * 1000, // 5 minutes - habits change moderately
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateHabitInput) => habitsService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertHabitCache(queryClient, response.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHabitInput }) =>
      habitsService.update(id, input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertHabitCache(queryClient, response.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => habitsService.delete(id),
    onSuccess: (_response, habitId) => {
      removeHabitCache(queryClient, habitId);
    },
  });

  const logCompletionMutation = useMutation({
    mutationFn: habitsService.logCompletion,
    onSuccess: () => {},
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  const isWaitingForDashboard = dashboardControlsLoading && !data?.data;

  return {
    habits: isError && isNetworkErr ? [] : data?.data || [],
    isLoading: (isWaitingForDashboard || isLoading) && !isError,
    isError,
    error: apiError || error || data?.error,
    createHabit: createMutation.mutateAsync,
    updateHabit: updateMutation.mutateAsync,
    deleteHabit: deleteMutation.mutateAsync,
    logCompletion: logCompletionMutation.mutateAsync,
  };
};

export const useMetrics = () => {
  // TODO: Temporarily not checking user authentication (bypassed in ProtectedRoute)
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  // Block list fetches while the dashboard query is pending/successful
  const dashboardQueryState = queryClient.getQueryState(queryKeys.growthSystem.data());
  const dashboardControlsLoading = !!dashboardQueryState && dashboardQueryState.status !== 'error';

  // TODO: Temporarily allowing queries without user authentication
  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.metrics.lists(),
    queryFn: async () => {
      try {
        const result = await metricsService.getAll();
        if (result.success || result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !dashboardControlsLoading, // Only fetch if dashboard isn't controlling data
    staleTime: 5 * 60 * 1000, // 5 minutes - metrics change moderately
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateMetricInput) => metricsService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertMetricCache(queryClient, response.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMetricInput }) =>
      metricsService.update(id, input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertMetricCache(queryClient, response.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metricsService.delete(id),
    onSuccess: (_response, metricId) => {
      removeMetricCache(queryClient, metricId);
    },
  });

  const logValueMutation = useMutation({
    mutationFn: (input: CreateMetricLogInput) => metricsService.logValue(input),
    onSuccess: (response, input) => {
      if (response.success && response.data) {
        // Add the log to the metric's logs array in cache
        addMetricLogToCache(queryClient, input.metricId, response.data);
        // Also update the metric itself (in case the backend returns updated metric data)
        // We'll refetch the metric to get the updated logs array
        queryClient.invalidateQueries({
          queryKey: queryKeys.growthSystem.metrics.detail(input.metricId),
        });
      }
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: ({ metricId, logId }: { metricId: string; logId: string }) =>
      metricsService.deleteLog(metricId, logId),
    onSuccess: (_response, { metricId, logId }) => {
      // Remove the log from the metric's logs array in cache
      removeMetricLogFromCache(queryClient, metricId, logId);
    },
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  const isWaitingForDashboard = dashboardControlsLoading && !data?.data;

  return {
    metrics: isError && isNetworkErr ? [] : data?.data || [],
    isLoading: (isWaitingForDashboard || isLoading) && !isError,
    isError,
    error: apiError || error || data?.error,
    createMetric: createMutation.mutateAsync,
    updateMetric: updateMutation.mutateAsync,
    deleteMetric: deleteMutation.mutateAsync,
    logValue: logValueMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
  };
};

export const useGoals = () => {
  // TODO: Temporarily not checking user authentication (bypassed in ProtectedRoute)
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  // Block list fetches while the dashboard query is pending/successful
  const dashboardQueryState = queryClient.getQueryState(queryKeys.growthSystem.data());
  const dashboardControlsLoading = !!dashboardQueryState && dashboardQueryState.status !== 'error';

  // TODO: Temporarily allowing queries without user authentication
  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.goals.lists(),
    queryFn: async () => {
      try {
        const result = await goalsService.getAll();
        if (result.success || result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !dashboardControlsLoading, // Only fetch if dashboard isn't controlling data
    staleTime: 10 * 60 * 1000, // 10 minutes - goals don't change frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateGoalInput) => goalsService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertGoalCache(queryClient, response.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      goalsService.update(id, input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertGoalCache(queryClient, response.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsService.delete(id),
    onSuccess: (_response, goalId) => {
      removeGoalCache(queryClient, goalId);
    },
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  const isWaitingForDashboard = dashboardControlsLoading && !data?.data;

  return {
    goals: isError && isNetworkErr ? [] : data?.data || [],
    isLoading: (isWaitingForDashboard || isLoading) && !isError,
    isError,
    error: apiError || error || data?.error,
    createGoal: createMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
  };
};

export const useProjects = () => {
  // TODO: Temporarily not checking user authentication (bypassed in ProtectedRoute)
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  // Block list fetches while the dashboard query is pending/successful
  const dashboardQueryState = queryClient.getQueryState(queryKeys.growthSystem.data());
  const dashboardControlsLoading = !!dashboardQueryState && dashboardQueryState.status !== 'error';

  // TODO: Temporarily allowing queries without user authentication
  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.projects.lists(),
    queryFn: async () => {
      try {
        const result = await projectsService.getAll();
        if (result.success || result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !dashboardControlsLoading, // Only fetch if dashboard isn't controlling data
    staleTime: 10 * 60 * 1000, // 10 minutes - projects don't change frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => projectsService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertProjectCache(queryClient, response.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      projectsService.update(id, input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertProjectCache(queryClient, response.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.delete(id),
    onSuccess: (_response, projectId) => {
      removeProjectCache(queryClient, projectId);
    },
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  const isWaitingForDashboard = dashboardControlsLoading && !data?.data;

  return {
    projects: isError && isNetworkErr ? [] : data?.data || [],
    isLoading: (isWaitingForDashboard || isLoading) && !isError,
    isError,
    error: apiError || error || data?.error,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
  };
};

export const useLogbook = () => {
  // TODO: Temporarily not checking user authentication (bypassed in ProtectedRoute)
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  // Check if dashboard query is running and if logbook cache has data
  const dashboardQueryState = queryClient.getQueryState(queryKeys.growthSystem.data());
  const dashboardControlsLoading = !!dashboardQueryState && dashboardQueryState.status !== 'error';
  const logbookCacheData = queryClient.getQueryData<{ success: boolean; data?: LogbookEntry[] }>(
    queryKeys.growthSystem.logbook.lists()
  );
  const hasCachedLogbookData = !!logbookCacheData?.data && logbookCacheData.data.length > 0;

  // Allow query to run if:
  // 1. Dashboard is not controlling (error or not running), OR
  // 2. Dashboard is pending but we have no cached data (fallback to ensure data loads)
  const shouldFetch = !dashboardControlsLoading || !hasCachedLogbookData;

  // TODO: Temporarily allowing queries without user authentication
  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.logbook.lists(),
    queryFn: async () => {
      try {
        const result = await logbookService.getAll();
        if (result.success || result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: shouldFetch, // Fetch if dashboard isn't controlling OR we have no cached data
    staleTime: 2 * 60 * 1000, // 2 minutes - logbook entries change frequently
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // Use cached data immediately if available, even if query is disabled
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateLogbookEntryInput) => logbookService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertLogbookEntryCache(queryClient, response.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLogbookEntryInput }) =>
      logbookService.update(id, input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertLogbookEntryCache(queryClient, response.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => logbookService.delete(id),
    onSuccess: (_response, entryId) => {
      removeLogbookEntryCache(queryClient, entryId);
    },
  });

  const apiError = error ? extractApiError(error) : null;
  const isNetworkErr = apiError ? isNetworkError(apiError) : false;

  // Always read from the query result, which React Query updates when we call setQueryData
  // This ensures cache updates are reflected immediately
  const entriesData = isError && isNetworkErr ? [] : (data?.data ?? []);

  // Only show loading if we don't have cached data and query is actually loading
  const isActuallyLoading = !hasCachedLogbookData && isLoading && !isError;

  return {
    entries: entriesData,
    isLoading: isActuallyLoading,
    isError,
    error: apiError || error || data?.error,
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
  };
};

/**
 * Hook to fetch task dependencies for multiple tasks in a batched manner
 * This is more efficient than calling getDependencies for each task individually
 */
export const useTaskDependencies = (taskIds: string[], options?: { enabled?: boolean }) => {
  const { recordError, recordSuccess } = useBackendStatus();
  const depsEnabled = (options?.enabled ?? true) && taskIds.length > 0;

  const { data, isLoading, error, isError } = useQuery({
    queryKey: [...queryKeys.growthSystem.tasks.all(), 'dependencies', taskIds.sort().join(',')],
    queryFn: async () => {
      try {
        // Batch fetch dependencies for all tasks in parallel
        const { tasksService } = await import('@/services/growth-system/tasks.service');
        const dependencyPromises = taskIds.map((taskId) =>
          tasksService.getDependencies(taskId).then((res) => ({
            taskId,
            dependencies: res.success && res.data ? res.data : [],
          }))
        );

        const results = await Promise.all(dependencyPromises);
        const dependencyMap = new Map<string, (typeof results)[0]['dependencies']>();
        const allDependencies: (typeof results)[0]['dependencies'] = [];

        results.forEach(({ taskId, dependencies }) => {
          dependencyMap.set(taskId, dependencies);
          allDependencies.push(...dependencies);
        });

        if (results.length > 0) {
          recordSuccess();
        }

        return {
          dependencyMap,
          allDependencies,
        };
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: depsEnabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - dependencies don't change frequently
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    dependencyMap: data?.dependencyMap || new Map(),
    allDependencies: data?.allDependencies || [],
    isLoading: depsEnabled && isLoading && !isError,
    isError,
    error: apiError || error,
  };
};
