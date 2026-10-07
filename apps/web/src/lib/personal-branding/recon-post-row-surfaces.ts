import { cn } from '@/lib/utils';

/** Display-only thresholds for Recon Feed post card hierarchy (not API filters). */
export const RECON_HIGH_RELEVANCE_SCORE = 0.9;
export const RECON_LOW_RELEVANCE_SCORE = 0.5;

export type ReconPostRelevanceTier = 'high' | 'mid' | 'low';

export function reconPostRelevanceTier(score?: number | null): ReconPostRelevanceTier {
  if (score === null || score === undefined || score < RECON_LOW_RELEVANCE_SCORE) {
    return 'low';
  }
  if (score >= RECON_HIGH_RELEVANCE_SCORE) {
    return 'high';
  }
  return 'mid';
}

export function formatReconRelevancePercent(score?: number | null): string {
  if (score === null || score === undefined) {
    return 'Unscored';
  }
  return `${(score * 100).toFixed(0)}%`;
}

function midScorePillClassName(score: number): string {
  if (score >= 0.75) return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300';
  if (score >= RECON_LOW_RELEVANCE_SCORE) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

interface ReconPostRowShellOptions {
  tier: ReconPostRelevanceTier;
  variant?: 'active' | 'processed';
}

export function reconPostRowShellClassName({
  tier,
  variant = 'active',
}: ReconPostRowShellOptions): string {
  return cn(
    '@container relative min-w-0 w-full overflow-hidden rounded-xl border p-4',
    'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
    tier === 'high' && 'border-emerald-300/80 pt-5 dark:border-emerald-700/60',
    tier === 'low' &&
      'border-gray-200/80 bg-gray-50/90 dark:border-gray-700/80 dark:bg-gray-950/50',
    variant === 'processed' && 'opacity-80',
    tier === 'low' && variant === 'active' && 'opacity-90'
  );
}

/** Thin top ribbon for high-relevance posts. */
export function reconPostHighOpportunityRibbonClassName(tier: ReconPostRelevanceTier): string {
  return cn(
    'pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center',
    'py-0.5 text-[10px] font-semibold uppercase tracking-wider',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    tier !== 'high' && 'hidden'
  );
}

/** Absolute left accent bar for high-relevance posts. */
export function reconPostAccentBarClassName(tier: ReconPostRelevanceTier): string {
  return cn(
    'pointer-events-none absolute bottom-0 left-0 top-0 w-1 rounded-l-md transition-opacity',
    tier === 'high' ? 'bg-emerald-500 opacity-100 dark:bg-emerald-400' : 'opacity-0'
  );
}

interface ReconPostScoreDisplayOptions {
  tier: ReconPostRelevanceTier;
  score?: number | null;
}

/** Score number treatment (high tier large display). */
export function reconPostScoreValueClassName({ tier }: ReconPostScoreDisplayOptions): string {
  return cn(
    'tabular-nums',
    tier === 'high' && 'text-lg font-semibold text-emerald-800 dark:text-emerald-300',
    tier === 'mid' && 'text-xs font-medium',
    tier === 'low' && 'text-xs font-medium text-gray-500 dark:text-gray-500'
  );
}

/** Mid-tier pill wrapper; high/low use different layout in the row component. */
export function reconPostScorePillClassName({ tier, score }: ReconPostScoreDisplayOptions): string {
  if (tier !== 'mid' || score === null || score === undefined) {
    return '';
  }
  return cn('rounded-full px-2 py-0.5', midScorePillClassName(score));
}

/** Caption below high-tier score value. */
export function reconPostScoreCaptionClassName(tier: ReconPostRelevanceTier): string {
  return cn(
    'text-[10px] font-medium uppercase tracking-wide',
    tier === 'high' && 'text-emerald-700 dark:text-emerald-400/90',
    tier === 'low' && 'text-gray-400 dark:text-gray-500'
  );
}

/** Muted body text for low-tier cards. */
export function reconPostLowTierTextClassName(tier: ReconPostRelevanceTier): string {
  return tier === 'low' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300';
}

/** Capped reading measure for scored-post meta + body (shell stays full width). */
export const reconPostContentColumnClassName = 'min-w-0 flex-1 max-w-4xl';

/** Trailing primary CTA cluster (Draft reply / Draft quote). */
export const reconPostPrimaryCtaClusterClassName = 'ml-auto shrink-0';

/** Trailing secondary action cluster on scored-post cards. */
export const reconPostActionsClusterClassName =
  'ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1';

/** Inline ghost secondaries when the card is wide enough (container min-width 40rem). */
export const reconPostActionsWideClusterClassName =
  'hidden @[40rem]:flex flex-wrap items-center justify-end gap-1';

/** Compact overflow menu when the card is narrower than 40rem. */
export const reconPostActionsCompactClusterClassName =
  'flex @[40rem]:hidden flex-wrap items-center justify-end gap-1';

/** Trailing actions on follow-suggestion rows. */
export const reconFollowSuggestionActionsClusterClassName = 'ml-auto flex shrink-0 gap-1';
