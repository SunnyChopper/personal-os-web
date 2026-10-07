import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBrandProfilesList } from '@/hooks/useBrandProfilesList';
import { useRolodex } from '@/hooks/useRolodex';
import { useReconFeed } from '@/hooks/useReconFeed';
import { useRolodexFollowUpAlerts } from '@/hooks/useRolodexFollowUpAlerts';
import { useReconFeedContentAlerts } from '@/hooks/useReconFeedContentAlerts';
import { useToast } from '@/hooks/use-toast';
import SubModuleTabShell from '../SubModuleTabShell';
import ConnectionDirectoryTab from './ConnectionDirectoryTab';
import InteractionsBoardTab from './InteractionsBoardTab';
import ReconFeedTab from './ReconFeedTab';
import RolodexSettingsTab from './RolodexSettingsTab';

const TABS = [
  { id: 'recon-feed', label: 'Recon Feed' },
  { id: 'interactions', label: 'Interactions Board' },
  { id: 'directory', label: 'Connection Directory' },
  { id: 'settings', label: 'Settings' },
] as const;

type RolodexTabId = (typeof TABS)[number]['id'];

const DEFAULT_TAB_ID: RolodexTabId = 'recon-feed';

const VALID_TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

function resolveTabId(raw: string | null): RolodexTabId {
  if (raw && VALID_TAB_IDS.has(raw)) {
    return raw as RolodexTabId;
  }
  return DEFAULT_TAB_ID;
}

export default function RolodexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = resolveTabId(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<RolodexTabId>(tabFromUrl);

  const rolodex = useRolodex();
  const reconFeed = useReconFeed();
  const { followUpAlertsQ } = useRolodexFollowUpAlerts();
  const { contentAlertsQ } = useReconFeedContentAlerts();
  // Profiles list only — full Brand Identity fan-out amplified cold-start timeouts
  // (alerts 567c68a56446, a98591bd8564, c6bd8a4286da).
  const { selectedProfileId, profileOptions } = useBrandProfilesList();
  const { showToast } = useToast();

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const isLoading =
    rolodex.connections.isPending ||
    rolodex.interactionsBoard.isPending ||
    rolodex.trackingMetrics.isPending ||
    reconFeed.settings.isPending ||
    followUpAlertsQ.isPending ||
    contentAlertsQ.isPending;

  const handleTabChange = (tabId: string) => {
    const nextTab = resolveTabId(tabId);
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    if (nextTab !== 'recon-feed') {
      nextParams.delete('runId');
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-4">
      <SubModuleTabShell
        tabs={TABS}
        defaultTabId={DEFAULT_TAB_ID}
        ariaLabel="Rolodex sections"
        isLoading={isLoading}
        skeletonLayout="single-column"
        activeTabId={activeTab}
        onTabChange={handleTabChange}
        renderPanel={(currentTab) =>
          currentTab === 'directory' ? (
            <ConnectionDirectoryTab rolodex={rolodex} />
          ) : currentTab === 'recon-feed' ? (
            <ReconFeedTab
              showToast={showToast}
              rolodex={rolodex}
              profiles={profileOptions}
              selectedProfileId={selectedProfileId}
            />
          ) : currentTab === 'settings' ? (
            <RolodexSettingsTab showToast={showToast} />
          ) : (
            <InteractionsBoardTab
              rolodex={rolodex}
              selectedProfileId={selectedProfileId}
              profiles={profileOptions}
            />
          )
        }
      />
    </div>
  );
}
