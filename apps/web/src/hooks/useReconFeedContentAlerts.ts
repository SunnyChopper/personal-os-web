import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/query-keys';

export function useReconFeedContentAlerts() {
  const qc = useQueryClient();
  const [draftAlertsEnabled, setDraftAlertsEnabled] = useState<boolean | null>(null);

  const contentAlertsQ = useQuery({
    queryKey: queryKeys.preferences.reconFeedContentNotifications(),
    queryFn: async () => {
      const res = await apiClient.getReconFeedContentNotifications();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load Recon Feed alert settings');
      }
      return res.data;
    },
  });

  const saveAlertsMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      const current = contentAlertsQ.data ?? {
        enabled: true,
        channelEmailEnabled: true,
        channelWebhookEnabled: false,
      };
      const res = await apiClient.setReconFeedContentNotifications({
        ...current,
        enabled,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to save Recon Feed alert settings');
      }
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.preferences.reconFeedContentNotifications(),
      });
    },
  });

  const alertsEnabled = draftAlertsEnabled ?? contentAlertsQ.data?.enabled ?? true;

  return {
    contentAlertsQ,
    saveAlertsMut,
    draftAlertsEnabled,
    setDraftAlertsEnabled,
    alertsEnabled,
  };
}
