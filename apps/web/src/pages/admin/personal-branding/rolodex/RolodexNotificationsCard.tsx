import type { Toast } from '@/hooks/use-toast';
import { useReconFeedContentAlerts } from '@/hooks/useReconFeedContentAlerts';
import { useRolodexFollowUpAlerts } from '@/hooks/useRolodexFollowUpAlerts';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';

interface RolodexNotificationsCardProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function RolodexNotificationsCard({ showToast }: RolodexNotificationsCardProps) {
  const {
    followUpAlertsQ,
    saveAlertsMut: saveFollowUpMut,
    setDraftAlertsEnabled: setFollowUpDraft,
    alertsEnabled: followUpEnabled,
  } = useRolodexFollowUpAlerts();

  const {
    contentAlertsQ,
    saveAlertsMut: saveReconMut,
    setDraftAlertsEnabled: setReconDraft,
    alertsEnabled: reconEnabled,
  } = useReconFeedContentAlerts();

  const handleFollowUpToggle = async (enabled: boolean) => {
    setFollowUpDraft(enabled);
    try {
      await saveFollowUpMut.mutateAsync(enabled);
      showToast({
        type: 'success',
        title: enabled ? 'Follow-up alerts enabled' : 'Follow-up alerts disabled',
      });
      setFollowUpDraft(null);
    } catch (err) {
      setFollowUpDraft(null);
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to save alert settings',
      });
    }
  };

  const handleReconToggle = async (enabled: boolean) => {
    setReconDraft(enabled);
    try {
      await saveReconMut.mutateAsync(enabled);
      showToast({
        type: 'success',
        title: enabled ? 'Recon Feed alerts enabled' : 'Recon Feed alerts disabled',
      });
      setReconDraft(null);
    } catch (err) {
      setReconDraft(null);
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to save alert settings',
      });
    }
  };

  return (
    <PageCard className="space-y-3 p-4" aria-labelledby="rolodex-notifications-heading">
      <SectionIntro
        titleId="rolodex-notifications-heading"
        title="Notifications"
        description="Uses your saved notification webhook when enabled in proactive settings."
      />

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Follow-up alerts</p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              Daily email digest when connections are due for follow-up.
            </p>
          </div>
          <label className="inline-flex shrink-0 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300"
              checked={followUpEnabled}
              disabled={followUpAlertsQ.isPending || saveFollowUpMut.isPending}
              onChange={(event) => void handleFollowUpToggle(event.target.checked)}
            />
            <span>{saveFollowUpMut.isPending ? 'Saving…' : 'Enabled'}</span>
          </label>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 pt-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Recon Feed alerts</p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              Email when a sync finds new posts worth interacting with (links, snippet, and why).
            </p>
          </div>
          <label className="inline-flex shrink-0 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300"
              checked={reconEnabled}
              disabled={contentAlertsQ.isPending || saveReconMut.isPending}
              onChange={(event) => void handleReconToggle(event.target.checked)}
            />
            <span>{saveReconMut.isPending ? 'Saving…' : 'Enabled'}</span>
          </label>
        </div>
      </div>
    </PageCard>
  );
}
