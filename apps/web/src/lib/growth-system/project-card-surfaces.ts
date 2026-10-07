/** Shared surface tokens for Projects grid cards (hover accent chrome). */

import { cn } from '@/lib/utils';
import type { Priority, ProjectStatus } from '@/types/growth-system';

const DEFAULT_PRIORITY: Priority = 'P3';

const PRIORITY_ACCENT_BG: Record<Priority, string> = {
  P1: 'bg-red-500 dark:bg-red-400',
  P2: 'bg-orange-500 dark:bg-orange-400',
  P3: 'bg-yellow-500 dark:bg-yellow-400',
  P4: 'bg-green-500 dark:bg-green-400',
};

const COMPLETE_ACCENT_BG = 'bg-emerald-500 dark:bg-emerald-400';

export function projectPriorityAccentBgClass(priority: Priority | null | undefined): string {
  const normalized: Priority =
    priority && priority in PRIORITY_ACCENT_BG ? priority : DEFAULT_PRIORITY;
  return PRIORITY_ACCENT_BG[normalized];
}

export interface GridProjectAccentBarOptions {
  priority: Priority | null | undefined;
  isWorkComplete: boolean;
  status: ProjectStatus;
}

/** Grid left-bar color: emerald when complete, none when cancelled, else priority. */
export function getGridProjectAccentBarClass({
  priority,
  isWorkComplete,
  status,
}: GridProjectAccentBarOptions): string | null {
  if (status === 'Cancelled') {
    return null;
  }
  if (isWorkComplete || status === 'Completed') {
    return COMPLETE_ACCENT_BG;
  }
  return projectPriorityAccentBgClass(priority);
}

export function projectGridCardShellClassName(): string {
  return cn(
    'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white p-3 text-left dark:bg-gray-800',
    'cursor-pointer',
    'border-gray-200 dark:border-gray-700',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    'lg:transition-colors lg:duration-200',
    'lg:hover:border-blue-500 dark:lg:hover:border-blue-400'
  );
}

/** Left accent bar: hidden at rest; visible on hover or focus-within. */
export function projectGridAccentBarClassName({
  accentBgClass,
}: {
  accentBgClass: string | null;
}): string | null {
  if (!accentBgClass) {
    return null;
  }
  return cn(
    'pointer-events-none absolute bottom-0 left-0 top-0 w-1 transition-opacity duration-200',
    accentBgClass,
    'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
  );
}
