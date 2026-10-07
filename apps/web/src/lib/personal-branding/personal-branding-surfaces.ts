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

/** Muted surface for content idea cards that already generated a draft. */
export const contentIdeaUsedCardClassName = cn(
  gridItemCardClassName,
  'border-gray-200/80 bg-gray-50/90 opacity-95 dark:border-gray-700/80 dark:bg-gray-900/60'
);

/** Layout dimensions — shared PB sidebar / Content Workbench chrome (Tailwind JIT literals). */

/** Shared PB / Workbench sidebar column width in pixels (classes remain SSOT for UI). */
export const pbSidebarWidthPx = 280;

/** Two-column grid with fixed sidebar column (`280px` + main). */
export const pbSidebarTwoColumnColsClassName = 'lg:grid-cols-[280px_1fr]';

/** Max width for sidebar panels and library drawer. */
export const pbSidebarMaxWidthClassName = 'max-w-[280px]';

/** SlideDrawer override when `maxWidth="md"` is too wide. */
export const pbSidebarDrawerMaxWidthClassName = '!max-w-[280px]';

/** Mobile sidebar max-height before `lg` full-height column. */
export const pbSidebarMobileMaxHeightClassName = 'max-h-[35vh] lg:max-h-none';

/** Sandbox asset-prompts panel max-height. */
export const pbAssetPanelMaxHeightClassName = 'max-h-[28vh]';

/** Document title input: prominent, borderless, and readable across both admin themes. */
export const pbDraftTitleInputClassName =
  'rounded-md border border-transparent bg-transparent px-1 py-1 text-lg font-semibold text-gray-900 placeholder:text-gray-400 hover:border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white dark:placeholder:text-gray-500 dark:hover:border-gray-700 dark:focus:border-blue-500';

/** Expandable line-clamp for idea card title / summary (hover expands). */
export const pbLineClamp2ExpandableClassName = 'line-clamp-2 group-hover:line-clamp-none';

/** Expandable line-clamp for rationale / longer excerpts (hover expands). */
export const pbLineClamp3ExpandableClassName = 'line-clamp-3 group-hover:line-clamp-none';

/** Content Workbench idea card field line limits (shared `ClampedExpandableText`). */
export const IDEA_CARD_TITLE_LINES = 2 as const;
export const IDEA_CARD_SUMMARY_LINES = 3 as const;
export const IDEA_CARD_WHY_CREATE_LINES = 3 as const;

/** Underlined action link inside Personal Branding amber warning callouts. */
export const pbWarningActionLinkClassName =
  'font-semibold text-amber-900 underline decoration-amber-600/50 underline-offset-2 hover:text-amber-950 dark:text-amber-50 dark:hover:text-white';

/** In-Person Events calendar — today cell when not selected (subtle ring + fill). */
export const eventsCalendarTodayCellClassName =
  'bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:ring-blue-400';

/** In-Person Events calendar — non-interactive day-density dot (1–3 per cell). */
export const eventsCalendarDensityDotClassName =
  'h-1 w-1 rounded-full bg-blue-500 dark:bg-blue-400';

/** In-Person Events calendar — Today toolbar control (ghost button). */
export const eventsCalendarTodayButtonClassName =
  'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800';

/** In-Person Events calendar — flush uncarded day-detail strip below the month grid (no border/shadow). */
export const calendarDayDetailStripClassName = 'space-y-2';

/** In-Person Events list card — fit-score legend tooltip (hover/focus-within on `group/fit-score`). */
export const eventFitScoreLegendPanelClassName =
  'pointer-events-none absolute right-0 top-full z-40 mt-1 hidden w-56 max-w-[min(14rem,90vw)] rounded-lg border border-gray-200/90 bg-white px-2.5 py-2 text-xs leading-relaxed text-gray-900 shadow-lg dark:border-gray-600/70 dark:bg-gray-900/95 dark:text-gray-100 group-hover/fit-score:block group-focus-within/fit-score:block whitespace-normal break-words';
