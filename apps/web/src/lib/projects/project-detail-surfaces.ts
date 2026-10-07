import { cn } from '@/lib/utils';

export type ProjectDetailCollapsibleTone = 'default' | 'amber';

export const projectDetailSectionClassName =
  'border-t border-gray-200 dark:border-gray-700 py-4 sm:py-5';

export const projectDetailSectionBodyClassName = 'pt-3';

export const projectDetailImpactRowClassName =
  'flex flex-col gap-4 border-t border-gray-200 pt-3 dark:border-gray-700 sm:flex-row sm:flex-wrap sm:items-start mb-2';

export const projectDetailImpactClusterClassName = 'min-w-[10rem] flex-1';

export function projectDetailHeaderButtonClassName(
  tone: ProjectDetailCollapsibleTone = 'default'
): string {
  const toneClasses =
    tone === 'amber'
      ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white';

  return cn(
    'group flex w-full items-center justify-between text-left text-sm font-medium transition-colors',
    'rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800',
    'min-h-[2rem]',
    toneClasses
  );
}

export function formatDetailSectionTitle(title: string, count?: number | null): string {
  if (typeof count === 'number') {
    return `${title} (${count})`;
  }
  return title;
}
