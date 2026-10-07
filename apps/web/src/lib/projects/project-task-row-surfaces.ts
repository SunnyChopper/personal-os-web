/**
 * Surface tokens for task rows rendered in project contexts (Tasks card and Completed Tasks modal).
 * Adheres to admin dual-theme styling (SKILL.md) and eliminates faint card/bottom hairlines.
 */

export const projectTaskRowFlushClassName =
  'border-0 shadow-none bg-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800/60';

export const projectCompletedModalRowClassName =
  'border-0 shadow-none bg-gray-50/60 hover:bg-gray-100/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/70';

export const projectTaskDescriptionClassName =
  'text-xs leading-relaxed text-gray-600 dark:text-gray-400 break-words mt-1';

export const projectTaskShowMoreButtonClassName =
  'inline-block text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus-visible:underline cursor-pointer select-none';

export type ClampedDescriptionResult = {
  isClamped: boolean;
  previewText: string;
  fullText: string;
};

/**
 * Clamps task description to maxChars (default 128) with ellipsis.
 */
export function clampTaskDescriptionPreview(
  text: string | null | undefined,
  maxChars = 128
): ClampedDescriptionResult {
  if (!text) {
    return { isClamped: false, previewText: '', fullText: '' };
  }
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return { isClamped: false, previewText: trimmed, fullText: trimmed };
  }
  return {
    isClamped: true,
    previewText: `${trimmed.slice(0, maxChars)}…`,
    fullText: trimmed,
  };
}
