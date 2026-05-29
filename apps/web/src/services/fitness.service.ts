import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  AuraSeries,
  AuraXMetric,
  DailyRecovery,
  FitnessExercise,
  MealPlan,
  MealPlanAiData,
  NutritionEntry,
  NutritionParseAiData,
  OverloadSuggestion,
  PaginatedFitness,
  PantryItem,
  SetType,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
  FitnessRewardRule,
  FitnessRewardClaim,
  FitnessRewardClaimResult,
  CreateFitnessRewardRuleInput,
  UpdateFitnessRewardRuleInput,
  WorkoutSchedule,
  ScheduledWorkoutDayList,
  ScheduledWorkoutDay,
  UpsertWorkoutScheduleInput,
  PatchScheduledWorkoutDayInput,
  SubmitSkipReasonResult,
} from '@/types/fitness';

export const fitnessService = {
  listExercises: async (
    page = 1,
    pageSize = 50
  ): Promise<ApiResponse<PaginatedFitness<FitnessExercise>>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/fitness/exercises?${q}`);
  },

  createExercise: async (body: {
    name: string;
    unit?: 'pounds' | 'kg';
    movementPattern?: string;
    defaultRepRangeMin?: number;
    defaultRepRangeMax?: number;
    incrementMode?: 'fixed' | 'percentage';
    incrementAmount?: number;
    deloadPercent?: number;
  }): Promise<ApiResponse<FitnessExercise>> => apiClient.post('/fitness/exercises', body),

  listTemplates: async (
    page = 1,
    pageSize = 50
  ): Promise<ApiResponse<PaginatedFitness<WorkoutTemplate>>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/fitness/workout-templates?${q}`);
  },

  createTemplate: async (body: {
    name: string;
    split?: string;
    isActive?: boolean;
    exerciseIds?: string[];
  }): Promise<ApiResponse<WorkoutTemplate>> => apiClient.post('/fitness/workout-templates', body),

  listSessions: async (opts?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedFitness<WorkoutSession>>> => {
    const q = new URLSearchParams();
    if (opts?.page) q.append('page', String(opts.page));
    if (opts?.pageSize) q.append('pageSize', String(opts.pageSize));
    if (opts?.startDate) q.append('startDate', opts.startDate);
    if (opts?.endDate) q.append('endDate', opts.endDate);
    return apiClient.get(`/fitness/workout-sessions?${q}`);
  },

  createSession: async (body: {
    templateId?: string;
    sessionDate: string;
    notes?: string;
  }): Promise<ApiResponse<WorkoutSession>> => apiClient.post('/fitness/workout-sessions', body),

  updateSession: async (
    id: string,
    body: { status?: string; notes?: string; sessionDate?: string }
  ): Promise<ApiResponse<WorkoutSession>> =>
    apiClient.patch(`/fitness/workout-sessions/${id}`, body),

  getSession: async (id: string): Promise<ApiResponse<WorkoutSession>> =>
    apiClient.get(`/fitness/workout-sessions/${id}`),

  listSets: async (sessionId: string): Promise<ApiResponse<PaginatedFitness<WorkoutSet>>> =>
    apiClient.get(`/fitness/workout-sessions/${sessionId}/sets`),

  addSet: async (
    sessionId: string,
    body: {
      exerciseId: string;
      setIndex: number;
      setType?: SetType;
      targetReps: number;
      completedReps?: number;
      weight: number;
      rpe?: number;
      isSuccessful?: boolean;
    }
  ): Promise<ApiResponse<WorkoutSet>> =>
    apiClient.post(`/fitness/workout-sessions/${sessionId}/sets`, {
      ...body,
      setType: body.setType ?? 'working',
    }),

  updateSet: async (
    sessionId: string,
    setId: string,
    body: {
      completedReps?: number;
      weight?: number;
      rpe?: number;
      isSuccessful?: boolean;
      targetReps?: number;
      setType?: SetType;
    }
  ): Promise<ApiResponse<WorkoutSet>> =>
    apiClient.patch(`/fitness/workout-sessions/${sessionId}/sets/${setId}`, body),

  overloadSuggestion: async (exerciseId: string): Promise<ApiResponse<OverloadSuggestion>> =>
    apiClient.get(`/fitness/overload-suggestion?exerciseId=${encodeURIComponent(exerciseId)}`),

  listNutrition: async (opts?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedFitness<NutritionEntry>>> => {
    const q = new URLSearchParams();
    if (opts?.page) q.append('page', String(opts.page));
    if (opts?.pageSize) q.append('pageSize', String(opts.pageSize));
    if (opts?.startDate) q.append('startDate', opts.startDate);
    if (opts?.endDate) q.append('endDate', opts.endDate);
    return apiClient.get(`/fitness/nutrition?${q}`);
  },

  createNutrition: async (body: Record<string, unknown>): Promise<ApiResponse<NutritionEntry>> =>
    apiClient.post('/fitness/nutrition', body),

  parseNutrition: async (body: {
    text: string;
    provider?: string;
    useCache?: boolean;
  }): Promise<ApiResponse<NutritionParseAiData>> =>
    apiClient.post('/ai/fitness/nutrition/parse', body),

  listPantry: async (
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<PaginatedFitness<PantryItem>>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/fitness/pantry?${q}`);
  },

  createPantryItem: async (body: {
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
  }): Promise<ApiResponse<PantryItem>> => apiClient.post('/fitness/pantry', body),

  updatePantryItem: async (
    id: string,
    body: { name?: string; quantity?: number; unit?: string; category?: string }
  ): Promise<ApiResponse<PantryItem>> => apiClient.patch(`/fitness/pantry/${id}`, body),

  deletePantryItem: async (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiClient.delete(`/fitness/pantry/${id}`),

  generateMeals: async (body: {
    mealsCount?: number;
    preferences?: string;
    provider?: string;
    useCache?: boolean;
  }): Promise<ApiResponse<MealPlanAiData>> => apiClient.post('/ai/fitness/meals/generate', body),

  listMealPlans: async (
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<PaginatedFitness<MealPlan>>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get(`/fitness/meal-plans?${q}`);
  },

  createMealPlan: async (body: Record<string, unknown>): Promise<ApiResponse<MealPlan>> =>
    apiClient.post('/fitness/meal-plans', body),

  getMealPlan: async (id: string): Promise<ApiResponse<MealPlan>> =>
    apiClient.get(`/fitness/meal-plans/${id}`),

  deleteMealPlan: async (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiClient.delete(`/fitness/meal-plans/${id}`),

  listRecovery: async (
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50
  ): Promise<ApiResponse<PaginatedFitness<DailyRecovery>>> => {
    const q = new URLSearchParams({
      startDate,
      endDate,
      page: String(page),
      pageSize: String(pageSize),
    });
    return apiClient.get(`/fitness/recovery?${q}`);
  },

  upsertRecovery: async (
    date: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<DailyRecovery>> => apiClient.put(`/fitness/recovery/${date}`, body),

  getRecoveryMetricLinks: async (): Promise<ApiResponse<{ links: Record<string, string> }>> =>
    apiClient.get('/fitness/recovery/metric-links'),

  setRecoveryMetricLinks: async (
    links: Record<string, string | null>
  ): Promise<ApiResponse<{ links: Record<string, string> }>> =>
    apiClient.put('/fitness/recovery/metric-links', { links }),

  aura: async (
    startDate: string,
    endDate: string,
    xMetric: AuraXMetric = 'sleepHours'
  ): Promise<ApiResponse<AuraSeries>> => {
    const q = new URLSearchParams({ startDate, endDate, xMetric });
    return apiClient.get(`/fitness/aura?${q}`);
  },

  listRewardRules: async (
    page = 1,
    pageSize = 50,
    activeOnly = false
  ): Promise<ApiResponse<PaginatedFitness<FitnessRewardRule>>> => {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      activeOnly: String(activeOnly),
    });
    return apiClient.get(`/fitness/reward-rules?${q}`);
  },

  createRewardRule: async (
    body: CreateFitnessRewardRuleInput
  ): Promise<ApiResponse<FitnessRewardRule>> => apiClient.post('/fitness/reward-rules', body),

  getRewardRule: async (id: string): Promise<ApiResponse<FitnessRewardRule>> =>
    apiClient.get(`/fitness/reward-rules/${id}`),

  updateRewardRule: async (
    id: string,
    body: UpdateFitnessRewardRuleInput
  ): Promise<ApiResponse<FitnessRewardRule>> =>
    apiClient.patch(`/fitness/reward-rules/${id}`, body),

  deleteRewardRule: async (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiClient.delete(`/fitness/reward-rules/${id}`),

  claimRewardRule: async (id: string): Promise<ApiResponse<FitnessRewardClaimResult>> =>
    apiClient.post(`/fitness/reward-rules/${id}/claim`, {}),

  listRewardClaims: async (filters?: {
    page?: number;
    pageSize?: number;
    ruleId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedFitness<FitnessRewardClaim>>> => {
    const q = new URLSearchParams({
      page: String(filters?.page ?? 1),
      pageSize: String(filters?.pageSize ?? 30),
    });
    if (filters?.ruleId) q.set('ruleId', filters.ruleId);
    if (filters?.startDate) q.set('startDate', filters.startDate);
    if (filters?.endDate) q.set('endDate', filters.endDate);
    return apiClient.get(`/fitness/reward-claims?${q}`);
  },

  getWorkoutSchedule: async (): Promise<ApiResponse<WorkoutSchedule | null>> =>
    apiClient.get('/fitness/workout-schedule'),

  upsertWorkoutSchedule: async (
    body: UpsertWorkoutScheduleInput
  ): Promise<ApiResponse<WorkoutSchedule>> => apiClient.put('/fitness/workout-schedule', body),

  listScheduledWorkoutDays: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<ScheduledWorkoutDayList>> => {
    const q = new URLSearchParams({ startDate, endDate });
    return apiClient.get(`/fitness/workout-schedule/days?${q}`);
  },

  listPendingWorkoutSkips: async (): Promise<ApiResponse<ScheduledWorkoutDayList>> =>
    apiClient.get('/fitness/workout-schedule/skips?status=pending'),

  patchScheduledWorkoutDay: async (
    date: string,
    body: PatchScheduledWorkoutDayInput
  ): Promise<ApiResponse<ScheduledWorkoutDay>> =>
    apiClient.patch(`/fitness/workout-schedule/days/${date}`, body),

  submitWorkoutSkipReason: async (
    date: string,
    reason: string
  ): Promise<ApiResponse<SubmitSkipReasonResult>> =>
    apiClient.post(`/fitness/workout-schedule/days/${date}/skip-reason`, { reason }),
};
