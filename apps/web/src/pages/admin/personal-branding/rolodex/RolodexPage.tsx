import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';
import { useRolodex } from '@/hooks/useRolodex';
import { useReconFeed } from '@/hooks/useReconFeed';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useToast } from '@/hooks/use-toast';
import SubModuleTabShell from '../SubModuleTabShell';
import ConnectionDirectoryTab from './ConnectionDirectoryTab';
import InteractionsBoardTab from './InteractionsBoardTab';
import ReconFeedTab from './ReconFeedTab';

const TABS = [
  { id: 'interactions', label: 'Interactions Board' },
  { id: 'directory', label: 'Connection Directory' },
  { id: 'recon-feed', label: 'Recon Feed' },
] as const;

export default function RolodexPage() {
  const rolodex = useRolodex();
  const reconFeed = useReconFeed();
  const brandIdentity = usePersonalBrandingBrandIdentity();
  const selectedProfileId = brandIdentity.selectedProfileId;
  const { showToast, ToastContainer } = useToast();
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

  const isLoading =
    rolodex.connections.isPending ||
    rolodex.interactionsBoard.isPending ||
    rolodex.trackingMetrics.isPending ||
    reconFeed.settings.isPending ||
    followUpAlertsQ.isPending;

  const profileId = useMemo(() => selectedProfileId, [selectedProfileId]);

  const handleAlertsToggle = async (enabled: boolean) => {
    setDraftAlertsEnabled(enabled);
    try {
      await saveAlertsMut.mutateAsync(enabled);
      showToast({
        type: 'success',
        title: enabled ? 'Follow-up alerts enabled' : 'Follow-up alerts disabled',
      });
      setDraftAlertsEnabled(null);
    } catch (err) {
      setDraftAlertsEnabled(null);
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to save alert settings',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/40">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Follow-up alerts</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Daily email digest when connections are due for follow-up (uses your saved notification
            webhook when enabled in proactive settings).
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            checked={alertsEnabled}
            disabled={followUpAlertsQ.isPending || saveAlertsMut.isPending}
            onChange={(event) => void handleAlertsToggle(event.target.checked)}
          />
          <span>{saveAlertsMut.isPending ? 'Saving…' : 'Enabled'}</span>
        </label>
      </div>

      <SubModuleTabShell
        tabs={TABS}
        defaultTabId="interactions"
        ariaLabel="Rolodex sections"
        isLoading={isLoading}
        skeletonLayout="single-column"
        renderPanel={(activeTab) =>
          activeTab === 'directory' ? (
            <ConnectionDirectoryTab rolodex={rolodex} />
          ) : activeTab === 'recon-feed' ? (
            <ReconFeedTab />
          ) : (
            <InteractionsBoardTab rolodex={rolodex} selectedProfileId={profileId} />
          )
        }
      />
      <ToastContainer />
    </div>
  );
}
