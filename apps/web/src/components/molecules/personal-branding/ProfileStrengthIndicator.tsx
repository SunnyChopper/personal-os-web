import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PlatformRulePolicySummary from '@/components/molecules/personal-branding/PlatformRulePolicySummary';
import UniversalRulesFallbackNotice from '@/components/molecules/personal-branding/UniversalRulesFallbackNotice';
import { useEffectivePlatformRules } from '@/hooks/useEffectivePlatformRules';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  aggregateProfileStrengthSummary,
  hasResolvedPlatformPolicy,
  normalizeToneMetrics,
  resolvePlatformRuleSource,
} from '@/lib/personal-branding/profile-strength';
import { cn } from '@/lib/utils';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type BrandProfile,
} from '@/types/api/personal-branding.dto';
import { statusPillClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

export interface ProfileStrengthIndicatorProps {
  profilesByPlatform: Partial<Record<BrandPlatform, BrandProfile>>;
  targetPlatforms: BrandPlatform[];
  className?: string;
}

export default function ProfileStrengthIndicator({
  profilesByPlatform,
  targetPlatforms,
  className,
}: ProfileStrengthIndicatorProps) {
  const profileByPlatform = useMemo(() => {
    const map: Partial<Record<BrandPlatform, string>> = {};
    for (const platform of targetPlatforms) {
      const profile = profilesByPlatform[platform];
      if (profile) {
        map[platform] = profile.id;
      }
    }
    return map;
  }, [profilesByPlatform, targetPlatforms]);

  const catalogQ = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.catalog(),
    queryFn: () => personalBrandingService.getPlatformRuleCatalog(),
    enabled: Object.keys(profileByPlatform).length > 0,
  });

  const { effectiveQueries, isLoading: isLoadingRules } = useEffectivePlatformRules(
    profileByPlatform,
    targetPlatforms
  );

  const configuredPlatforms = targetPlatforms.filter((platform) => profilesByPlatform[platform]);

  const summaryLabel = useMemo(() => {
    const uniqueProfiles = new Map<string, BrandProfile>();
    const universalOnlyPlatforms: BrandPlatform[] = [];
    const profileOverlayPlatforms: BrandPlatform[] = [];

    for (const platform of configuredPlatforms) {
      const profile = profilesByPlatform[platform]!;
      if (!uniqueProfiles.has(profile.id)) {
        uniqueProfiles.set(profile.id, profile);
      }

      const index = targetPlatforms.indexOf(platform);
      const effective = effectiveQueries[index]?.data;

      if (effective) {
        const policy = effective.resolvedPolicy;
        if (policy && hasResolvedPlatformPolicy(policy)) {
          const source = resolvePlatformRuleSource(effective.rules);
          if (source === 'universalOnly' && !universalOnlyPlatforms.includes(platform)) {
            universalOnlyPlatforms.push(platform);
          } else if (source === 'profileOverlay' && !profileOverlayPlatforms.includes(platform)) {
            profileOverlayPlatforms.push(platform);
          }
        }
      }
    }

    const profiles = [...uniqueProfiles.values()].map((profile) => ({
      toneMetrics: normalizeToneMetrics(profile.toneMetrics ?? {}),
      bannedPhrases: (profile.bannedPhrases ?? []).filter((phrase) => phrase.trim().length > 0),
    }));

    return aggregateProfileStrengthSummary({
      profiles,
      universalOnlyPlatforms,
      profileOverlayPlatforms,
    }).label;
  }, [configuredPlatforms, effectiveQueries, profilesByPlatform, targetPlatforms]);

  if (configuredPlatforms.length === 0) {
    return null;
  }

  return (
    <details
      className={cn(
        'mt-2 rounded-lg border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-950/40',
        className
      )}
    >
      <summary className="cursor-pointer list-none px-3 py-2 text-sm text-gray-700 marker:content-none dark:text-gray-300 [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-gray-900 dark:text-white">Profile strength</span>
        <span className="ml-2 text-gray-600 dark:text-gray-400">{summaryLabel}</span>
      </summary>

      <div className="space-y-4 border-t border-gray-200 px-3 py-3 dark:border-gray-700">
        {configuredPlatforms.map((platform) => {
          const profile = profilesByPlatform[platform]!;
          const index = targetPlatforms.indexOf(platform);
          const effective = effectiveQueries[index]?.data;
          const policy = effective?.resolvedPolicy;
          const hasPolicy = policy ? hasResolvedPlatformPolicy(policy) : false;
          const ruleSource = effective ? resolvePlatformRuleSource(effective.rules) : 'none';
          const toneMetrics = normalizeToneMetrics(profile.toneMetrics ?? {});
          const bannedPhrases = (profile.bannedPhrases ?? []).filter(
            (phrase) => phrase.trim().length > 0
          );
          const toneEntries = Object.entries(toneMetrics).sort(([a], [b]) => a.localeCompare(b));

          return (
            <section
              key={platform}
              aria-labelledby={`profile-strength-platform-${platform}`}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <p
                id={`profile-strength-platform-${platform}`}
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                {BRAND_PLATFORM_LABELS[platform]} · {profile.name}
              </p>

              {toneEntries.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5" role="list">
                  {toneEntries.map(([key, value]) => (
                    <li key={key}>
                      <span className={statusPillClassName('neutral', 'capitalize')}>
                        {key} {value.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No tone metrics configured.
                </p>
              )}

              {bannedPhrases.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5" role="list">
                  {bannedPhrases.map((phrase) => (
                    <li key={phrase}>
                      <span className={statusPillClassName('warning')}>{phrase}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {isLoadingRules ? (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Loading platform rules…
                </p>
              ) : hasPolicy && policy ? (
                <>
                  {ruleSource === 'universalOnly' ? (
                    <UniversalRulesFallbackNotice
                      className="mt-3"
                      platformLabel={BRAND_PLATFORM_LABELS[platform]}
                    />
                  ) : null}
                  <PlatformRulePolicySummary
                    className="mt-3"
                    catalog={catalogQ.data}
                    characterLimit={policy.characterLimit}
                    readTimeLimitMinutes={policy.readTimeLimitMinutes}
                    rhetoricalModes={policy.rhetoricalModes}
                    rhetoricalDevices={policy.rhetoricalDevices}
                    requirements={policy.requirements}
                  />
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  No platform rules resolved for this target.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </details>
  );
}
