import { describe, expect, it } from 'vitest';
import { resolveSettingsSaveStatus } from './project-settings-save';

describe('resolveSettingsSaveStatus', () => {
  it('prefers saving over saved', () => {
    expect(
      resolveSettingsSaveStatus({
        isPending: true,
        isError: false,
        showSaved: true,
        hasUnsavedDraft: false,
      })
    ).toBe('saving');
  });

  it('shows error when mutation failed', () => {
    expect(
      resolveSettingsSaveStatus({
        isPending: false,
        isError: true,
        showSaved: true,
        hasUnsavedDraft: false,
      })
    ).toBe('error');
  });

  it('shows saved only when clean draft', () => {
    expect(
      resolveSettingsSaveStatus({
        isPending: false,
        isError: false,
        showSaved: true,
        hasUnsavedDraft: true,
      })
    ).toBe('idle');
  });
});
