import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatApiFailure } from '@/utils/api-error-formatter';
import { queryKeys } from '@/lib/react-query/query-keys';
import { weeklyDashboardService } from '@/services/growth-system/weekly-dashboard.service';
import type { WeeklyDashboardConfig } from '@/types/weekly-dashboard';
import { DEFAULT_WEEKLY_DASHBOARD_CONFIG } from '@/types/weekly-dashboard';

export function useWeeklyDashboardConfig() {
  return useQuery({
    queryKey: queryKeys.preferences.weeklyDashboard(),
    queryFn: async () => {
      const res = await weeklyDashboardService.get();
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to load weekly dashboard config'));
      }
      return res.data;
    },
    staleTime: 120_000,
    placeholderData: DEFAULT_WEEKLY_DASHBOARD_CONFIG,
  });
}

export function useWeeklyDashboardConfigMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (config: WeeklyDashboardConfig) => {
      const res = await weeklyDashboardService.put(config);
      if (!res.success || !res.data) {
        throw new Error(formatApiFailure(res.error, 'Failed to save weekly dashboard config'));
      }
      return res.data;
    },
    onMutate: async (next) => {
      const key = queryKeys.preferences.weeklyDashboard();
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WeeklyDashboardConfig>(key);
      qc.setQueryData(key, next);
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.preferences.weeklyDashboard(), ctx.previous);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.preferences.weeklyDashboard(), data);
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.weeklyReviews.all() });
    },
  });
}
