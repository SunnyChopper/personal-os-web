/** Dual-theme surfaces for lesson generation progress (Knowledge Vault courses). */

export const lessonGenPhaseRowBaseClassName =
  'flex flex-col gap-2 p-3 rounded-lg border transition-colors';

export function lessonGenPhaseRowClassName(active: boolean, completed: boolean): string {
  if (active) {
    return `${lessonGenPhaseRowBaseClassName} bg-green-50 dark:bg-green-900/20 border-green-500 border-2`;
  }
  if (completed) {
    return `${lessonGenPhaseRowBaseClassName} bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-80`;
  }
  return `${lessonGenPhaseRowBaseClassName} bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700`;
}

export const lessonGenArtifactPanelClassName =
  'mt-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto';
