export type Area = 'Health' | 'Wealth' | 'Love' | 'Happiness' | 'Operations' | 'Day Job';

export type SubCategory =
  | 'Physical'
  | 'Mental'
  | 'Spiritual'
  | 'Nutrition'
  | 'Sleep'
  | 'Exercise'
  | 'Income'
  | 'Expenses'
  | 'Investments'
  | 'Debt'
  | 'Net Worth'
  | 'Romantic'
  | 'Family'
  | 'Friends'
  | 'Social'
  | 'Joy'
  | 'Gratitude'
  | 'Purpose'
  | 'Peace'
  | 'Productivity'
  | 'Organization'
  | 'Systems'
  | 'Habits'
  | 'Career'
  | 'Skills'
  | 'Projects'
  | 'Performance';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'On Hold'
  | 'Done'
  | 'Cancelled';
export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
export type GoalStatus = 'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Achieved' | 'Abandoned';
export type MetricStatus = 'Active' | 'Paused' | 'Archived';

export type TimeHorizon = 'Yearly' | 'Quarterly' | 'Monthly' | 'Weekly' | 'Daily';

export type HabitType = 'Build' | 'Maintain' | 'Reduce' | 'Quit';
export type HabitFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export type MetricDirection = 'Higher' | 'Lower' | 'Target';
export type MetricSource = 'Manual' | 'App' | 'Device';
export type MetricUnit =
  | 'count'
  | 'hours'
  | 'minutes'
  | 'dollars'
  | 'pounds'
  | 'kg'
  | 'percent'
  | 'rating'
  | 'custom';

export type LogbookMood = 'Low' | 'Steady' | 'High';

export type RecurrenceUnit = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export type TaskRewardLedgerStatus = 'none' | 'awarded' | 'reversed';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  extendedDescription: string | null;
  area: Area;
  subCategory: SubCategory | null;
  priority: Priority;
  status: TaskStatus;
  /** Fibonacci story points (1, 2, 3, 5, 8, 13, 21), not minutes. */
  size: number | null;
  dueDate: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  /** Estimated focused time to complete (minutes); distinct from story `size`. */
  estimatedDurationMinutes?: number | null;
  scheduleStatus?: 'unscheduled' | 'suggested' | 'scheduled' | 'done';
  scheduleSource?: 'manual' | 'auto' | 'rescued' | null;
  scheduleUpdatedAt?: string | null;
  lastRescuedAt?: string | null;
  notes: string | null;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  pointValue: number | null;
  pointsAwarded: boolean | null;
  rewardLedgerStatus?: TaskRewardLedgerStatus;
  rewardAwardTransactionId?: string | null;
  rewardReversalTransactionId?: string | null;
  rewardReversedAt?: string | null;
  projectIds: string[];
  goalIds: string[];
  /** Public digital garden publish metadata (optional until loaded from API). */
  isPublic?: boolean;
  publicSlug?: string | null;
  publicTitle?: string | null;
  publicSummary?: string | null;
  publicContent?: string | null;
  publicFeatureTags?: string[];
  publishedAt?: string | null;
  lastPublishSyncedAt?: string | null;
  publishSyncStatus?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceUnit;
  interval: number;
  endDate: string | null;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: string;
}

export interface TaskProject {
  taskId: string;
  projectId: string;
  createdAt: string;
}

export interface TaskGoal {
  taskId: string;
  goalId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  area: Area;
  subCategory: SubCategory | null;
  priority: Priority;
  status: ProjectStatus;
  impact: number;
  startDate: string | null;
  targetEndDate: string | null;
  actualEndDate: string | null;
  notes: string | null;
  goalIds?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGoal {
  projectId: string;
  goalId: string;
  createdAt: string;
}

// Enhanced Success Criterion (replaces string[])
export interface SuccessCriterion {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  linkedMetricId: string | null; // Auto-track from metric
  linkedTaskId: string | null; // Auto-track from task
  targetDate: string | null; // Milestone date
  order: number;
}

// Goal Activity Log
export interface GoalActivity {
  id: string;
  goalId: string;
  type:
    | 'criterion_completed'
    | 'task_completed'
    | 'metric_logged'
    | 'habit_completed'
    | 'status_changed'
    | 'note_added'
    | 'progress_milestone';
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

// Goal Progress Configuration
export interface GoalProgressConfig {
  criteriaWeight: number; // 0-100
  tasksWeight: number; // 0-100
  metricsWeight: number; // 0-100
  habitsWeight: number; // 0-100
  manualOverride: number | null;
}

// Computed Progress (for display)
export interface GoalProgressBreakdown {
  overall: number;
  criteria: { completed: number; total: number; percentage: number };
  tasks: { completed: number; total: number; percentage: number };
  metrics: { atTarget: number; total: number; percentage: number };
  habits: { streakDays: number; consistency: number };
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  area: Area;
  subCategory: SubCategory | null;
  timeHorizon: TimeHorizon;
  priority: Priority;
  status: GoalStatus;
  targetDate: string | null;
  completedDate: string | null;
  successCriteria: SuccessCriterion[]; // Changed from string[]
  progressConfig: GoalProgressConfig | null;
  parentGoalId: string | null; // For goal hierarchy
  lastActivityAt: string | null; // For momentum tracking
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalMetric {
  goalId: string;
  metricId: string;
  createdAt: string;
}

export interface GoalProject {
  goalId: string;
  projectId: string;
  createdAt: string;
}

export interface Metric {
  id: string;
  name: string;
  description: string | null;
  area: Area;
  subCategory: SubCategory | null;
  unit: MetricUnit;
  customUnit: string | null;
  direction: MetricDirection;
  targetValue: number | null;
  thresholdLow: number | null;
  thresholdHigh: number | null;
  source: MetricSource;
  status: MetricStatus;
  goalIds?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields that may be included in API responses
  currentValue?: number;
  baselineValue?: number | null;
  trackingFrequency?: 'Daily' | 'Weekly' | 'Monthly';
  logCount?: number;
  milestoneCount?: number;
  // Logs may be included in API responses (e.g., GET /metrics)
  logs?: MetricLog[];
}

export interface MetricLog {
  id: string;
  metricId: string;
  value: number;
  notes: string | null;
  loggedAt: string;
  userId: string;
  createdAt: string;
}

export interface MetricInsight {
  id: string;
  metricId: string;
  type: 'pattern' | 'anomaly' | 'correlation' | 'prediction' | 'milestone';
  title: string;
  description: string;
  confidence: number;
  cachedAt: string;
  expiresAt: string;
}

export interface MetricMilestone {
  id: string;
  metricId: string;
  type: 'target_reached' | 'streak' | 'improvement' | 'consistency';
  value: number;
  achievedAt: string;
  pointsAwarded: number;
  rewardId: string | null;
}

export interface MetricComparison {
  metricId1: string;
  metricId2: string;
  correlation: number;
  insights: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  area: Area;
  subCategory: SubCategory | null;
  habitType: HabitType;
  frequency: HabitFrequency;
  dailyTarget: number | null;
  weeklyTarget: number | null;
  intent: string | null;
  trigger: string | null;
  action: string | null;
  reward: string | null;
  frictionUp: string | null;
  frictionDown: string | null;
  notes: string | null;
  goalIds?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitGoal {
  habitId: string;
  goalId: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedAt: string;
  amount: number | null;
  notes: string | null;
  userId: string;
  createdAt: string;
}

export interface LogbookEntry {
  id: string;
  date: string;
  title: string | null;
  notes: string | null;
  mood: LogbookMood | null;
  energy: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogbookTask {
  logbookEntryId: string;
  taskId: string;
  createdAt: string;
}

export interface LogbookProject {
  logbookEntryId: string;
  projectId: string;
  createdAt: string;
}

export interface LogbookGoal {
  logbookEntryId: string;
  goalId: string;
  createdAt: string;
}

export interface LogbookHabit {
  logbookEntryId: string;
  habitId: string;
  createdAt: string;
}

export interface AISuggestion {
  id: string;
  type:
    | 'task_breakdown'
    | 'metric_suggestion'
    | 'habit_design'
    | 'goal_refinement'
    | 'dependency_detection'
    | 'priority_adjustment'
    | 'project_scope'
    | 'reflection_prompt'
    | 'pattern_insight'
    | 'risk_identification';
  title: string;
  description: string;
  confidence: number;
  reasoning: string | null;
  actionable: boolean;
  data: Record<string, unknown>;
  entityType: 'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook' | null;
  entityId: string | null;
  createdAt: string;
  dismissedAt: string | null;
  acceptedAt: string | null;
}

export interface AIInsight {
  id: string;
  type:
    | 'progress_analysis'
    | 'health_analysis'
    | 'pattern_recognition'
    | 'correlation'
    | 'forecast'
    | 'anomaly'
    | 'blocker_resolution'
    | 'capacity_planning';
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
  relatedEntities: Array<{ type: string; id: string }>;
  createdAt: string;
  viewedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  extendedDescription?: string;
  area: Area;
  subCategory?: SubCategory;
  priority?: Priority;
  status?: TaskStatus;
  size?: number;
  dueDate?: string;
  scheduledDate?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  pointValue?: number;
  projectIds?: string[];
  goalIds?: string[];
  estimatedDurationMinutes?: number;
  scheduleStatus?: Task['scheduleStatus'];
  scheduleSource?: NonNullable<Task['scheduleSource']>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  extendedDescription?: string;
  area?: Area;
  subCategory?: SubCategory;
  priority?: Priority;
  status?: TaskStatus;
  size?: number;
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  pointValue?: number;
  projectIds?: string[];
  goalIds?: string[];
  estimatedDurationMinutes?: number;
  scheduleStatus?: Task['scheduleStatus'];
  scheduleSource?: NonNullable<Task['scheduleSource']>;
  scheduleUpdatedAt?: string;
  lastRescuedAt?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  area: Area;
  subCategory?: SubCategory;
  priority?: Priority;
  status?: ProjectStatus;
  impact?: number;
  startDate?: string;
  targetEndDate?: string;
  notes?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  area?: Area;
  subCategory?: SubCategory;
  priority?: Priority;
  status?: ProjectStatus;
  impact?: number;
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  notes?: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  area: Area;
  subCategory?: SubCategory;
  timeHorizon: TimeHorizon;
  priority?: Priority;
  status?: GoalStatus;
  targetDate?: string;
  successCriteria?: string[] | SuccessCriterion[]; // Support both for migration
  progressConfig?: GoalProgressConfig;
  parentGoalId?: string;
  notes?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  area?: Area;
  subCategory?: SubCategory;
  timeHorizon?: TimeHorizon;
  priority?: Priority;
  status?: GoalStatus;
  targetDate?: string;
  completedDate?: string;
  successCriteria?: string[] | SuccessCriterion[]; // Support both for migration
  progressConfig?: GoalProgressConfig;
  parentGoalId?: string;
  lastActivityAt?: string;
  notes?: string;
}

export interface CreateMetricInput {
  name: string;
  description?: string;
  area: Area;
  subCategory?: SubCategory;
  unit: MetricUnit;
  customUnit?: string;
  direction: MetricDirection;
  targetValue?: number;
  thresholdLow?: number;
  thresholdHigh?: number;
  source?: MetricSource;
}

export interface UpdateMetricInput {
  name?: string;
  description?: string;
  area?: Area;
  subCategory?: SubCategory;
  unit?: MetricUnit;
  customUnit?: string;
  direction?: MetricDirection;
  targetValue?: number;
  thresholdLow?: number;
  thresholdHigh?: number;
  source?: MetricSource;
  status?: MetricStatus;
}

export interface CreateMetricLogInput {
  metricId: string;
  value: number;
  notes?: string;
  loggedAt?: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  area: Area;
  subCategory?: SubCategory;
  habitType: HabitType;
  frequency: HabitFrequency;
  dailyTarget?: number;
  weeklyTarget?: number;
  intent?: string;
  trigger?: string;
  action?: string;
  reward?: string;
  frictionUp?: string;
  frictionDown?: string;
  notes?: string;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  area?: Area;
  subCategory?: SubCategory;
  habitType?: HabitType;
  frequency?: HabitFrequency;
  dailyTarget?: number;
  weeklyTarget?: number;
  intent?: string;
  trigger?: string;
  action?: string;
  reward?: string;
  frictionUp?: string;
  frictionDown?: string;
  notes?: string;
}

export interface CreateHabitLogInput {
  habitId: string;
  completedAt?: string;
  amount?: number;
  notes?: string;
}

export interface CreateLogbookEntryInput {
  date: string;
  title?: string;
  notes?: string;
  mood?: LogbookMood;
  energy?: number;
}

export interface UpdateLogbookEntryInput {
  date?: string; // Allow date updates to fix timezone-shifted dates
  title?: string;
  notes?: string;
  mood?: LogbookMood;
  energy?: number;
}

export interface FilterOptions {
  search?: string;
  area?: Area;
  subCategory?: SubCategory;
  priority?: Priority;
  status?: string;
  momentum?: string;
  targetProximity?: 'approaching' | 'far' | 'reached';
  loggingFrequency?: 'recent' | 'needs_logging';
  hasLinkedTasks?: boolean;
  hasLinkedMetrics?: boolean;
  hasLinkedHabits?: boolean;
  healthStatus?: 'healthy' | 'at_risk' | 'behind' | 'dormant';
  progressRange?: { min: number; max: number };
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;

  // Task-specific filters
  projectId?: string;
  goalId?: string;
  dueDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface DependencyGraphNode {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  area: Area;
  size: number | null;
}

export interface DependencyGraphEdge {
  source: string;
  target: string;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}

export interface RelationshipInput {
  entityType: 'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook';
  entityId: string;
  relatedType: 'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook';
  relatedId: string;
}

export interface EntitySummary {
  id: string;
  title: string;
  type: 'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook';
  area: Area;
  status: string;
  /** When type is goal, used for hierarchical pickers (parent / subgoal). */
  parentGoalId?: string | null;
  /** Goal milestone / due date (YYYY-MM-DD or ISO). */
  targetDate?: string | null;
  /** When set on a goal, overdue styling is suppressed. */
  completedDate?: string | null;
}

export interface DailyBriefing {
  date: string;
  topTasks: Task[];
  habitsToComplete: Habit[];
  metricsToLog: Metric[];
  insights: AIInsight[];
  energyForecast: number;
  suggestedFocus: string;
}

/** Weekly Review snapshot (API `/growth-system/weekly-reviews`). */
export type WeeklyReviewStatus = 'generated' | 'planned' | 'completed';

export interface WeeklyReviewVelocityWeek {
  weekStart: string;
  storyPointsCompleted: number;
  tasksCompleted: number;
}

export interface WeeklyReviewStats {
  tasksCompleted: number;
  tasksPlanned: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  habitCompletions: number;
  habitTargets: number;
  metricsLogged: number;
  goalsActive: number;
  goalsAtRisk: number;
  journalEntries: number;
}

export interface WeeklyReviewOverdueTask {
  taskId: string;
  title: string;
  dueDate?: string | null;
  note: string;
}

export interface WeeklyReviewMetricDelta {
  metricName: string;
  direction: string;
  deltaSummary: string;
  suggestion: string;
}

export interface WeeklyReviewAtRiskAlert {
  goalOrProject: string;
  entityType: string;
  entityId: string;
  summary: string;
  scopeReductionSuggestion: string;
}

export interface WeeklyReviewQuarantineCandidate {
  entityType: string;
  entityId: string;
  name: string;
  reason: string;
}

export interface WeeklyReviewSuggestedTask {
  title: string;
  rationale: string;
  suggestedStoryPoints?: number | null;
  area?: string | null;
  goalIds: string[];
  projectIds: string[];
}

export interface WeeklyReviewAiAnalysis {
  tasksSummary: string;
  overdueTasks: WeeklyReviewOverdueTask[];
  velocityTrend: string;
  habitsSummary: string;
  habitsOnTarget: boolean;
  habitsAiMessage: string;
  metricsSummary: string;
  metricDeltas: WeeklyReviewMetricDelta[];
  goalsSummary: string;
  atRiskAlerts: WeeklyReviewAtRiskAlert[];
  logbookSummary: string;
  reflectionPrompt?: string | null;
  quarantineCandidates: WeeklyReviewQuarantineCandidate[];
  suggestedTasks: WeeklyReviewSuggestedTask[];
  hypeSummary: string;
}

export interface WeeklyReviewQuarantineDecision {
  entityType: string;
  entityId: string;
  action: 'revive' | 'delete' | 'schedule';
  rescheduleNote?: string | null;
}

export interface WeeklyReviewBlockerResolution {
  taskId: string;
  nextAction: string;
}

export interface WeeklyReviewAcceptedTask {
  title: string;
  description?: string | null;
  area: string;
  priority?: string | null;
  size?: number | null;
  goalIds: string[];
  projectIds: string[];
}

export interface WeeklyReviewPlanActions {
  quarantineDecisions: WeeklyReviewQuarantineDecision[];
  blockerResolutions: WeeklyReviewBlockerResolution[];
  suggestedTasksAccepted: WeeklyReviewAcceptedTask[];
}

export interface WeeklyReviewCompletionSummary {
  hypeMessage: string;
  sprintTaskIds: string[];
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: WeeklyReviewStatus;
  stats: WeeklyReviewStats;
  velocityData: WeeklyReviewVelocityWeek[];
  aiAnalysis: WeeklyReviewAiAnalysis;
  planActions?: WeeklyReviewPlanActions | null;
  completionSummary?: WeeklyReviewCompletionSummary | null;
  generatedAt?: string | null;
  plannedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReviewListResult {
  reviews: WeeklyReview[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface WeeklyReviewCurrentDashboard {
  weekStart: string;
  weekEnd: string;
  isMidWeek: boolean;
  hasGeneratedReview: boolean;
  statsPartial: WeeklyReviewStats;
  velocityData: WeeklyReviewVelocityWeek[];
  trailingAverageStoryPoints: number;
  currentWeekStoryPoints: number;
}
