import { describe, expect, it } from 'vitest';
import { clampTaskDescriptionPreview } from './project-task-row-surfaces';

describe('clampTaskDescriptionPreview', () => {
  it('returns empty result for null or undefined or empty text', () => {
    expect(clampTaskDescriptionPreview(null)).toEqual({
      isClamped: false,
      previewText: '',
      fullText: '',
    });
    expect(clampTaskDescriptionPreview(undefined)).toEqual({
      isClamped: false,
      previewText: '',
      fullText: '',
    });
    expect(clampTaskDescriptionPreview('   ')).toEqual({
      isClamped: false,
      previewText: '',
      fullText: '',
    });
  });

  it('does not clamp text that is <= 128 characters', () => {
    const text = 'This is a short description for a completed task.';
    const result = clampTaskDescriptionPreview(text, 128);
    expect(result.isClamped).toBe(false);
    expect(result.previewText).toBe(text);
    expect(result.fullText).toBe(text);
  });

  it('clamps text > 128 characters with an ellipsis', () => {
    const longText =
      'This task requires thorough investigation into all properties, documentation of leases, gathering signatures from the landlords, and paying the security deposit before move-in.';
    expect(longText.length).toBeGreaterThan(128);

    const result = clampTaskDescriptionPreview(longText, 128);
    expect(result.isClamped).toBe(true);
    expect(result.previewText.length).toBe(129); // 128 chars + '…'
    expect(result.previewText.endsWith('…')).toBe(true);
    expect(result.fullText).toBe(longText);
  });
});
