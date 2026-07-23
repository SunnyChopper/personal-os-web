import type { BrandProfile } from '@/types/api/personal-branding.dto';

export function isBrandProfileReadyForIdeation(profile: BrandProfile): boolean {
  const hasPillars = (profile.pillars ?? []).some((p) => p.trim().length > 0);
  const hasAudience = Boolean((profile.targetAudience ?? '').trim());
  return hasPillars && hasAudience;
}

/** Pipeline repurposer only allows finished (`active`) Brand Identity profiles. */
export function isBrandProfileSelectableForPipeline(profile: BrandProfile): boolean {
  return profile.status === 'active';
}

export function collectActiveBrandPillars(profiles: BrandProfile[]): string[] {
  const labels = new Set<string>();
  for (const profile of profiles) {
    if (profile.status !== 'active') continue;
    for (const pillar of profile.pillars ?? []) {
      const label = pillar.trim();
      if (label) labels.add(label);
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b));
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function estimateReadingTimeMinutes(text: string, wordsPerMinute = 200): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.ceil(words / wordsPerMinute);
}

export function contentTextStats(body: string): { wordCount: number; readingTimeMinutes: number } {
  return {
    wordCount: countWords(body),
    readingTimeMinutes: estimateReadingTimeMinutes(body),
  };
}
