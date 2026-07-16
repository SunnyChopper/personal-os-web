import type { Toast } from '@/hooks/use-toast';
import { useRolodexFollowUpAlerts } from '@/hooks/useRolodexFollowUpAlerts';
import { PageCard } from '../PersonalBrandingPageTemplate';

interface FollowUpAlertsCardProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function FollowUpAlertsCard({ showToast }: FollowUpAlertsCardProps) {
  const { followUpAlertsQ, saveAlertsMut, setDraftAlertsEnabled, alertsEnabled } =
    useRolodexFollowUpAlerts();

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
    <PageCard className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Follow-up alerts</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Daily email digest when connections are due for follow-up (uses your saved notification
            webhook when enabled in proactive settings).
          </p>
        </div>
        <label className="inline-flex shrink-0 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
    </PageCard>
  );
}
