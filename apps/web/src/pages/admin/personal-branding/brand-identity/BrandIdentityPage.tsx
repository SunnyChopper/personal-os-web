import { useState } from 'react';
import SubModuleTabShell from '../SubModuleTabShell';
import CoreProfileTab from './CoreProfileTab';
import PlatformRulesTabPanel from './PlatformRulesTabPanel';
import { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';

const TABS = [
  { id: 'core-profile', label: 'Core Profile' },
  { id: 'platform-rules', label: 'Platform Rules' },
] as const;

type BrandIdentityTabId = (typeof TABS)[number]['id'];

export default function BrandIdentityPage() {
  const [activeTab, setActiveTab] = useState<BrandIdentityTabId>('core-profile');
  const brandIdentity = usePersonalBrandingBrandIdentity({
    enablePlatformRules: activeTab === 'platform-rules',
  });
  const isLoading =
    brandIdentity.profiles.isPending ||
    (activeTab === 'platform-rules' && brandIdentity.platformRules.isPending);

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="core-profile"
      activeTabId={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as BrandIdentityTabId)}
      ariaLabel="Brand Identity sections"
      isLoading={isLoading}
      skeletonLayout="two-column"
      renderPanel={(tab) =>
        tab === 'platform-rules' ? (
          <PlatformRulesTabPanel brandIdentity={brandIdentity} />
        ) : (
          <CoreProfileTab brandIdentity={brandIdentity} />
        )
      }
    />
  );
}
