import type { Task } from '@/types/growth-system';
import { formatDateString } from '@/utils/date-formatters';

/** When completed count exceeds this value, the section defaults to collapsed. */
export const COMPLETED_SECTION_AUTO_COLLAPSE_AFTER = 3;

export function shouldAutoCollapseCompletedSection(completedCount: number): boolean {
  return completedCount > COMPLETED_SECTION_AUTO_COLLAPSE_AFTER;
}

export type CompletedSummaryTask = Pick<Task, 'title' | 'completedDate'> & {
  size?: number | null;
};

/**
 * One-line summary for the most recent completed task (collapsed section).
 * Format: `title · {date}` with date omitted when absent.
 * Story points / PTS are omitted in project contexts.
 */
export function formatMostRecentCompletedSummary(task: CompletedSummaryTask): string {
  const parts: string[] = [task.title];

  const completedDate = formatDateString(task.completedDate);
  if (completedDate) {
    parts.push(completedDate);
  }

  return parts.join(' · ');
}
