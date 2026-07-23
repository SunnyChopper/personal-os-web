import { isBrandProfileSelectableForPipeline } from '@/pages/admin/personal-branding/content-workbench/content-workbench-helpers';
import type {
  BrandPlatform,
  BrandProfile,
  RepurposeTarget,
} from '@/types/api/personal-branding.dto';

/** Empty/missing platforms means the profile is available for all platforms. */
export function profileSupportsPlatform(profile: BrandProfile, platform: BrandPlatform): boolean {
  const platforms = profile.platforms ?? [];
  if (platforms.length === 0) {
    return true;
  }
  return platforms.includes(platform);
}

export function eligibleProfilesForPlatform(
  profiles: BrandProfile[],
  platform: BrandPlatform
): BrandProfile[] {
  return profiles.filter(
    (profile) =>
      isBrandProfileSelectableForPipeline(profile) && profileSupportsPlatform(profile, platform)
  );
}

export function defaultProfileIdForPlatform(
  profiles: BrandProfile[],
  platform: BrandPlatform
): string {
  return eligibleProfilesForPlatform(profiles, platform)[0]?.id ?? '';
}

export function buildRepurposeTargets(
  targetPlatforms: BrandPlatform[],
  profileByPlatform: Partial<Record<BrandPlatform, string>>
): RepurposeTarget[] {
  return targetPlatforms.map((platform) => ({
    platform,
    brandProfileId: profileByPlatform[platform] ?? '',
  }));
}

export function allTargetPlatformsHaveProfiles(
  targetPlatforms: BrandPlatform[],
  profileByPlatform: Partial<Record<BrandPlatform, string>>,
  profiles: BrandProfile[]
): boolean {
  return targetPlatforms.every((platform) => {
    const profileId = profileByPlatform[platform];
    if (!profileId) {
      return false;
    }
    const profile = profiles.find((entry) => entry.id === profileId);
    return Boolean(
      profile &&
      isBrandProfileSelectableForPipeline(profile) &&
      profileSupportsPlatform(profile, platform)
    );
  });
}
