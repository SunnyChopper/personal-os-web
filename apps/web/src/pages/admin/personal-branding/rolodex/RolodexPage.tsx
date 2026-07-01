import { useMemo } from 'react';
import { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';
import { useRolodex } from '@/hooks/useRolodex';
import SubModuleTabShell from '../SubModuleTabShell';
import ConnectionDirectoryTab from './ConnectionDirectoryTab';
import InteractionsBoardTab from './InteractionsBoardTab';

const TABS = [
  { id: 'interactions', label: 'Interactions Board' },
  { id: 'directory', label: 'Connection Directory' },
] as const;

export default function RolodexPage() {
  const rolodex = useRolodex();
  const brandIdentity = usePersonalBrandingBrandIdentity();
  const selectedProfileId = brandIdentity.selectedProfileId;

  const isLoading =
    rolodex.connections.isPending ||
    rolodex.interactionsBoard.isPending ||
    rolodex.trackingMetrics.isPending;

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
        ) : (
          <InteractionsBoardTab rolodex={rolodex} selectedProfileId={profileId} />
        )
      }
    />
  );
}
