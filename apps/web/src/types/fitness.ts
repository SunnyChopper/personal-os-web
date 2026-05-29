/** Health & Fitness API types (camelCase per contract). */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
export type WorkoutSessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type SetType = 'warmup' | 'working';
export type AuraXMetric = 'sleepHours' | 'sleepQuality' | 'energyLevel' | 'recoveryScore';

export interface PaginatedFitness<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FitnessExercise {
  id: string;
  userId: string;
  name: string;
  movementPattern: string | null;
  unit: string;
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  incrementMode: string;
  incrementAmount: number;
  deloadPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  split: string | null;
  isActive: boolean;
  exerciseIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId: string | null;
  sessionDate: string;
  status: string;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  userId: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  setType: string;
  targetReps: number;
  completedReps: number | null;
  weight: number;
  rpe: number | null;
  isSuccessful: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  loggedAt: string;
  mealType: string;
  foodName: string | null;
  sourceText: string | null;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number | null;
  confidence: number | null;
  parseProvider: string | null;
  parseModel: string | null;
  sourceMealPlanId: string | null;
  sourceMealSlotId: string | null;
  sourceRecipeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecoveryLinkableField =
  | 'sleepHours'
  | 'sleepQuality'
  | 'energyLevel'
  | 'restingHeartRate'
  | 'sorenessLevel'
  | 'stressLevel'
  | 'bodyWeight';

export type RecoveryMetricLinks = Partial<Record<RecoveryLinkableField, string>>;

export interface DailyRecovery {
  date: string;
  userId: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  energyLevel: number | null;
  restingHeartRate: number | null;
  sorenessLevel: number | null;
  stressLevel: number | null;
  bodyWeight: number | null;
  notes: string | null;
  recoveryScore: number | null;
  linkedFields?: RecoveryMetricLinks;
  createdAt: string;
  updatedAt: string;
}

export interface OverloadSuggestion {
  exerciseId: string;
  nextSuggestedWeight: number;
  nextSuggestedTargetRepsMin: number;
  nextSuggestedTargetRepsMax: number;
  recommendationReason: string;
  basedOnSessionId: string | null;
  consecutiveFailedSessions: number;
  unit: string;
}

export interface AuraPoint {
  date: string;
  xValue: number;
  yStoryPoints: number;
  recovery: DailyRecovery | null;
}

export interface AuraSeries {
  xMetric: string;
  startDate: string;
  endDate: string;
  points: AuraPoint[];
  correlationCoefficient: number | null;
}

export interface ParsedNutritionFoodItem {
  name: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface ParsedNutritionResult {
  foodItems: ParsedNutritionFoodItem[];
  foodNameSummary: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  assumptions: string[];
  confidence: number;
  needsUserConfirmation: boolean;
}

export interface NutritionParseAiData {
  result: ParsedNutritionResult;
  confidence: number;
  provider: string;
  model: string;
  cached: boolean;
}

export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanMeal {
  id: string;
  name: string;
  mealType: MealType;
  ingredientsUsed: string[];
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  recipeSteps: string[];
  confidence: number | null;
}

export interface MealPlan {
  id: string;
  userId: string;
  title: string | null;
  pantrySnapshot: string[];
  meals: MealPlanMeal[];
  provider: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedMealAi {
  name: string;
  mealType: MealType;
  ingredientsUsed: string[];
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  recipeSteps: string[];
  confidence: number;
}

export interface MealPlanAiResult {
  title: string;
  meals: GeneratedMealAi[];
  assumptions: string[];
  confidence: number;
}

export interface MealPlanAiData {
  result: MealPlanAiResult;
  confidence: number;
  provider: string;
  model: string;
  cached: boolean;
}

export type FitnessRewardCategory =
  | 'hydration'
  | 'nutrition'
  | 'workout'
  | 'recovery'
  | 'benchmark'
  | 'custom';

export type FitnessRewardTriggerType = 'manual' | 'auto';

export type FitnessRewardAutoMetric = 'workout_set_pr' | 'recovery_logged' | 'session_completed';

export type FitnessRewardClaimSource = 'manual' | 'auto';

export interface FitnessRewardRule {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: FitnessRewardCategory;
  points: number;
  target: string | null;
  triggerType: FitnessRewardTriggerType;
  autoMetric: FitnessRewardAutoMetric | null;
  exerciseId: string | null;
  cooldownHours: number | null;
  maxClaimsPerDay: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FitnessRewardClaim {
  id: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  points: number;
  claimedAt: string;
  source: FitnessRewardClaimSource;
  triggerRef: string | null;
  walletTransactionId: string | null;
}

export interface FitnessRewardClaimResult {
  claim: FitnessRewardClaim;
  walletBalance: number;
}

export interface CreateFitnessRewardRuleInput {
  name: string;
  description?: string;
  category?: FitnessRewardCategory;
  points: number;
  target?: string;
  triggerType?: FitnessRewardTriggerType;
  autoMetric?: FitnessRewardAutoMetric;
  exerciseId?: string;
  cooldownHours?: number;
  maxClaimsPerDay?: number;
  isActive?: boolean;
}

export interface UpdateFitnessRewardRuleInput {
  name?: string;
  description?: string;
  category?: FitnessRewardCategory;
  points?: number;
  target?: string;
  triggerType?: FitnessRewardTriggerType;
  autoMetric?: FitnessRewardAutoMetric;
  exerciseId?: string;
  cooldownHours?: number;
  maxClaimsPerDay?: number;
  isActive?: boolean;
}

export type ScheduleDayType = 'workout' | 'rest' | 'day_off';
export type ScheduledDayStatus =
  | 'scheduled'
  | 'completed'
  | 'rest'
  | 'excused_off'
  | 'skip_pending'
  | 'skip_excused'
  | 'skip_penalized';

export interface WorkoutScheduleWeekdayEntry {
  weekday: number;
  dayType: ScheduleDayType;
  templateId?: string | null;
}

export interface WorkoutSchedule {
  userId: string;
  weekdays: WorkoutScheduleWeekdayEntry[];
  timeZone: string;
  isActive: boolean;
  penaltyMin: number;
  penaltyMax: number;
  reasonGraceHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledWorkoutDay {
  date: string;
  userId: string;
  dayType: ScheduleDayType;
  templateId?: string | null;
  plannedReason?: string | null;
  status: ScheduledDayStatus;
  skipReason?: string | null;
  verdict?: string | null;
  verdictRationale?: string | null;
  confidence?: number | null;
  pointsDeducted?: number | null;
  walletTransactionId?: string | null;
  reasonDueBy?: string | null;
  evaluatedAt?: string | null;
  isOverride: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ScheduledWorkoutDayList {
  days: ScheduledWorkoutDay[];
}

export interface UpsertWorkoutScheduleInput {
  weekdays: WorkoutScheduleWeekdayEntry[];
  timeZone?: string;
  isActive?: boolean;
  penaltyMin?: number;
  penaltyMax?: number;
  reasonGraceHours?: number;
}

export interface PatchScheduledWorkoutDayInput {
  dayType?: ScheduleDayType;
  templateId?: string | null;
  plannedReason?: string | null;
}

export interface SubmitSkipReasonResult {
  day: ScheduledWorkoutDay;
  verdict: string;
  confidence: number;
  rationale: string;
  pointsDeducted: number;
  provider: string;
  model: string;
  cached: boolean;
}

export type HealthActionCategory =
  | 'workout'
  | 'recovery'
  | 'nutrition'
  | 'hydration'
  | 'habit'
  | 'rest';

export type HealthActionSeverity = 'low' | 'medium' | 'high';
export type HealthActionStatus = 'fresh' | 'stale' | 'pending';

export interface HealthActionLink {
  label: string;
  link: string;
}

export interface HealthAction {
  id: string;
  category: HealthActionCategory;
  severity: HealthActionSeverity;
  title: string;
  description: string;
  recommendation?: string;
  action?: HealthActionLink;
  detectorType: string;
}

export interface HealthActionResponse {
  action?: HealthAction | null;
  generatedAt?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
  status: HealthActionStatus;
  alternativeCount?: number;
}
