import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  AuraSeries,
  AuraXMetric,
  DailyRecovery,
  FitnessExercise,
  NutritionEntry,
  NutritionParseAiData,
  OverloadSuggestion,
  PaginatedFitness,
  SetType,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
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

  aura: async (
    startDate: string,
    endDate: string,
    xMetric: AuraXMetric = 'sleepHours'
  ): Promise<ApiResponse<AuraSeries>> => {
    const q = new URLSearchParams({ startDate, endDate, xMetric });
    return apiClient.get(`/fitness/aura?${q}`);
  },
};
