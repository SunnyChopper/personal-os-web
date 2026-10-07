import { describe, expect, it } from 'vitest';
import { resolveSandboxEditorSaveStatus } from './resolve-sandbox-editor-save-status';

const SAVED_AT = 1_700_000_000_000;

describe('resolveSandboxEditorSaveStatus', () => {
  it('prioritizes saving over error and dirty', () => {
    expect(
      resolveSandboxEditorSaveStatus({
        isDirty: true,
        isSaving: true,
        saveError: 'Network error',
        lastSavedAt: SAVED_AT,
      })
    ).toEqual({
      status: 'saving',
      lastSavedAt: SAVED_AT,
      errorMessage: 'Network error',
    });
  });

  it('shows error when save failed and not saving', () => {
    expect(
      resolveSandboxEditorSaveStatus({
        isDirty: false,
        isSaving: false,
        saveError: 'Network error',
        lastSavedAt: SAVED_AT,
      })
    ).toEqual({
      status: 'error',
      lastSavedAt: SAVED_AT,
      errorMessage: 'Network error',
    });
  });

  it('shows pending when dirty and no active save error', () => {
    expect(
      resolveSandboxEditorSaveStatus({
        isDirty: true,
        isSaving: false,
        saveError: null,
        lastSavedAt: SAVED_AT,
      })
    ).toEqual({
      status: 'pending',
      lastSavedAt: SAVED_AT,
      errorMessage: null,
    });
  });

  it('shows saved when clean with a timestamp', () => {
    expect(
      resolveSandboxEditorSaveStatus({
        isDirty: false,
        isSaving: false,
        saveError: null,
        lastSavedAt: SAVED_AT,
      })
    ).toEqual({
      status: 'saved',
      lastSavedAt: SAVED_AT,
      errorMessage: null,
    });
  });

  it('shows idle when clean with no timestamp', () => {
    expect(
      resolveSandboxEditorSaveStatus({
        isDirty: false,
        isSaving: false,
        saveError: null,
        lastSavedAt: null,
      })
    ).toEqual({
      status: 'idle',
      lastSavedAt: null,
      errorMessage: null,
    });
  });

  it('shows error over pending when save failed and draft is dirty', () => {
    expect(
      resolveSandboxEditorSaveStatus({
        isDirty: true,
        isSaving: false,
        saveError: 'Network error',
        lastSavedAt: SAVED_AT,
      })
    ).toEqual({
      status: 'error',
      lastSavedAt: SAVED_AT,
      errorMessage: 'Network error',
    });
  });
});
