import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { parseRequirementLines } from '@/lib/personal-branding/platform-rule-display';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type { BrandPlatform, EffectivePlatformRules } from '@/types/api/personal-branding.dto';

export interface EffectivePlatformRulesEntry {
  platform: BrandPlatform;
  profileId?: string;
  data?: EffectivePlatformRules;
  requirementLines: string[];
  isPending: boolean;
  isError: boolean;
}

export function useEffectivePlatformRules(
  profileByPlatform: Partial<Record<BrandPlatform, string>>,
  platforms: BrandPlatform[]
) {
  const effectiveQueries = useQueries({
    queries: platforms.map((platform) => {
      const profileId = profileByPlatform[platform];
      return {
        queryKey: queryKeys.personalBranding.platformRules.effective(platform, profileId),
        queryFn: () => personalBrandingService.getEffectivePlatformRules(platform, profileId!),
        enabled: Boolean(profileId),
      };
    }),
  });

  const entries = useMemo<EffectivePlatformRulesEntry[]>(
    () =>
      platforms.map((platform, index) => {
        const query = effectiveQueries[index];
        const data = query?.data;
        return {
          platform,
          profileId: profileByPlatform[platform],
          data,
          requirementLines: parseRequirementLines(data?.resolvedPolicy?.requirements),
          isPending: query?.isPending ?? false,
          isError: query?.isError ?? false,
        };
      }),
    [platforms, effectiveQueries, profileByPlatform]
  );

  const byPlatform = useMemo(() => {
    const map = new Map<BrandPlatform, EffectivePlatformRulesEntry>();
    for (const entry of entries) {
      map.set(entry.platform, entry);
    }
    return map;
  }, [entries]);

  const isLoading = platforms.length > 0 && effectiveQueries.some((query) => query.isPending);

  return { entries, byPlatform, isLoading, effectiveQueries };
}
