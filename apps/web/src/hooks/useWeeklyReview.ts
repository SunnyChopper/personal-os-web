import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';
import { formatApiFailure } from '@/utils/api-error-formatter';
import { queryKeys } from '@/lib/react-query/query-keys';
import { weeklyReviewService } from '@/services/growth-system';
import type {
  WeeklyReview,
  WeeklyReviewGeneratePayload,
  WeeklyReviewLeverageRoiResponse,
  WeeklyReviewPlanActions,
  WeeklyReviewSendEmailResult,
} from '@/types/growth-system';

export function useWeeklyReviewCurrent(options?: {
  weeks?: number;
  rollingWindow?: number;
  refetchInterval?: number | false;
  enabled?: boolean;
}) {
  const weeks = options?.weeks ?? 5;
  const rollingWindow = options?.rollingWindow ?? 4;
  return useQuery({
    queryKey: queryKeys.growthSystem.weeklyReviews.current(weeks, rollingWindow),
    queryFn: async () => {
      const res = await weeklyReviewService.getCurrent(weeks, rollingWindow);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to load current weekly review'));
      }
      return res.data;
    },
    staleTime: 60_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

export function useWeeklyReviewList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.growthSystem.weeklyReviews.list(page, pageSize),
    queryFn: async () => {
      const res = await weeklyReviewService.list(page, pageSize);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to load weekly review list'));
      }
      return res.data;
    },
    staleTime: 120_000,
  });
}

export function useWeeklyReviewSnapshot(
  weekStart: string | null,
  options?: {
    refetchInterval?:
      | number
      | false
      | ((query: Query<WeeklyReview | null, Error>) => number | false);
  }
) {
  return useQuery({
    queryKey: weekStart
      ? queryKeys.growthSystem.weeklyReviews.detail(weekStart)
      : ['weekly-review', 'none'],
    queryFn: async () => {
      if (!weekStart) return null;
      const res = await weeklyReviewService.get(weekStart);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to load weekly review snapshot'));
      }
      return res.data;
    },
    enabled: Boolean(weekStart),
    staleTime: 60_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true,
  });
}

export function useWeeklyReviewMutations(weekStart: string | null) {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.growthSystem.weeklyReviews.all() });
    await qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
    await qc.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
    await qc.invalidateQueries({ queryKey: ['growth-system', 'planner'] });
    await qc.invalidateQueries({ queryKey: queryKeys.growthSystem.habits.all() });
    await qc.invalidateQueries({ queryKey: ['metrics'] });
  };

  const generate = useMutation({
    mutationFn: async (payload?: WeeklyReviewGeneratePayload) => {
      const res = await weeklyReviewService.generate(payload);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Generate weekly review failed'));
      }
      return res.data;
    },
    onSuccess: invalidate,
  });

  const savePlan = useMutation({
    mutationFn: async (plan: WeeklyReviewPlanActions) => {
      if (!weekStart) throw new Error('No week');
      const res = await weeklyReviewService.savePlan(weekStart, plan);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Save weekly review plan failed'));
      }
      return res.data;
    },
    onSuccess: invalidate,
  });

  const complete = useMutation({
    mutationFn: async () => {
      if (!weekStart) throw new Error('No week');
      const res = await weeklyReviewService.complete(weekStart);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Complete weekly review failed'));
      }
      return res.data;
    },
    onSuccess: invalidate,
  });

  const suggestTasks = useMutation({
    mutationFn: async (ws?: string) => {
      const res = await weeklyReviewService.suggestTasks(ws);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Suggest tasks failed'));
      }
      return res.data.suggestedTasks;
    },
  });

  const discard = useMutation({
    mutationFn: async (ws: string) => {
      const res = await weeklyReviewService.discard(ws);
      if (!res.success) {
        throw new Error(formatApiFailure(res.error, 'Discard weekly review failed'));
      }
    },
    onSuccess: invalidate,
  });

  return { generate, savePlan, complete, suggestTasks, discard };
}

export function useSendWeeklyReviewEmail() {
  return useMutation({
    mutationFn: async (weekStart: string): Promise<WeeklyReviewSendEmailResult> => {
      const res = await weeklyReviewService.sendEmail(weekStart);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Send weekly review email failed'));
      }
      return res.data;
    },
  });
}

export function useWeeklyReviewLeverageRoi(options?: {
  days?: number;
  anchorDate?: string | null;
  enabled?: boolean;
}) {
  const days = options?.days ?? 7;
  const anchorDate = options?.anchorDate ?? null;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.growthSystem.weeklyReviews.leverageRoi(days, anchorDate),
    queryFn: async (): Promise<WeeklyReviewLeverageRoiResponse> => {
      const res = await weeklyReviewService.getLeverageRoi({
        days,
        ...(anchorDate ? { anchorDate } : {}),
      });
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to load leverage ROI retrospective'));
      }
      return res.data;
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
