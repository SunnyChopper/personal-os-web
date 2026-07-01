import type { BrandProfile } from '@/types/api/personal-branding.dto';

export function isBrandProfileReadyForIdeation(profile: BrandProfile): boolean {
  const hasPillars = (profile.pillars ?? []).some((p) => p.trim().length > 0);
  const hasAudience = Boolean((profile.targetAudience ?? '').trim());
  return hasPillars && hasAudience;
}
