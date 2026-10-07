import { cn } from '@/lib/utils';
import { gridItemCardClassName } from './personal-branding-surfaces';

/** Fills the Personal Branding PageContainer, same width as the ideas grid. */
export const buildIdeaDetailPageClassName = 'w-full min-w-0 space-y-6';

/** Hero card grouping the idea title, meta, and brief sections. */
export const buildIdeaBriefCardClassName = cn(gridItemCardClassName, 'p-5 sm:p-6');

/** Title inside the hero card (page heading). */
export const buildIdeaTitleClassName =
  'min-w-0 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white';

/** Two-column grid for the Why/Demo/Critic/Tutorial highlight sections. */
export const buildIdeaHighlightGridClassName = 'grid gap-3 md:grid-cols-2';

/** Subtle inset panel for a single brief section inside the hero card. */
export const buildIdeaSectionCardClassName =
  'rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40';

/** Icon shown beside each brief section eyebrow. */
export const buildIdeaSectionIconClassName = 'size-3.5 shrink-0 text-gray-400 dark:text-gray-500';

/** Source row inside the Sources section. */
export const buildIdeaSourceRowClassName =
  'flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900';
