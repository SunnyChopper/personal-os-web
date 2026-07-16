import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/query-keys';

export function useRolodexFollowUpAlerts() {
  const qc = useQueryClient();
  const [draftAlertsEnabled, setDraftAlertsEnabled] = useState<boolean | null>(null);

  const followUpAlertsQ = useQuery({
    queryKey: queryKeys.preferences.rolodexFollowUpNotifications(),
    queryFn: async () => {
      const res = await apiClient.getRolodexFollowUpNotifications();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load follow-up alert settings');
      }
      return res.data;
    },
  });

  const saveAlertsMut = useMutation({
    mutationFn: async (enabled: boolean) => {
      const current = followUpAlertsQ.data ?? {
        enabled: true,
        channelEmailEnabled: true,
        channelWebhookEnabled: false,
      };
      const res = await apiClient.setRolodexFollowUpNotifications({
        ...current,
        enabled,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to save follow-up alert settings');
      }
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.preferences.rolodexFollowUpNotifications() });
    },
  });

  const alertsEnabled = draftAlertsEnabled ?? followUpAlertsQ.data?.enabled ?? true;

  return {
    followUpAlertsQ,
    saveAlertsMut,
    draftAlertsEnabled,
    setDraftAlertsEnabled,
    alertsEnabled,
  };
}
