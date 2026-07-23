import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSignalRadar } from '@/hooks/useSignalRadar';
import { useToast } from '@/hooks/use-toast';
import SubModuleTabShell from '../SubModuleTabShell';
import SignalRadarSettingsTab from './SignalRadarSettingsTab';
import SourceManagementTab from './SourceManagementTab';
import TrendStreamTab from './TrendStreamTab';

const TABS = [
  { id: 'trends', label: 'Trend Stream' },
  { id: 'sources', label: 'Source Management' },
  { id: 'settings', label: 'Settings' },
] as const;

type SignalRadarTabId = (typeof TABS)[number]['id'];

const DEFAULT_TAB_ID: SignalRadarTabId = 'trends';

const VALID_TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

function resolveTabId(raw: string | null): SignalRadarTabId {
  if (raw && VALID_TAB_IDS.has(raw)) {
    return raw as SignalRadarTabId;
  }
  return DEFAULT_TAB_ID;
}

export default function SignalRadarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = resolveTabId(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<SignalRadarTabId>(tabFromUrl);
  const signalRadar = useSignalRadar();
  const { showToast, ToastContainer } = useToast();
  const isLoading = signalRadar.settings.isPending || signalRadar.sources.isPending;

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (tabId: string) => {
    const nextTab = resolveTabId(tabId);
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-4">
      <SubModuleTabShell
        tabs={TABS}
        defaultTabId={DEFAULT_TAB_ID}
        ariaLabel="Signal Radar sections"
        isLoading={isLoading}
        skeletonLayout="single-column"
        activeTabId={activeTab}
        onTabChange={handleTabChange}
        renderPanel={(currentTab) =>
          currentTab === 'sources' ? (
            <SourceManagementTab signalRadar={signalRadar} />
          ) : currentTab === 'settings' ? (
            <SignalRadarSettingsTab signalRadar={signalRadar} showToast={showToast} />
          ) : (
            <TrendStreamTab
              signalRadar={signalRadar}
              onOpenSettings={() => handleTabChange('settings')}
            />
          )
        }
      />
      <ToastContainer />
    </div>
  );
}
