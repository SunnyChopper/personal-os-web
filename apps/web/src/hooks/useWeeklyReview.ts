import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';
import { formatApiFailure } from '@/utils/api-error-formatter';
import { queryKeys } from '@/lib/react-query/query-keys';
import { weeklyReviewService } from '@/services/growth-system';
import type { WeeklyReview, WeeklyReviewPlanActions } from '@/types/growth-system';

export function useWeeklyReviewCurrent(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.growthSystem.weeklyReviews.current(),
    queryFn: async () => {
      const res = await weeklyReviewService.getCurrent();
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to load current weekly review'));
      }
      return res.data;
    },
    staleTime: 60_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true,
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
  };

  const generate = useMutation({
    mutationFn: async (ws?: string) => {
      const res = await weeklyReviewService.generate(ws);
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
