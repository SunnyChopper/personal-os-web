import SubModuleTabShell from '../SubModuleTabShell';
import CoreProfileTab from './CoreProfileTab';
import PlatformRulesTabPanel from './PlatformRulesTabPanel';
import { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';

const TABS = [
  { id: 'core-profile', label: 'Core Profile' },
  { id: 'platform-rules', label: 'Platform Rules' },
] as const;

export default function BrandIdentityPage() {
  const brandIdentity = usePersonalBrandingBrandIdentity();
  const isLoading = brandIdentity.profiles.isPending || brandIdentity.platformRules.isPending;

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="core-profile"
      ariaLabel="Brand Identity sections"
      isLoading={isLoading}
      skeletonLayout="two-column"
      renderPanel={(activeTab) =>
        activeTab === 'platform-rules' ? (
          <PlatformRulesTabPanel brandIdentity={brandIdentity} />
        ) : (
          <CoreProfileTab brandIdentity={brandIdentity} />
        )
      }
    />
  );
}
