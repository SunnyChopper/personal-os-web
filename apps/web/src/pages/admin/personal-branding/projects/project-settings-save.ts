import type { UpdateBrandProjectSettingsInput } from '@/types/api/personal-branding.dto';

export type ProjectSettingsFieldKey =
  | 'dailyCount'
  | 'startTime'
  | 'direction'
  | 'autoEnabled'
  | 'brandProfileId';

export interface ProjectSettingsSaveAttempt {
  field: ProjectSettingsFieldKey;
  payload: UpdateBrandProjectSettingsInput;
}

export const DIRECTION_DEBOUNCE_MS = 500;

export function resolveSettingsSaveStatus(input: {
  isPending: boolean;
  isError: boolean;
  showSaved: boolean;
  hasUnsavedDraft: boolean;
}): 'idle' | 'saving' | 'saved' | 'error' {
  if (input.isPending) return 'saving';
  if (input.isError) return 'error';
  if (input.showSaved && !input.hasUnsavedDraft) return 'saved';
  return 'idle';
}
