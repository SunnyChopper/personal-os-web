import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { plannerService } from '@/services/growth-system/planner.service';
import type { PlannerBlock, PlannerWeek } from '@/types/planner';

function requireData<T>(res: { success: boolean; data?: T; error?: { message?: string } }): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message ?? 'Request failed');
  }
  return res.data;
}

export function usePlannerWeek(weekStart: string | null) {
  return useQuery({
    queryKey: weekStart ? queryKeys.growthSystem.planner.week(weekStart) : ['planner', 'off'],
    enabled: !!weekStart,
    queryFn: async () => requireData(await plannerService.getWeek(weekStart!)),
  });
}

export function usePlannerGenerate(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (includeLlmSchedule: boolean) =>
      requireData(await plannerService.generateWeek(weekStart, includeLlmSchedule)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.week(weekStart) });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
    },
  });
}

export function usePlannerAutoSchedule(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => requireData(await plannerService.autoSchedule(weekStart)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.week(weekStart) });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
    },
  });
}

export function usePatchPlannerBlock(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      blockId: string;
      date?: string;
      startAt: string;
      endAt: string;
    }) =>
      requireData(
        await plannerService.moveBlock(vars.blockId, {
          date: vars.date,
          startAt: vars.startAt,
          endAt: vars.endAt,
        })
      ),
    onMutate: async (vars) => {
      const key = queryKeys.growthSystem.planner.week(weekStart);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PlannerWeek>(key);
      if (!previous) return { previous };

      let moved: PlannerBlock | undefined;
      const strippedDays = previous.days.map((day) => ({
        ...day,
        blocks: day.blocks.filter((b) => {
          if (b.id === vars.blockId) {
            moved = b;
            return false;
          }
          return true;
        }),
      }));

      if (!moved) return { previous };

      const targetDate = vars.date ?? moved.date;
      const durationMinutes = Math.max(
        1,
        Math.round(
          (new Date(vars.endAt).getTime() - new Date(vars.startAt).getTime()) / 60000
        )
      );
      const newBlock: PlannerBlock = {
        ...moved,
        date: targetDate,
        startAt: vars.startAt,
        endAt: vars.endAt,
        durationMinutes,
      };

      const next: PlannerWeek = {
        ...previous,
        days: strippedDays.map((d) =>
          d.date === targetDate ? { ...d, blocks: [...d.blocks, newBlock] } : d
        ),
      };
      qc.setQueryData(key, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.growthSystem.planner.week(weekStart), ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.week(weekStart) });
    },
  });
}

export function useDeletePlannerBlock(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => requireData(await plannerService.deleteBlock(blockId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.week(weekStart) });
    },
  });
}

export function useOneThing(date: string | null) {
  return useQuery({
    queryKey: date ? queryKeys.growthSystem.planner.oneThing(date) : ['planner', 'one-thing', 'off'],
    enabled: !!date,
    queryFn: async () => requireData(await plannerService.getOneThing(date!)),
  });
}

export function useSuggestOneThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetDate: string) =>
      requireData(await plannerService.suggestOneThing(targetDate)),
    onSuccess: (_data, targetDate) => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.oneThing(targetDate) });
    },
  });
}

export function useSetOneThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { targetDate: string; taskId: string; selectionReason?: string }) =>
      requireData(await plannerService.setOneThing(body)),
    onSuccess: (_data, body) => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.oneThing(body.targetDate) });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.all() });
    },
  });
}

export function useRescueTask(weekStartForInvalidation: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { taskId: string; targetDate?: string }) =>
      requireData(await plannerService.rescueTask(vars.taskId, { targetDate: vars.targetDate })),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.week(weekStartForInvalidation) });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.detail(vars.taskId) });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
    },
  });
}
