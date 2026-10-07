import { cardSurfaceClassName } from '@/components/atoms/Card';
import { cn } from '@/lib/utils';

/** Resume Builder section shell — fills PageContainer, no nested max-width. */
export const resumeBuilderSectionClassName = cn(cardSurfaceClassName, 'overflow-hidden');

export const resumeBuilderSectionTitleClassName =
  'text-lg font-semibold tracking-tight text-gray-900 dark:text-white';

export const resumeBuilderSectionSubtitleClassName =
  'mt-1 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400';

/** Profile + education sit side-by-side only when the content column is truly wide. */
export const resumeBuilderProfileSplitClassName = 'grid grid-cols-1 gap-6 2xl:grid-cols-12';

export const resumeBuilderProfileColumnClassName = 'min-w-0 2xl:col-span-7';

export const resumeBuilderEducationColumnClassName = 'min-w-0 2xl:col-span-5';

export const resumeBuilderFormGridClassName = 'grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2';

/** Three columns only when the form spans the full builder width (not a split pane). */
export const resumeBuilderFormGridWideClassName =
  'grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-3';

export const resumeBuilderSpanTwoClassName = 'md:col-span-2';

export const resumeBuilderItemCardClassName = cn(
  'rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow] duration-150',
  'dark:border-gray-700 dark:bg-gray-800',
  'hover:border-blue-400/70 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]',
  'dark:hover:border-blue-500/50 dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
);

export const resumeBuilderNestedWellClassName =
  'rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-gray-900/40 sm:p-5';

export const resumeBuilderTabListClassName =
  'mb-6 flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50/80 p-1 dark:border-gray-700 dark:bg-gray-900/40';

export function resumeBuilderTabClassName(active: boolean): string {
  return cn(
    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    active
      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-gray-600'
      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-100'
  );
}

export const resumeBuilderPrimaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-offset-gray-900';

export const resumeBuilderSecondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:focus-visible:ring-offset-gray-900';

export const resumeBuilderChipClassName =
  'inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700/80 dark:text-gray-200';

export const resumeBuilderMetaClassName = 'text-sm text-gray-600 dark:text-gray-400';

export const resumeBuilderActionsClassName = 'flex flex-wrap items-center gap-2';

export const resumeBuilderEmptyHintClassName =
  'rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-400';

export const resumeBuilderSavedHintClassName =
  'text-sm font-medium text-emerald-700 dark:text-emerald-400';
