import type { Toast } from '@/hooks/use-toast';
import { useReconFeedContentAlerts } from '@/hooks/useReconFeedContentAlerts';
import { PageCard } from '../PersonalBrandingPageTemplate';

interface ReconFeedAlertsCardProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function ReconFeedAlertsCard({ showToast }: ReconFeedAlertsCardProps) {
  const { contentAlertsQ, saveAlertsMut, setDraftAlertsEnabled, alertsEnabled } =
    useReconFeedContentAlerts();

  const handleAlertsToggle = async (enabled: boolean) => {
    setDraftAlertsEnabled(enabled);
    try {
      await saveAlertsMut.mutateAsync(enabled);
      showToast({
        type: 'success',
        title: enabled ? 'Recon Feed alerts enabled' : 'Recon Feed alerts disabled',
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recon Feed alerts</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Email when a sync finds new posts worth interacting with (links, snippet, and why). Uses
            your saved notification webhook when enabled in proactive settings.
          </p>
        </div>
        <label className="inline-flex shrink-0 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            checked={alertsEnabled}
            disabled={contentAlertsQ.isPending || saveAlertsMut.isPending}
            onChange={(event) => void handleAlertsToggle(event.target.checked)}
          />
          <span>{saveAlertsMut.isPending ? 'Saving…' : 'Enabled'}</span>
        </label>
      </div>
    </PageCard>
  );
}
