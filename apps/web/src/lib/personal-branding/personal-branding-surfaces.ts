import { cn } from '@/lib/utils';

/** Dual-theme surface class tokens for Personal Branding grid cards and panels. */

/** Shared surface classes for nested cards inside grids (e.g. idea cards, variant cards). */
export const gridItemCardClassName =
  'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900';

/**
 * Rank-indexed surface for platform-fit recommendation cards (1-based rank).
 * Rank 1 elevated; ranks 2–3 default; rank 4+ slightly muted.
 */
export function platformFitRecommendationSurfaceClassName(rank: number): string {
  if (rank <= 1) {
    return cn(gridItemCardClassName, 'border-gray-300 shadow-md dark:border-gray-600');
  }

  if (rank <= 3) {
    return gridItemCardClassName;
  }

  return cn(gridItemCardClassName, 'bg-gray-50 shadow-none dark:bg-gray-950/50');
}

/** Shared surface classes for dashed empty-state panels. */
export const emptyStateCardClassName =
  'rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/40';

/** Hover elevation for selectable grid cards (border, shadow, background shift). */
export const gridItemCardInteractiveClassName =
  'transition-[box-shadow,border-color,background-color] duration-150 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-md dark:hover:border-gray-600 dark:hover:bg-gray-900/80';

/** Selection ring for bulk-select grid cards. */
export const gridItemCardSelectedClassName = 'ring-2 ring-sky-500/70 dark:ring-sky-400/60';

/** Keyboard focus ring when tabbing into card controls. */
export const gridItemCardFocusWithinClassName =
  'focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-950';
