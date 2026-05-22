import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/query-keys';

export const MARGIN_OF_SAFETY_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 0.1, label: '10%' },
  { value: 0.15, label: '15%' },
  { value: 0.2, label: '20%' },
] as const;

function requireData<T>(res: { success: boolean; data?: T; error?: { message?: string } }): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message ?? 'Request failed');
  }
  return res.data;
}

export function useMarginOfSafetyBuffer() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.preferences.marginOfSafetyBuffer(),
    queryFn: async () =>
      requireData(await apiClient.getPreferencesMarginOfSafetyBuffer()).marginOfSafetyBuffer,
  });

  const mutation = useMutation({
    mutationFn: async (marginOfSafetyBuffer: number) =>
      requireData(await apiClient.setPreferencesMarginOfSafetyBuffer({ marginOfSafetyBuffer }))
        .marginOfSafetyBuffer,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.preferences.marginOfSafetyBuffer() });
      void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.planner.all() });
    },
  });

  return { query, mutation };
}
