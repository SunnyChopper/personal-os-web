import type { BrandProfile } from '@/types/api/personal-branding.dto';

export function isBrandProfileReadyForIdeation(profile: BrandProfile): boolean {
  const hasPillars = (profile.pillars ?? []).some((p) => p.trim().length > 0);
  const hasAudience = Boolean((profile.targetAudience ?? '').trim());
  return hasPillars && hasAudience;
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
