import type { Toast } from '@/hooks/use-toast';
import type { useSignalRadar } from '@/hooks/useSignalRadar';
import AutoIdeationSettingsCard from '@/components/organisms/personal-branding/AutoIdeationSettingsCard';
import SyncSettingsCard from '@/components/organisms/personal-branding/SyncSettingsCard';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

interface SignalRadarSettingsTabProps {
  signalRadar: SignalRadarHook;
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function SignalRadarSettingsTab({
  signalRadar,
  showToast,
}: SignalRadarSettingsTabProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Sync cadence and nightly Trend Stream brainstorm configuration.
      </p>
      <SyncSettingsCard signalRadar={signalRadar} showToast={showToast} />
      <AutoIdeationSettingsCard signalRadar={signalRadar} showToast={showToast} />
    </div>
  );
}
