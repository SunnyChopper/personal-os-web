import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type {
  BrandProjectSettings,
  UpdateBrandProjectSettingsInput,
} from '@/types/api/personal-branding.dto';
import {
  type ProjectSettingsFieldKey,
  type ProjectSettingsSaveAttempt,
  resolveSettingsSaveStatus,
} from './project-settings-save';

function saveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Couldn't save.";
}

export type ProjectSettingsSaveMutation = UseMutationResult<
  BrandProjectSettings,
  Error,
  UpdateBrandProjectSettingsInput,
  unknown
>;

export interface UseProjectSettingsSaveOptions {
  hasUnsavedDraft: boolean;
  onSaveSuccess?: (attempt: ProjectSettingsSaveAttempt) => void;
  onSaveError?: (attempt: ProjectSettingsSaveAttempt, message: string) => void;
}

export function useProjectSettingsSave(
  updateSettings: ProjectSettingsSaveMutation,
  { hasUnsavedDraft, onSaveSuccess, onSaveError }: UseProjectSettingsSaveOptions
) {
  const lastAttemptRef = useRef<ProjectSettingsSaveAttempt | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const successHandledAtRef = useRef(0);

  const saveField = useCallback(
    (field: ProjectSettingsFieldKey, payload: UpdateBrandProjectSettingsInput) => {
      lastAttemptRef.current = { field, payload };
      setShowSaved(false);
      updateSettings.mutate(payload);
    },
    [updateSettings]
  );

  useEffect(() => {
    if (!updateSettings.isSuccess) return;
    const submittedAt = updateSettings.submittedAt;
    if (!submittedAt || submittedAt === successHandledAtRef.current) return;
    successHandledAtRef.current = submittedAt;

    const attempt = lastAttemptRef.current;
    if (attempt) {
      onSaveSuccess?.(attempt);
    }
    setShowSaved(true);
  }, [updateSettings.isSuccess, updateSettings.submittedAt, onSaveSuccess]);

  useEffect(() => {
    if (!updateSettings.isError) return;
    const attempt = lastAttemptRef.current;
    if (!attempt) return;
    onSaveError?.(attempt, saveErrorMessage(updateSettings.error));
  }, [updateSettings.isError, updateSettings.error, onSaveError]);

  const saveStatus = resolveSettingsSaveStatus({
    isPending: updateSettings.isPending,
    isError: updateSettings.isError,
    showSaved,
    hasUnsavedDraft,
  });

  const handleRetrySave = useCallback(() => {
    const attempt = lastAttemptRef.current;
    if (!attempt) return;
    updateSettings.mutate(attempt.payload);
  }, [updateSettings]);

  const clearSavedOnEdit = useCallback(() => setShowSaved(false), []);

  return {
    saveField,
    saveStatus,
    handleRetrySave,
    clearSavedOnEdit,
    showSaved,
  };
}
