import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type PlatformFitRecommendation,
} from '@/types/api/personal-branding.dto';

export type PlatformFitApplyMode = 'high' | 'medium-top2';

export interface PlatformFitApplyTargets {
  platforms: BrandPlatform[];
  mode: PlatformFitApplyMode;
}

export function resolvePlatformFitApplyTargets(
  recommendations: PlatformFitRecommendation[],
  sourcePlatform?: BrandPlatform | null
): PlatformFitApplyTargets {
  const high = recommendations.filter((rec) => rec.fitTier === 'high').map((rec) => rec.platform);

  let platforms: BrandPlatform[];
  let mode: PlatformFitApplyMode;

  if (high.length > 0) {
    platforms = high;
    mode = 'high';
  } else {
    platforms = recommendations
      .filter((rec) => rec.fitTier === 'medium')
      .slice(0, 2)
      .map((rec) => rec.platform);
    mode = 'medium-top2';
  }

  if (sourcePlatform) {
    platforms = platforms.filter((platform) => platform !== sourcePlatform);
  }

  return { platforms, mode };
}

export function platformFitApplyButtonLabel(mode: PlatformFitApplyMode, count: number): string {
  if (mode === 'high') {
    return count === 1 ? 'Apply 1 recommended' : `Apply ${count} recommended`;
  }
  return 'Apply top 2';
}

export function platformFitApplyToastTitle(platforms: BrandPlatform[]): string {
  if (platforms.length === 0) return 'No platforms selected';
  const labels = platforms.map((platform) => BRAND_PLATFORM_LABELS[platform]);
  return `Selected ${labels.join(', ')}`;
}
