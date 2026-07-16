import type { Toast } from '@/hooks/use-toast';
import FollowUpAlertsCard from './FollowUpAlertsCard';
import ReconFeedAlertsCard from './ReconFeedAlertsCard';
import ReconSettingsCard from './ReconSettingsCard';

interface RolodexSettingsTabProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function RolodexSettingsTab({ showToast }: RolodexSettingsTabProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Notifications and Recon ingest for this module.
      </p>
      <FollowUpAlertsCard showToast={showToast} />
      <ReconFeedAlertsCard showToast={showToast} />
      <ReconSettingsCard showToast={showToast} />
    </div>
  );
}
