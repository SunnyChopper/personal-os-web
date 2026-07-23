import type { BrandPlatform } from '@/types/api/personal-branding.dto';

export function normalizeToneMetrics(
  values: Record<string, number | unknown>
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => typeof value === 'number') as [string, number][]
  );
}

export type PlatformRuleSource = 'none' | 'universalOnly' | 'profileOverlay';

export function resolvePlatformRuleSource(rules: { isUniversal: boolean }[]): PlatformRuleSource {
  if (rules.length === 0) {
    return 'none';
  }
  if (rules.every((rule) => rule.isUniversal)) {
    return 'universalOnly';
  }
  return 'profileOverlay';
}

export interface ProfileStrengthSummaryInput {
  toneMetrics: Record<string, number>;
  bannedPhrases: string[];
  platformLabels: Record<BrandPlatform, string>;
  universalOnlyPlatforms?: BrandPlatform[];
  profileOverlayPlatforms?: BrandPlatform[];
}

export interface ProfileStrengthSummary {
  label: string;
  toneCount: number;
  bannedCount: number;
  platformCount: number;
  isEmpty: boolean;
}

export interface AggregateProfileStrengthInput {
  profiles: Array<{
    toneMetrics: Record<string, number>;
    bannedPhrases: string[];
  }>;
  universalOnlyPlatforms?: BrandPlatform[];
  profileOverlayPlatforms?: BrandPlatform[];
}

function formatCountRangeLabel(counts: number[], singular: string, plural: string): string | null {
  const positive = counts.filter((count) => count > 0);
  if (positive.length === 0) {
    return null;
  }

  const min = Math.min(...positive);
  const max = Math.max(...positive);
  const noun = max === 1 ? singular : plural;

  if (min === max) {
    return `${min} ${noun}`;
  }

  return `${min}–${max} ${plural}`;
}

function buildProfileStrengthLabel({
  toneCounts,
  bannedCounts,
  hasUniversalFallback,
  hasRulesActive,
}: {
  toneCounts: number[];
  bannedCounts: number[];
  hasUniversalFallback: boolean;
  hasRulesActive: boolean;
}): string {
  const parts: string[] = [];
  const tonePart = formatCountRangeLabel(toneCounts, 'tone metric', 'tone metrics');
  const bannedPart = formatCountRangeLabel(bannedCounts, 'banned phrase', 'banned phrases');

  if (tonePart) {
    parts.push(tonePart);
  }
  if (bannedPart) {
    parts.push(bannedPart);
  }
  if (hasUniversalFallback) {
    parts.push('universal fallback');
  }
  if (hasRulesActive) {
    parts.push('rules active');
  }

  return parts.join(' · ');
}

export function summarizeProfileStrength({
  toneMetrics,
  bannedPhrases,
  universalOnlyPlatforms = [],
  profileOverlayPlatforms = [],
}: ProfileStrengthSummaryInput): ProfileStrengthSummary {
  const toneCount = Object.keys(toneMetrics).length;
  const bannedCount = bannedPhrases.filter((phrase) => phrase.trim().length > 0).length;
  const platformCount = universalOnlyPlatforms.length + profileOverlayPlatforms.length;
  const isEmpty = toneCount === 0 && bannedCount === 0 && platformCount === 0;

  if (isEmpty) {
    return {
      label: 'No constraints yet',
      toneCount,
      bannedCount,
      platformCount,
      isEmpty: true,
    };
  }

  const label = buildProfileStrengthLabel({
    toneCounts: [toneCount],
    bannedCounts: [bannedCount],
    hasUniversalFallback: universalOnlyPlatforms.length > 0,
    hasRulesActive: profileOverlayPlatforms.length > 0,
  });

  return {
    label,
    toneCount,
    bannedCount,
    platformCount,
    isEmpty: false,
  };
}

export function aggregateProfileStrengthSummary({
  profiles,
  universalOnlyPlatforms = [],
  profileOverlayPlatforms = [],
}: AggregateProfileStrengthInput): ProfileStrengthSummary {
  const toneCounts = profiles.map((profile) => Object.keys(profile.toneMetrics).length);
  const bannedCounts = profiles.map(
    (profile) => profile.bannedPhrases.filter((phrase) => phrase.trim().length > 0).length
  );
  const platformCount = universalOnlyPlatforms.length + profileOverlayPlatforms.length;
  const maxToneCount = toneCounts.length > 0 ? Math.max(...toneCounts) : 0;
  const maxBannedCount = bannedCounts.length > 0 ? Math.max(...bannedCounts) : 0;
  const isEmpty =
    toneCounts.every((count) => count === 0) &&
    bannedCounts.every((count) => count === 0) &&
    platformCount === 0;

  if (isEmpty) {
    return {
      label: 'No constraints yet',
      toneCount: 0,
      bannedCount: 0,
      platformCount: 0,
      isEmpty: true,
    };
  }

  const label = buildProfileStrengthLabel({
    toneCounts,
    bannedCounts,
    hasUniversalFallback: universalOnlyPlatforms.length > 0,
    hasRulesActive: profileOverlayPlatforms.length > 0,
  });

  return {
    label,
    toneCount: maxToneCount,
    bannedCount: maxBannedCount,
    platformCount,
    isEmpty: false,
  };
}

export function hasResolvedPlatformPolicy(policy: {
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes: unknown[];
  rhetoricalDevices: unknown[];
  requirements?: string | null;
}): boolean {
  const requirements = (policy.requirements ?? '').trim();
  return (
    policy.characterLimit != null ||
    policy.readTimeLimitMinutes != null ||
    policy.rhetoricalModes.length > 0 ||
    policy.rhetoricalDevices.length > 0 ||
    requirements.length > 0
  );
}
