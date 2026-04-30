import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitnessService } from '@/services/fitness.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { AuraXMetric, MealType, SetType } from '@/types/fitness';

export function useFitnessExercises(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: queryKeys.fitness.exercises.list(page, pageSize),
    queryFn: () => fitnessService.listExercises(page, pageSize),
  });
}

export function useFitnessTemplates(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: queryKeys.fitness.templates.list(page, pageSize),
    queryFn: () => fitnessService.listTemplates(page, pageSize),
  });
}

export function useFitnessSessions(filters: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.fitness.sessions.list(filters),
    queryFn: () => fitnessService.listSessions(filters),
  });
}

export function useFitnessSessionSets(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.fitness.sessions.sets(sessionId ?? ''),
    queryFn: () => fitnessService.listSets(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useFitnessNutritionList(filters: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.fitness.nutrition.list(filters),
    queryFn: () => fitnessService.listNutrition(filters),
  });
}

export function useFitnessRecoveryRange(
  startDate: string,
  endDate: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.fitness.recovery.range(startDate, endDate),
    queryFn: () => fitnessService.listRecovery(startDate, endDate),
    enabled: (options?.enabled ?? true) && Boolean(startDate && endDate),
  });
}

export function useOverloadSuggestion(exerciseId: string | null) {
  return useQuery({
    queryKey: queryKeys.fitness.overload(exerciseId ?? ''),
    queryFn: () => fitnessService.overloadSuggestion(exerciseId!),
    enabled: Boolean(exerciseId),
  });
}

export function useAuraSeries(startDate: string, endDate: string, xMetric: AuraXMetric) {
  return useQuery({
    queryKey: queryKeys.fitness.aura(startDate, endDate, xMetric),
    queryFn: () => fitnessService.aura(startDate, endDate, xMetric),
    enabled: Boolean(startDate && endDate),
  });
}

export function useParseNutritionMutation() {
  return useMutation({
    mutationFn: (body: { text: string; provider?: string; useCache?: boolean }) =>
      fitnessService.parseNutrition(body),
  });
}

export function useCreateNutritionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      loggedAt: string;
      mealType: MealType;
      foodName?: string;
      sourceText?: string;
      calories: number;
      proteinGrams: number;
      carbGrams: number;
      fatGrams: number;
      fiberGrams?: number;
      confidence?: number;
      parseProvider?: string;
      parseModel?: string;
      sourceMealPlanId?: string;
      sourceMealSlotId?: string;
      sourceRecipeId?: string;
    }) => fitnessService.createNutrition(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.nutrition.all() });
    },
  });
}

export function useUpsertRecoveryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, body }: { date: string; body: Record<string, unknown> }) =>
      fitnessService.upsertRecovery(date, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.all });
    },
  });
}

export function useCreateSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { templateId?: string; sessionDate: string; notes?: string }) =>
      fitnessService.createSession(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.sessions.all() });
    },
  });
}

export function useUpdateSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { status?: string; notes?: string; sessionDate?: string };
    }) => fitnessService.updateSession(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.sessions.all() });
    },
  });
}

export function useAddSetMutation(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      exerciseId: string;
      setIndex: number;
      setType?: SetType;
      targetReps: number;
      completedReps?: number;
      weight: number;
      rpe?: number;
      isSuccessful?: boolean;
    }) => fitnessService.addSet(sessionId!, body),
    onSuccess: () => {
      if (sessionId) {
        qc.invalidateQueries({ queryKey: queryKeys.fitness.sessions.sets(sessionId) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.fitness.sessions.all() });
    },
  });
}

export function useUpdateSetMutation(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      setId,
      body,
    }: {
      setId: string;
      body: {
        completedReps?: number;
        weight?: number;
        rpe?: number;
        isSuccessful?: boolean;
        targetReps?: number;
        setType?: SetType;
      };
    }) => fitnessService.updateSet(sessionId!, setId, body),
    onSuccess: () => {
      if (sessionId) {
        qc.invalidateQueries({ queryKey: queryKeys.fitness.sessions.sets(sessionId) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.fitness.sessions.all() });
    },
  });
}

export function useCreateExerciseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      unit?: 'pounds' | 'kg';
      movementPattern?: string;
      defaultRepRangeMin?: number;
      defaultRepRangeMax?: number;
      incrementMode?: 'fixed' | 'percentage';
      incrementAmount?: number;
      deloadPercent?: number;
    }) => fitnessService.createExercise(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.exercises.all() });
    },
  });
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      split?: string;
      isActive?: boolean;
      exerciseIds?: string[];
    }) => fitnessService.createTemplate(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.templates.all() });
    },
  });
}
