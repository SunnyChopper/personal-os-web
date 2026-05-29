import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitnessService } from '@/services/fitness.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type {
  AuraXMetric,
  CreateFitnessRewardRuleInput,
  MealPlanMeal,
  MealType,
  PatchScheduledWorkoutDayInput,
  SetType,
  ScheduleDayType,
  UpdateFitnessRewardRuleInput,
  UpsertWorkoutScheduleInput,
  WorkoutScheduleWeekdayEntry,
} from '@/types/fitness';

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

export function useFitnessPantryList(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: queryKeys.fitness.pantry.list(page, pageSize),
    queryFn: () => fitnessService.listPantry(page, pageSize),
  });
}

export function useFitnessMealPlansList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.fitness.mealPlans.list(page, pageSize),
    queryFn: () => fitnessService.listMealPlans(page, pageSize),
  });
}

export function useCreatePantryItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; quantity?: number; unit?: string; category?: string }) =>
      fitnessService.createPantryItem(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.pantry.all() });
    },
  });
}

export function useUpdatePantryItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; quantity?: number; unit?: string; category?: string };
    }) => fitnessService.updatePantryItem(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.pantry.all() });
    },
  });
}

export function useDeletePantryItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fitnessService.deletePantryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.pantry.all() });
    },
  });
}

export function useGenerateMealsMutation() {
  return useMutation({
    mutationFn: (body: {
      mealsCount?: number;
      preferences?: string;
      provider?: string;
      useCache?: boolean;
    }) => fitnessService.generateMeals(body),
  });
}

export function useCreateMealPlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title?: string;
      pantrySnapshot: string[];
      meals: MealPlanMeal[];
      provider?: string;
      model?: string;
    }) => fitnessService.createMealPlan(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.mealPlans.all() });
    },
  });
}

export function useDeleteMealPlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fitnessService.deleteMealPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.mealPlans.all() });
    },
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

export function useRecoveryMetricLinks() {
  return useQuery({
    queryKey: queryKeys.fitness.recovery.metricLinks(),
    queryFn: () => fitnessService.getRecoveryMetricLinks(),
  });
}

export function useSetRecoveryMetricLinksMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (links: Record<string, string | null>) =>
      fitnessService.setRecoveryMetricLinks(links),
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

export function useFitnessRewardRules(page = 1, pageSize = 50, activeOnly = false) {
  return useQuery({
    queryKey: queryKeys.fitness.rewardRules.list(page, pageSize, activeOnly),
    queryFn: () => fitnessService.listRewardRules(page, pageSize, activeOnly),
  });
}

export function useFitnessRewardClaims(filters?: {
  page?: number;
  pageSize?: number;
  ruleId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.fitness.rewardClaims.list(filters ?? {}),
    queryFn: () => fitnessService.listRewardClaims(filters),
  });
}

export function useCreateRewardRuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFitnessRewardRuleInput) => fitnessService.createRewardRule(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.rewardRules.all() });
    },
  });
}

export function useUpdateRewardRuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFitnessRewardRuleInput }) =>
      fitnessService.updateRewardRule(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.rewardRules.all() });
    },
  });
}

export function useDeleteRewardRuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fitnessService.deleteRewardRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.rewardRules.all() });
    },
  });
}

export function useClaimRewardRuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fitnessService.claimRewardRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.rewardRules.all() });
      qc.invalidateQueries({ queryKey: queryKeys.fitness.rewardClaims.all() });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
}

export function useWorkoutSchedule() {
  return useQuery({
    queryKey: queryKeys.fitness.workoutSchedule.baseline(),
    queryFn: () => fitnessService.getWorkoutSchedule(),
  });
}

export function useScheduledWorkoutDays(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.fitness.workoutSchedule.days(startDate, endDate),
    queryFn: () => fitnessService.listScheduledWorkoutDays(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  });
}

export function usePendingWorkoutSkips() {
  return useQuery({
    queryKey: queryKeys.fitness.workoutSchedule.pendingSkips(),
    queryFn: () => fitnessService.listPendingWorkoutSkips(),
  });
}

export function useUpsertWorkoutScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertWorkoutScheduleInput) => fitnessService.upsertWorkoutSchedule(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.workoutSchedule.all() });
    },
  });
}

export function usePatchScheduledWorkoutDayMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, body }: { date: string; body: PatchScheduledWorkoutDayInput }) =>
      fitnessService.patchScheduledWorkoutDay(date, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.workoutSchedule.all() });
    },
  });
}

export function useSubmitWorkoutSkipReasonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, reason }: { date: string; reason: string }) =>
      fitnessService.submitWorkoutSkipReason(date, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.workoutSchedule.all() });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function defaultWeekdayEntries(): WorkoutScheduleWeekdayEntry[] {
  return WEEKDAY_LABELS.map((_, weekday) => ({
    weekday,
    dayType: 'rest' as ScheduleDayType,
    templateId: null,
  }));
}
