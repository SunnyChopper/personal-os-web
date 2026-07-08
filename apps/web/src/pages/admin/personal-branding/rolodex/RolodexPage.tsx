import { useMemo } from 'react';
import { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';
import { useRolodex } from '@/hooks/useRolodex';
import { useReconFeed } from '@/hooks/useReconFeed';
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

  const isLoading =
    rolodex.connections.isPending ||
    rolodex.interactionsBoard.isPending ||
    rolodex.trackingMetrics.isPending ||
    reconFeed.settings.isPending;

  const profileId = useMemo(() => selectedProfileId, [selectedProfileId]);

  return (
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
  );
}
