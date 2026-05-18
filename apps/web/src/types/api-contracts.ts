import type {
  Task,
  Habit,
  Metric,
  MetricLog,
  Goal,
  Project,
  LogbookEntry,
  HabitLog,
  TaskDependency,
  CreateTaskInput,
  UpdateTaskInput,
  CreateHabitInput,
  UpdateHabitInput,
  CreateHabitLogInput,
  CreateMetricInput,
  UpdateMetricInput,
  CreateMetricLogInput,
  CreateGoalInput,
  UpdateGoalInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
  FilterOptions,
  PaginatedResponse,
  DependencyGraph,
  AISuggestion,
  AIInsight,
  DailyBriefing,
  WeeklyReview,
  EntitySummary,
} from './growth-system';
import type { RewardWithRedemptions, WalletBalance, WalletTransaction } from './rewards';

export interface ApiError {
  message: string;
  code: string;
  /** Backend may send Pydantic issue lists, objects, or strings. */
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface TasksApiContract {
  getAll: (filters?: FilterOptions) => Promise<PaginatedResponse<Task>>;
  getById: (id: string) => Promise<ApiResponse<Task>>;
  create: (input: CreateTaskInput) => Promise<ApiResponse<Task>>;
  update: (id: string, input: UpdateTaskInput) => Promise<ApiResponse<Task>>;
  delete: (id: string) => Promise<ApiResponse<void>>;

  addDependency: (taskId: string, dependsOnTaskId: string) => Promise<ApiResponse<TaskDependency>>;
  removeDependency: (taskId: string, dependsOnTaskId: string) => Promise<ApiResponse<void>>;
  getDependencies: (taskId: string) => Promise<ApiResponse<TaskDependency[]>>;

  linkToProject: (taskId: string, projectId: string) => Promise<ApiResponse<void>>;
  unlinkFromProject: (taskId: string, projectId: string) => Promise<ApiResponse<void>>;
  getByProject: (projectId: string) => Promise<ApiListResponse<Task>>;

  linkToGoal: (taskId: string, goalId: string) => Promise<ApiResponse<void>>;
  unlinkFromGoal: (taskId: string, goalId: string) => Promise<ApiResponse<void>>;
  getByGoal: (goalId: string) => Promise<ApiListResponse<Task>>;

  getDependencyGraph: (filters?: FilterOptions) => Promise<ApiResponse<DependencyGraph>>;
}

export interface ProjectsApiContract {
  getAll: (filters?: FilterOptions) => Promise<PaginatedResponse<Project>>;
  getById: (id: string) => Promise<ApiResponse<Project>>;
  create: (input: CreateProjectInput) => Promise<ApiResponse<Project>>;
  update: (id: string, input: UpdateProjectInput) => Promise<ApiResponse<Project>>;
  delete: (id: string) => Promise<ApiResponse<void>>;

  linkToGoal: (projectId: string, goalId: string) => Promise<ApiResponse<void>>;
  unlinkFromGoal: (projectId: string, goalId: string) => Promise<ApiResponse<void>>;
  getByGoal: (goalId: string) => Promise<ApiListResponse<Project>>;

  calculateProgress: (projectId: string) => Promise<ApiResponse<number>>;
}

export interface GoalsApiContract {
  getAll: (filters?: FilterOptions) => Promise<PaginatedResponse<Goal>>;
  getById: (id: string) => Promise<ApiResponse<Goal>>;
  create: (input: CreateGoalInput) => Promise<ApiResponse<Goal>>;
  update: (id: string, input: UpdateGoalInput) => Promise<ApiResponse<Goal>>;
  delete: (id: string) => Promise<ApiResponse<void>>;

  linkMetric: (goalId: string, metricId: string) => Promise<ApiResponse<void>>;
  unlinkMetric: (goalId: string, metricId: string) => Promise<ApiResponse<void>>;
  getLinkedMetrics: (goalId: string) => Promise<ApiListResponse<Metric>>;

  linkProject: (goalId: string, projectId: string) => Promise<ApiResponse<void>>;
  unlinkProject: (goalId: string, projectId: string) => Promise<ApiResponse<void>>;
  getLinkedProjects: (goalId: string) => Promise<ApiListResponse<Project>>;

  calculateProgress: (goalId: string) => Promise<ApiResponse<number>>;
}

export interface MetricsApiContract {
  getAll: (filters?: FilterOptions) => Promise<PaginatedResponse<Metric>>;
  getById: (id: string) => Promise<ApiResponse<Metric>>;
  create: (input: CreateMetricInput) => Promise<ApiResponse<Metric>>;
  update: (id: string, input: UpdateMetricInput) => Promise<ApiResponse<Metric>>;
  delete: (id: string) => Promise<ApiResponse<void>>;

  logValue: (input: CreateMetricLogInput) => Promise<ApiResponse<MetricLog>>;
  getLogs: (metricId: string, filters?: FilterOptions) => Promise<PaginatedResponse<MetricLog>>;
  deleteLog: (logId: string) => Promise<ApiResponse<void>>;

  getByGoal: (goalId: string) => Promise<ApiListResponse<Metric>>;
}

export interface HabitsApiContract {
  getAll: (filters?: FilterOptions) => Promise<PaginatedResponse<Habit>>;
  getById: (id: string) => Promise<ApiResponse<Habit>>;
  create: (input: CreateHabitInput) => Promise<ApiResponse<Habit>>;
  update: (id: string, input: UpdateHabitInput) => Promise<ApiResponse<Habit>>;
  delete: (id: string) => Promise<ApiResponse<void>>;

  logCompletion: (input: CreateHabitLogInput) => Promise<ApiResponse<HabitLog>>;
  getLogs: (habitId: string, filters?: FilterOptions) => Promise<PaginatedResponse<HabitLog>>;
  deleteLog: (logId: string) => Promise<ApiResponse<void>>;

  linkToGoal: (habitId: string, goalId: string) => Promise<ApiResponse<void>>;
  unlinkFromGoal: (habitId: string, goalId: string) => Promise<ApiResponse<void>>;
  getByGoal: (goalId: string) => Promise<ApiListResponse<Habit>>;

  calculateStreak: (habitId: string) => Promise<ApiResponse<number>>;
  getCompletionStats: (habitId: string) => Promise<
    ApiResponse<{
      total: number;
      last7Days: number;
      last30Days: number;
      currentStreak: number;
      longestStreak: number;
    }>
  >;
}

export interface LogbookApiContract {
  getAll: (filters?: FilterOptions) => Promise<PaginatedResponse<LogbookEntry>>;
  getById: (id: string) => Promise<ApiResponse<LogbookEntry>>;
  getByDate: (date: string) => Promise<ApiResponse<LogbookEntry>>;
  create: (input: CreateLogbookEntryInput) => Promise<ApiResponse<LogbookEntry>>;
  update: (id: string, input: UpdateLogbookEntryInput) => Promise<ApiResponse<LogbookEntry>>;
  delete: (id: string) => Promise<ApiResponse<void>>;

  linkTask: (entryId: string, taskId: string) => Promise<ApiResponse<void>>;
  unlinkTask: (entryId: string, taskId: string) => Promise<ApiResponse<void>>;
  getLinkedTasks: (entryId: string) => Promise<ApiListResponse<Task>>;

  linkProject: (entryId: string, projectId: string) => Promise<ApiResponse<void>>;
  unlinkProject: (entryId: string, projectId: string) => Promise<ApiResponse<void>>;
  getLinkedProjects: (entryId: string) => Promise<ApiListResponse<Project>>;

  linkGoal: (entryId: string, goalId: string) => Promise<ApiResponse<void>>;
  unlinkGoal: (entryId: string, goalId: string) => Promise<ApiResponse<void>>;
  getLinkedGoals: (entryId: string) => Promise<ApiListResponse<Goal>>;

  linkHabit: (entryId: string, habitId: string) => Promise<ApiResponse<void>>;
  unlinkHabit: (entryId: string, habitId: string) => Promise<ApiResponse<void>>;
  getLinkedHabits: (entryId: string) => Promise<ApiListResponse<Habit>>;
}

/**
 * Dashboard Summary API Contract
 *
 * This endpoint aggregates all dashboard data into a single response,
 * reducing the number of API calls from 6-8 separate requests to 1.
 *
 * Request: GET /api/dashboard/summary
 * - No query parameters required
 * - Requires authentication (JWT token in Authorization header)
 *
 * Response: DashboardSummaryResponse
 */
export interface DashboardSummaryResponse {
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  habits: Habit[];
  metrics: Metric[];
  logbookEntries: LogbookEntry[];
  rewards: RewardWithRedemptions[];
  wallet: {
    balance: WalletBalance;
    recentTransactions: WalletTransaction[]; // Last 10 transactions
  };
}

export interface DashboardSummaryRequest {
  // Optional filters for limiting data returned
  // If not provided, returns all data
  includeCompleted?: boolean; // Include completed tasks/goals (default: false)
  taskLimit?: number; // Limit number of tasks returned (default: all)
  transactionLimit?: number; // Limit number of transactions (default: 10)
}

export interface AIApiContract {
  getSuggestions: (filters?: {
    entityType?: string;
    entityId?: string;
    dismissed?: boolean;
  }) => Promise<ApiListResponse<AISuggestion>>;
  dismissSuggestion: (suggestionId: string) => Promise<ApiResponse<void>>;
  acceptSuggestion: (suggestionId: string) => Promise<ApiResponse<void>>;

  getInsights: (filters?: {
    type?: string;
    severity?: string;
    viewed?: boolean;
  }) => Promise<ApiListResponse<AIInsight>>;
  markInsightViewed: (insightId: string) => Promise<ApiResponse<void>>;

  getDailyBriefing: (date?: string) => Promise<ApiResponse<DailyBriefing>>;
  getWeeklyReview: (weekStart: string) => Promise<ApiResponse<WeeklyReview>>;

  analyzeTaskBreakdown: (taskDescription: string) => Promise<ApiResponse<CreateTaskInput[]>>;
  suggestMetricsForGoal: (goalId: string) => Promise<ApiResponse<CreateMetricInput[]>>;
  designHabit: (behaviorDescription: string) => Promise<ApiResponse<CreateHabitInput>>;
  generateReflectionPrompt: (date: string) => Promise<ApiResponse<string[]>>;
}

export interface SearchApiContract {
  search: (
    query: string,
    options?: {
      entityTypes?: Array<'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook'>;
      limit?: number;
    }
  ) => Promise<ApiResponse<EntitySummary[]>>;

  analyzeImpact: (
    entityType: string,
    entityId: string
  ) => Promise<
    ApiResponse<{
      affectedGoals: Goal[];
      affectedProjects: Project[];
      affectedTasks: Task[];
      impactScore: number;
    }>
  >;
}

export interface GrowthSystemApi {
  tasks: TasksApiContract;
  projects: ProjectsApiContract;
  goals: GoalsApiContract;
  metrics: MetricsApiContract;
  habits: HabitsApiContract;
  logbook: LogbookApiContract;
  ai: AIApiContract;
  search: SearchApiContract;
}

// Draft Notes
export interface NoteDraft {
  title: string;
  content: string;
  area: string;
  sourceUrl: string;
  tags: string[];
  linkedItems: string[];
}

// Mode Preferences
export interface ModePreference {
  mode: 'work' | 'leisure';
}

/** Assistant human-in-the-loop tool policy (API camelCase). */
export type AssistantToolApprovalMode = 'dangerousOnly' | 'allWrites' | 'none';

export interface AssistantToolApprovalConfig {
  mode: AssistantToolApprovalMode;
  dangerousTools: string[];
}

/** Background STM extract + thread summarization (API camelCase). */
export interface AssistantMemoryIngestionConfig {
  provider: string;
  model: string;
}

export interface AssistantSettingsConfig {
  toolApproval: AssistantToolApprovalConfig;
  memoryIngestion: AssistantMemoryIngestionConfig;
  memoryIngestionIsCustom: boolean;
}

export interface AssistantToolRegistryEntry {
  name: string;
  description: string;
  safeRead: boolean;
  category: string;
}

export type ProactiveAutomationKind =
  | 'dailyBriefing'
  | 'logbookEvening'
  | 'custom'
  | 'dailyLearningTrends'
  | 'dailyLearningTheory';

export type ProactiveThreadStrategy = 'reuseFixedThread' | 'newThreadEachRun';

/** Same shape as assistant WebSocket `runConfig` / chat model picker. */
export type ProactiveAssistantRunConfig =
  | ({
      mode: 'manual';
      manual: { reasoningModelId: string; responseModelId: string };
    } & { webSearchEnabled?: boolean })
  | ({
      mode: 'auto';
      auto: {
        optimizeFor: 'speed' | 'intelligence' | 'cost' | 'balanced' | 'value';
      };
    } & { webSearchEnabled?: boolean });

export interface ProactiveAutomation {
  id: string;
  kind: ProactiveAutomationKind;
  enabled: boolean;
  localTime: string;
  timeZone: string;
  threadStrategy: ProactiveThreadStrategy;
  dedicatedThreadId?: string | null;
  channelEmailEnabled: boolean;
  customUserPrompt?: string | null;
  /** Optional display name (e.g. from brainstorm or user). */
  title?: string | null;
  /** Optional short explanation (e.g. from brainstorm). */
  reasoning?: string | null;
  daysOfWeek?: number[] | null;
  /** Per-automation assistant model selection (optional; server defaults when omitted). */
  assistantRunConfig?: ProactiveAssistantRunConfig | null;
  lastRunLocalDate?: string | null;
  lastRunAt?: string | null;
  lastStatus?: string | null;
  lastErrorPreview?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProactiveSuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface ProactiveSuggestion {
  id: string;
  status: ProactiveSuggestionStatus;
  proposedPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdAutomationId?: string | null;
  resolutionFeedback?: string | null;
  resolvedPayload?: Record<string, unknown> | null;
}

export interface ProactiveDispatchErrorItem {
  userId: string;
  automationId: string;
  error: string;
}

export interface ProactiveDispatchRunResult {
  processedUsers: number;
  ran: number;
  errors: ProactiveDispatchErrorItem[];
}

/** Async job for POST /proactive/automations/{id}/dispatch/test (poll with GET /proactive/dispatch/jobs/{id}). */
export interface ProactiveDispatchJob {
  id: string;
  automationId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProactiveEmailTestResult {
  sentTo: string;
  messageId?: string | null;
  replyToUsed: boolean;
  threadId: string;
  deployedStage: string;
}

export interface ProactiveBrainstormSkippedItem {
  reason: string;
  proposedPayload: Record<string, unknown>;
}

export interface ProactiveBrainstormContextStats {
  taskCount: number;
  goalCount: number;
  memorySnippetCount: number;
  existingAutomationCount: number;
}

export interface ProactiveBrainstormResult {
  created: ProactiveSuggestion[];
  skipped: ProactiveBrainstormSkippedItem[];
  model: string;
  contextStats: ProactiveBrainstormContextStats;
}

export interface ProactiveAutomationRun {
  id: string;
  automationId: string;
  status: string;
  ranAt: string;
  runSource: string;
  errorMessage?: string | null;
  threadId?: string | null;
  assistantMessageId?: string | null;
  responsePreview?: string | null;
}

export interface ProactiveAutomationRunsList {
  runs: ProactiveAutomationRun[];
}
