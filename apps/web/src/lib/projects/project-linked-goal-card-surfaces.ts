import { cn } from '@/lib/utils';

export const projectLinkedGoalCardShellClassName = (isEmbedded: boolean, isInteractive: boolean) =>
  cn(
    'rounded-lg border p-3 transition-all duration-200',
    isInteractive &&
      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    isEmbedded
      ? 'border-blue-200/80 bg-blue-50/40 hover:border-blue-300 dark:border-blue-800/60 dark:bg-blue-950/20 dark:hover:border-blue-700'
      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
  );

export const projectLinkedGoalTitleClassName =
  'min-w-0 flex-1 break-words text-base font-semibold leading-tight text-gray-900 dark:text-white';

export const projectLinkedGoalDescriptionClassName =
  'text-sm leading-relaxed text-gray-600 dark:text-gray-400 break-words';

export const projectLinkedGoalFooterClassName =
  'mt-2.5 flex flex-wrap items-center justify-between gap-2';

export const projectLinkedGoalMetaClassName = 'flex flex-wrap items-center gap-2 text-sm';

export const projectLinkedGoalActionsClassName = 'flex shrink-0 items-center gap-1.5';
