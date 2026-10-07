import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SubModuleTabShell from '../SubModuleTabShell';
import CoreProfileTab from './CoreProfileTab';
import PlatformRulesTabPanel from './PlatformRulesTabPanel';
import { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';

const TABS = [
  { id: 'core-profile', label: 'Core Profile' },
  { id: 'platform-rules', label: 'Platform Rules' },
] as const;

type BrandIdentityTabId = (typeof TABS)[number]['id'];

const DEFAULT_TAB_ID: BrandIdentityTabId = 'core-profile';

const VALID_TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

function resolveTabId(raw: string | null): BrandIdentityTabId {
  if (raw && VALID_TAB_IDS.has(raw)) {
    return raw as BrandIdentityTabId;
  }
  return DEFAULT_TAB_ID;
}

export default function BrandIdentityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = resolveTabId(searchParams.get('tab'));
  const profileIdFromUrl = searchParams.get('profileId');
  const [activeTab, setActiveTab] = useState<BrandIdentityTabId>(tabFromUrl);

  const brandIdentity = usePersonalBrandingBrandIdentity({
    selectedProfileId: profileIdFromUrl,
    enablePlatformRules: activeTab === 'platform-rules',
  });

  const { profiles, setSelectedProfileId } = brandIdentity;

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (!profileIdFromUrl) return;
    const exists = profiles.data?.data?.some((p) => p.id === profileIdFromUrl);
    if (exists) {
      setSelectedProfileId(profileIdFromUrl);
    }
  }, [profileIdFromUrl, profiles.data, setSelectedProfileId]);

  const isLoading =
    brandIdentity.profiles.isPending ||
    (activeTab === 'platform-rules' && brandIdentity.platformRules.isPending);

  const handleTabChange = (tabId: string) => {
    const nextTab = resolveTabId(tabId);
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    if (nextTab !== 'core-profile') {
      nextParams.delete('section');
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId={DEFAULT_TAB_ID}
      activeTabId={activeTab}
      onTabChange={handleTabChange}
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
