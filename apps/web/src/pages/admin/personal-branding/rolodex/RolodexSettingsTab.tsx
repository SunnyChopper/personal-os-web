import type { Toast } from '@/hooks/use-toast';
import { pbBodySecondaryClassName } from '../personal-branding-ui';
import RolodexNotificationsCard from './RolodexNotificationsCard';
import ReconSettingsCard from './ReconSettingsCard';

interface RolodexSettingsTabProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function RolodexSettingsTab({ showToast }: RolodexSettingsTabProps) {
  return (
    <div className="space-y-4">
      <p className={pbBodySecondaryClassName}>Notifications and Recon ingest for this module.</p>
      <RolodexNotificationsCard showToast={showToast} />
      <ReconSettingsCard showToast={showToast} />
    </div>
  );
}
