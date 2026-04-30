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
