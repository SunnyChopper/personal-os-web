import type { AutosaveStatus } from '@/hooks/markdown/useMarkdownAutosave';

export interface SandboxEditorSaveStatusInput {
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSavedAt: number | null;
}

export interface SandboxEditorSaveStatus {
  status: AutosaveStatus;
  lastSavedAt: number | null;
  errorMessage: string | null;
}

/** Maps Sandbox explicit-save lifecycle to MarkdownEditor autosave footer states. */
export function resolveSandboxEditorSaveStatus(
  input: SandboxEditorSaveStatusInput
): SandboxEditorSaveStatus {
  const { isDirty, isSaving, saveError, lastSavedAt } = input;

  if (isSaving) {
    return { status: 'saving', lastSavedAt, errorMessage: saveError };
  }
  if (saveError) {
    return { status: 'error', lastSavedAt, errorMessage: saveError };
  }
  if (isDirty) {
    return { status: 'pending', lastSavedAt, errorMessage: null };
  }
  if (lastSavedAt !== null) {
    return { status: 'saved', lastSavedAt, errorMessage: null };
  }
  return { status: 'idle', lastSavedAt: null, errorMessage: null };
}
