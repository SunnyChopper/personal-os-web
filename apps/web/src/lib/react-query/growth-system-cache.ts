import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { ApiResponse, ApiListResponse, DashboardSummaryResponse } from '@/types/api-contracts';
import type {
  Goal,
  Habit,
  LogbookEntry,
  Metric,
  Project,
  Task,
  TaskDependency,
  UpdateTaskInput,
} from '@/types/growth-system';
import type {
  Reward,
  RewardRedemption,
  RewardWithRedemptions,
  WalletBalance,
  WalletTransaction,
} from '@/types/rewards';
import { queryKeys } from '@/lib/react-query/query-keys';
import { _canRedeemReward } from '@/services/rewards/rewards.service';

type ListCache<T> = ApiListResponse<T> | { data?: T[] } | T[];

const extractListData = <T>(value: ListCache<T> | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
    return value.data;
  }
  return [];
};

const mergeListData = <T>(value: ListCache<T> | undefined, data: T[]): ListCache<T> => {
  if (Array.isArray(value)) return data;
  if (value && typeof value === 'object') {
    // Preserve ApiListResponse structure
    if ('success' in value || 'total' in value) {
      return { ...value, data, success: true } as ApiListResponse<T>;
    }
    return { ...value, data };
  }
  return { data, success: true } as ApiListResponse<T>;
};

const updateListQueries = <T>(
  queryClient: QueryClient,
  queryKeyBase: QueryKey,
  updater: (items: T[]) => T[]
): void => {
  const queries = queryClient.getQueriesData<ListCache<T>>({ queryKey: queryKeyBase });
  queries.forEach(([key, data]) => {
    const currentItems = extractListData<T>(data);
    const next = updater(currentItems);
    queryClient.setQueryData(key, mergeListData<T>(data, next));
  });
};

const upsertById = <T extends { id: string }>(items: T[], item: T): T[] => {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const next = [...items];
  next[index] = item;
  return next;
};

const removeById = <T extends { id: string }>(items: T[], id: string): T[] =>
  items.filter((item) => item.id !== id);

const updateDashboardQueries = (
  queryClient: QueryClient,
  updater: (data: DashboardSummaryResponse) => DashboardSummaryResponse
): void => {
  const queries = queryClient.getQueriesData<ApiResponse<DashboardSummaryResponse>>({
    queryKey: queryKeys.growthSystem.data(),
  });
  queries.forEach(([key, response]) => {
    if (!response?.data) return;
    queryClient.setQueryData<ApiResponse<DashboardSummaryResponse>>(key, {
      ...response,
      data: updater(response.data),
    });
  });
};

const updateDetailCache = <T extends { id: string }>(
  queryClient: QueryClient,
  detailKey: (id: string) => readonly unknown[],
  item: T
): void => {
  queryClient.setQueryData(detailKey(item.id), { success: true, data: item });
};

export const upsertTaskCache = (queryClient: QueryClient, task: Task): void => {
  updateListQueries<Task>(queryClient, queryKeys.growthSystem.tasks.lists(), (items) =>
    upsertById(items, task)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    tasks: upsertById(data.tasks, task),
  }));
  updateDetailCache(queryClient, queryKeys.growthSystem.tasks.detail, task);
};

/** Merge a task with partial update input for optimistic cache updates. */
export function mergeTaskWithUpdate(task: Task, input: UpdateTaskInput): Task {
  const merged: Task = {
    ...task,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.extendedDescription !== undefined
      ? { extendedDescription: input.extendedDescription || null }
      : {}),
    ...(input.area !== undefined ? { area: input.area } : {}),
    ...(input.subCategory !== undefined ? { subCategory: input.subCategory } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.size !== undefined ? { size: input.size } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate || null } : {}),
    ...(input.scheduledDate !== undefined ? { scheduledDate: input.scheduledDate || null } : {}),
    ...(input.completedDate !== undefined ? { completedDate: input.completedDate || null } : {}),
    ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    ...(input.isRecurring !== undefined ? { isRecurring: input.isRecurring } : {}),
    ...(input.recurrenceRule !== undefined ? { recurrenceRule: input.recurrenceRule } : {}),
    ...(input.pointValue !== undefined ? { pointValue: input.pointValue } : {}),
    ...(input.projectIds !== undefined ? { projectIds: input.projectIds } : {}),
    ...(input.goalIds !== undefined ? { goalIds: input.goalIds } : {}),
  };

  if (input.status !== undefined && task.status === 'Done' && input.status !== 'Done') {
    return {
      ...merged,
      completedDate: input.completedDate !== undefined ? input.completedDate : null,
      pointsAwarded: false,
      rewardLedgerStatus: 'reversed',
      rewardReversalTransactionId: null,
      rewardReversedAt: null,
    };
  }

  return merged;
}

export function findTaskInClientCache(queryClient: QueryClient, id: string): Task | undefined {
  const queries = queryClient.getQueriesData<ListCache<Task>>({
    queryKey: queryKeys.growthSystem.tasks.lists(),
  });
  for (const [, data] of queries) {
    const items = extractListData<Task>(data);
    const found = items.find((t) => t.id === id);
    if (found) return found;
  }
  const detail = queryClient.getQueryData<ApiResponse<Task>>(
    queryKeys.growthSystem.tasks.detail(id)
  );
  return detail?.data;
}

/**
 * Helper to find all dependency queries in the cache
 */
const findDependencyQueries = (queryClient: QueryClient) => {
  return queryClient.getQueriesData<{
    dependencyMap: Map<string, TaskDependency[]>;
    allDependencies: TaskDependency[];
  }>({
    predicate: (query) => {
      const key = query.queryKey;
      // Match dependency query keys: ['growth-system', 'tasks', 'dependencies', 'task1,task2,...']
      return (
        Array.isArray(key) &&
        key.length >= 4 &&
        key[0] === 'growth-system' &&
        key[1] === 'tasks' &&
        key[2] === 'dependencies'
      );
    },
  });
};

/**
 * Adds a new dependency to the cache for all relevant dependency queries.
 * Updates queries that include the taskId in their taskIds list.
 */
export const addTaskDependencyToCache = (
  queryClient: QueryClient,
  dependency: TaskDependency
): void => {
  const dependencyQueries = findDependencyQueries(queryClient);

  dependencyQueries.forEach(([key, data]) => {
    if (!data) return;

    // Extract taskIds from query key (last element is the comma-separated string)
    const taskIdsString = key[key.length - 1] as string;
    if (typeof taskIdsString !== 'string') return;

    const taskIds = taskIdsString.split(',').filter(Boolean);
    const includesTaskId = taskIds.includes(dependency.taskId);

    // Only update queries that include the taskId
    if (!includesTaskId) return;

    // Check if dependency already exists
    const exists = data.allDependencies.some(
      (dep) =>
        dep.taskId === dependency.taskId && dep.dependsOnTaskId === dependency.dependsOnTaskId
    );

    if (exists) return; // Already in cache

    // Add to allDependencies
    const updatedAllDependencies = [...data.allDependencies, dependency];

    // Update dependency map
    const updatedDependencyMap = new Map(data.dependencyMap);
    const existingDeps = updatedDependencyMap.get(dependency.taskId) || [];
    updatedDependencyMap.set(dependency.taskId, [...existingDeps, dependency]);

    const updatedData = {
      dependencyMap: updatedDependencyMap,
      allDependencies: updatedAllDependencies,
    };

    // Update the query cache
    queryClient.setQueryData(key, updatedData);
  });
};

/**
 * Removes a single dependency from the cache for all relevant dependency queries.
 * Updates queries that include the taskId in their taskIds list.
 */
export const removeTaskDependencyFromCache = (
  queryClient: QueryClient,
  taskId: string,
  dependsOnTaskId: string
): void => {
  const dependencyQueries = findDependencyQueries(queryClient);

  dependencyQueries.forEach(([key, data]) => {
    if (!data) return;

    // Extract taskIds from query key (last element is the comma-separated string)
    const taskIdsString = key[key.length - 1] as string;
    if (typeof taskIdsString !== 'string') return;

    const taskIds = taskIdsString.split(',').filter(Boolean);
    const includesTaskId = taskIds.includes(taskId);

    // Only update queries that include the taskId
    if (!includesTaskId) return;

    // Remove from allDependencies
    const updatedAllDependencies = data.allDependencies.filter(
      (dep) => !(dep.taskId === taskId && dep.dependsOnTaskId === dependsOnTaskId)
    );

    // Update dependency map
    const updatedDependencyMap = new Map(data.dependencyMap);
    const existingDeps = updatedDependencyMap.get(taskId) || [];
    const filteredDeps = existingDeps.filter((dep) => dep.dependsOnTaskId !== dependsOnTaskId);
    if (filteredDeps.length > 0) {
      updatedDependencyMap.set(taskId, filteredDeps);
    } else {
      updatedDependencyMap.delete(taskId);
    }

    const updatedData = {
      dependencyMap: updatedDependencyMap,
      allDependencies: updatedAllDependencies,
    };

    // Update the query cache
    queryClient.setQueryData(key, updatedData);
  });
};

/**
 * Updates dependencies cache to remove dependencies related to a deleted task.
 * Removes dependencies where the deleted task is either the dependent task or the dependency.
 * Also pre-populates the cache for the new query key (with deleted taskId removed from taskIds).
 */
const removeTaskDependenciesFromCache = (queryClient: QueryClient, deletedTaskId: string): void => {
  // Find all dependency queries and update them
  const dependencyQueries = findDependencyQueries(queryClient);

  dependencyQueries.forEach(([key, data]) => {
    if (!data) return;

    // Extract taskIds from query key (last element is the comma-separated string)
    const taskIdsString = key[key.length - 1] as string;
    if (typeof taskIdsString !== 'string') return;

    const taskIds = taskIdsString.split(',').filter(Boolean);
    const hasDeletedTask = taskIds.includes(deletedTaskId);

    // Remove dependencies where deleted task is involved
    const updatedAllDependencies = data.allDependencies.filter(
      (dep) => dep.taskId !== deletedTaskId && dep.dependsOnTaskId !== deletedTaskId
    );

    // Update dependency map - remove entries for deleted task and filter out deleted dependencies
    const updatedDependencyMap = new Map<string, TaskDependency[]>();
    data.dependencyMap.forEach((deps, taskId) => {
      if (taskId !== deletedTaskId) {
        const filteredDeps = deps.filter((dep) => dep.dependsOnTaskId !== deletedTaskId);
        if (filteredDeps.length > 0) {
          updatedDependencyMap.set(taskId, filteredDeps);
        }
      }
    });

    const updatedData = {
      dependencyMap: updatedDependencyMap,
      allDependencies: updatedAllDependencies,
    };

    // Update the existing query cache
    queryClient.setQueryData(key, updatedData);

    // If this query included the deleted task, pre-populate the cache for the new query key
    // (without the deleted taskId) so React Query doesn't refetch
    if (hasDeletedTask) {
      const newTaskIds = taskIds.filter((id) => id !== deletedTaskId).sort();
      if (newTaskIds.length > 0) {
        const newKey = [
          ...queryKeys.growthSystem.tasks.all(),
          'dependencies',
          newTaskIds.join(','),
        ] as const;
        queryClient.setQueryData(newKey, updatedData);
      }
    }
  });
};

export const removeTaskCache = (queryClient: QueryClient, taskId: string): void => {
  updateListQueries<Task>(queryClient, queryKeys.growthSystem.tasks.lists(), (items) =>
    removeById(items, taskId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    tasks: removeById(data.tasks, taskId),
  }));
  // Remove dependencies related to the deleted task
  removeTaskDependenciesFromCache(queryClient, taskId);
};

export const upsertGoalCache = (queryClient: QueryClient, goal: Goal): void => {
  updateListQueries<Goal>(queryClient, queryKeys.growthSystem.goals.lists(), (items) =>
    upsertById(items, goal)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    goals: upsertById(data.goals, goal),
  }));
  updateDetailCache(queryClient, queryKeys.growthSystem.goals.detail, goal);
};

export const removeGoalCache = (queryClient: QueryClient, goalId: string): void => {
  updateListQueries<Goal>(queryClient, queryKeys.growthSystem.goals.lists(), (items) =>
    removeById(items, goalId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    goals: removeById(data.goals, goalId),
  }));
};

export const upsertProjectCache = (queryClient: QueryClient, project: Project): void => {
  updateListQueries<Project>(queryClient, queryKeys.growthSystem.projects.lists(), (items) =>
    upsertById(items, project)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    projects: upsertById(data.projects, project),
  }));
  updateDetailCache(queryClient, queryKeys.growthSystem.projects.detail, project);
};

export const removeProjectCache = (queryClient: QueryClient, projectId: string): void => {
  updateListQueries<Project>(queryClient, queryKeys.growthSystem.projects.lists(), (items) =>
    removeById(items, projectId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    projects: removeById(data.projects, projectId),
  }));
};

export const upsertHabitCache = (queryClient: QueryClient, habit: Habit): void => {
  updateListQueries<Habit>(queryClient, queryKeys.growthSystem.habits.lists(), (items) =>
    upsertById(items, habit)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    habits: upsertById(data.habits, habit),
  }));
  updateDetailCache(queryClient, queryKeys.growthSystem.habits.detail, habit);
};

export const removeHabitCache = (queryClient: QueryClient, habitId: string): void => {
  updateListQueries<Habit>(queryClient, queryKeys.growthSystem.habits.lists(), (items) =>
    removeById(items, habitId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    habits: removeById(data.habits, habitId),
  }));
};

export const upsertMetricCache = (queryClient: QueryClient, metric: Metric): void => {
  updateListQueries<Metric>(queryClient, queryKeys.growthSystem.metrics.lists(), (items) =>
    upsertById(items, metric)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    metrics: upsertById(data.metrics, metric),
  }));
  updateDetailCache(queryClient, queryKeys.growthSystem.metrics.detail, metric);
};

export const removeMetricCache = (queryClient: QueryClient, metricId: string): void => {
  updateListQueries<Metric>(queryClient, queryKeys.growthSystem.metrics.lists(), (items) =>
    removeById(items, metricId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    metrics: removeById(data.metrics, metricId),
  }));
};

/**
 * Add a log to a metric's logs array in the cache
 */
export const addMetricLogToCache = (
  queryClient: QueryClient,
  metricId: string,
  log: import('@/types/growth-system').MetricLog
): void => {
  // Find the metric to get userId if log doesn't have it
  const findMetric = (items: Metric[]): Metric | undefined => items.find((m) => m.id === metricId);

  const queries = queryClient.getQueriesData<ListCache<Metric>>({
    queryKey: queryKeys.growthSystem.metrics.lists(),
  });
  let metric: Metric | undefined;
  for (const [, data] of queries) {
    const items = extractListData(data);
    metric = findMetric(items);
    if (metric) break;
  }

  // Ensure log has userId from metric
  const logWithUserId: import('@/types/growth-system').MetricLog = {
    ...log,
    userId: log.userId || metric?.userId || '',
  };

  const updateMetricWithLog = (items: Metric[]): Metric[] =>
    items.map((m) => {
      if (m.id !== metricId) return m;
      return {
        ...m,
        logs: [...(m.logs || []), logWithUserId].sort(
          (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
        ),
        logCount: (m.logCount || 0) + 1,
      };
    });

  updateListQueries<Metric>(
    queryClient,
    queryKeys.growthSystem.metrics.lists(),
    updateMetricWithLog
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    metrics: updateMetricWithLog(data.metrics),
  }));

  // Update detail cache if it exists
  const detailKey = queryKeys.growthSystem.metrics.detail(metricId);
  const detailData = queryClient.getQueryData<{ success: boolean; data: Metric }>(detailKey);
  if (detailData?.data) {
    queryClient.setQueryData(detailKey, {
      ...detailData,
      data: {
        ...detailData.data,
        logs: [...(detailData.data.logs || []), logWithUserId].sort(
          (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
        ),
        logCount: (detailData.data.logCount || 0) + 1,
      },
    });
  }
};

/**
 * Remove a log from a metric's logs array in the cache
 */
export const removeMetricLogFromCache = (
  queryClient: QueryClient,
  metricId: string,
  logId: string
): void => {
  const updateMetricWithoutLog = (items: Metric[]): Metric[] =>
    items.map((metric) => {
      if (metric.id !== metricId) return metric;
      const updatedLogs = (metric.logs || []).filter((log) => log.id !== logId);
      return {
        ...metric,
        logs: updatedLogs,
        logCount: Math.max(0, (metric.logCount || 0) - 1),
      };
    });

  updateListQueries<Metric>(
    queryClient,
    queryKeys.growthSystem.metrics.lists(),
    updateMetricWithoutLog
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    metrics: updateMetricWithoutLog(data.metrics),
  }));

  // Update detail cache if it exists
  const detailKey = queryKeys.growthSystem.metrics.detail(metricId);
  const detailData = queryClient.getQueryData<{ success: boolean; data: Metric }>(detailKey);
  if (detailData?.data) {
    const updatedLogs = (detailData.data.logs || []).filter((log) => log.id !== logId);
    queryClient.setQueryData(detailKey, {
      ...detailData,
      data: {
        ...detailData.data,
        logs: updatedLogs,
        logCount: Math.max(0, (detailData.data.logCount || 0) - 1),
      },
    });
  }
};

export const upsertLogbookEntryCache = (queryClient: QueryClient, entry: LogbookEntry): void => {
  updateListQueries<LogbookEntry>(queryClient, queryKeys.growthSystem.logbook.lists(), (items) =>
    upsertById(items, entry)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    logbookEntries: upsertById(data.logbookEntries, entry),
  }));
  updateDetailCache(queryClient, queryKeys.growthSystem.logbook.detail, entry);
};

export const removeLogbookEntryCache = (queryClient: QueryClient, entryId: string): void => {
  updateListQueries<LogbookEntry>(queryClient, queryKeys.growthSystem.logbook.lists(), (items) =>
    removeById(items, entryId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    logbookEntries: removeById(data.logbookEntries, entryId),
  }));
};

const buildRewardWithRedemptions = (
  reward: RewardWithRedemptions | Reward,
  base?: RewardWithRedemptions
): RewardWithRedemptions => {
  const redemptions = base?.redemptions ?? (reward as RewardWithRedemptions).redemptions ?? [];
  const status = (reward as RewardWithRedemptions).status ?? base?.status;
  return {
    ...(base || {}),
    ...(reward as RewardWithRedemptions),
    redemptions,
    lastRedeemedAt:
      base?.lastRedeemedAt ?? (reward as RewardWithRedemptions).lastRedeemedAt ?? null,
    canRedeem:
      (reward as RewardWithRedemptions).canRedeem ??
      base?.canRedeem ??
      (status ? status === 'Active' : true),
    cooldownMessage:
      (reward as RewardWithRedemptions).cooldownMessage ?? base?.cooldownMessage ?? null,
  };
};

const findRewardInCache = (
  queryClient: QueryClient,
  rewardId: string
): RewardWithRedemptions | undefined => {
  const queries = queryClient.getQueriesData<ListCache<RewardWithRedemptions>>({
    queryKey: queryKeys.rewards.withRedemptions(),
  });
  for (const [, data] of queries) {
    const match = extractListData(data).find((reward) => reward.id === rewardId);
    if (match) return match;
  }
  return undefined;
};

export const upsertRewardCache = (
  queryClient: QueryClient,
  reward: RewardWithRedemptions
): void => {
  updateListQueries<RewardWithRedemptions>(
    queryClient,
    queryKeys.rewards.withRedemptions(),
    (items) => upsertById(items, reward)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    rewards: upsertById(data.rewards, reward),
  }));
  queryClient.setQueryData(queryKeys.rewards.detail(reward.id), {
    success: true,
    data: reward,
  });
};

export const removeRewardCache = (queryClient: QueryClient, rewardId: string): void => {
  updateListQueries<RewardWithRedemptions>(
    queryClient,
    queryKeys.rewards.withRedemptions(),
    (items) => removeById(items, rewardId)
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    rewards: removeById(data.rewards, rewardId),
  }));
};

export const coerceRewardWithRedemptionsFromCache = (
  queryClient: QueryClient,
  reward: Reward
): RewardWithRedemptions => {
  const existing = findRewardInCache(queryClient, reward.id);
  return buildRewardWithRedemptions(reward, existing);
};

export const applyRewardRedemption = (
  queryClient: QueryClient,
  redemption: RewardRedemption
): void => {
  const applyRedemption = (items: RewardWithRedemptions[]): RewardWithRedemptions[] =>
    items.map((reward) => {
      if (reward.id !== redemption.rewardId) return reward;
      const nextRedemptions = [...reward.redemptions, redemption];
      const { canRedeem, cooldownMessage } = _canRedeemReward(reward, nextRedemptions);
      return {
        ...reward,
        redemptions: nextRedemptions,
        lastRedeemedAt: redemption.redeemedAt,
        canRedeem,
        cooldownMessage,
      };
    });

  updateListQueries<RewardWithRedemptions>(
    queryClient,
    queryKeys.rewards.withRedemptions(),
    applyRedemption
  );
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    rewards: applyRedemption(data.rewards),
  }));
};

export const applyWalletUpdate = (
  queryClient: QueryClient,
  payload: { balance: WalletBalance; transaction: WalletTransaction }
): void => {
  queryClient.setQueryData(queryKeys.wallet.balance(), { success: true, data: payload.balance });
  updateListQueries<WalletTransaction>(queryClient, queryKeys.wallet.transactions(), (items) => [
    payload.transaction,
    ...items,
  ]);
  updateDashboardQueries(queryClient, (data) => ({
    ...data,
    wallet: {
      ...data.wallet,
      balance: payload.balance,
      recentTransactions: [payload.transaction, ...data.wallet.recentTransactions],
    },
  }));
};

export const applyWalletRedemption = (
  queryClient: QueryClient,
  redemption: RewardRedemption
): void => {
  const balanceQuery = queryClient.getQueryData<ApiResponse<WalletBalance>>(
    queryKeys.wallet.balance()
  );
  if (balanceQuery?.data) {
    const nextBalance: WalletBalance = {
      ...balanceQuery.data,
      totalPoints: balanceQuery.data.totalPoints - redemption.pointsSpent,
      lifetimeSpent: balanceQuery.data.lifetimeSpent + redemption.pointsSpent,
      updatedAt: redemption.redeemedAt,
    };
    queryClient.setQueryData(queryKeys.wallet.balance(), { success: true, data: nextBalance });
    updateDashboardQueries(queryClient, (data) => ({
      ...data,
      wallet: {
        ...data.wallet,
        balance: nextBalance,
      },
    }));
  }
};

export const coerceRewardWithRedemptions = (reward: RewardWithRedemptions): RewardWithRedemptions =>
  buildRewardWithRedemptions(reward);
