import { useEffect, useState, type MouseEvent } from 'react';
import { useEffectivePlatformRules } from '@/hooks/useEffectivePlatformRules';
import type { BrandPlatform } from '@/types/api/personal-branding.dto';

export interface TargetPlatformRulesSurfaceProps {
  profileByPlatform: Partial<Record<BrandPlatform, string>>;
  targetPlatforms: BrandPlatform[];
}

export function useTargetPlatformRulesExpansion({
  profileByPlatform,
  targetPlatforms,
}: TargetPlatformRulesSurfaceProps) {
  const { byPlatform } = useEffectivePlatformRules(profileByPlatform, targetPlatforms);
  const [expandedPlatform, setExpandedPlatform] = useState<BrandPlatform | null>(null);

  useEffect(() => {
    setExpandedPlatform((current) =>
      current && targetPlatforms.includes(current) ? current : null
    );
  }, [profileByPlatform, targetPlatforms]);

  const toggleExpanded = (platform: BrandPlatform) => {
    setExpandedPlatform((current) => (current === platform ? null : platform));
  };

  const getRequirementCount = (platform: BrandPlatform): number | null => {
    if (!profileByPlatform[platform] || !targetPlatforms.includes(platform)) {
      return null;
    }
    const entry = byPlatform.get(platform);
    if (!entry || entry.isPending) {
      return null;
    }
    return entry.requirementLines.length;
  };

  const handleBadgeClick = (event: MouseEvent<HTMLButtonElement>, platform: BrandPlatform) => {
    event.stopPropagation();
    toggleExpanded(platform);
  };

  return {
    byPlatform,
    expandedPlatform,
    getRequirementCount,
    handleBadgeClick,
    panelId: (platform: BrandPlatform) => `platform-rules-panel-${platform}`,
  };
}
