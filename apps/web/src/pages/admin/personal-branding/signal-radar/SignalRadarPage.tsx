import { useSignalRadar } from '@/hooks/useSignalRadar';
import SubModuleTabShell from '../SubModuleTabShell';
import SourceManagementTab from './SourceManagementTab';
import TrendStreamTab from './TrendStreamTab';

const TABS = [
  { id: 'trends', label: 'Trend Stream' },
  { id: 'sources', label: 'Source Management' },
] as const;

export default function SignalRadarPage() {
  const signalRadar = useSignalRadar();
  const isLoading = signalRadar.settings.isPending || signalRadar.sources.isPending;

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="trends"
      ariaLabel="Signal Radar sections"
      isLoading={isLoading}
      skeletonLayout="single-column"
      renderPanel={(activeTab) =>
        activeTab === 'sources' ? (
          <SourceManagementTab signalRadar={signalRadar} />
        ) : (
          <TrendStreamTab />
        )
      }
    />
  );
}
