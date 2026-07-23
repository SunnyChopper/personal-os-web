import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREVIEW_MAX_CHARS,
  normalizePreviewText,
  previewNeedsExpansion,
  smartTruncatePreview,
} from './smart-text-preview';

describe('normalizePreviewText', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizePreviewText('  Hello\n\nworld  ')).toBe('Hello world');
  });

  it('returns empty for blank input', () => {
    expect(normalizePreviewText('')).toBe('');
    expect(normalizePreviewText('   \n\n  ')).toBe('');
  });
});

describe('previewNeedsExpansion', () => {
  it('returns false when text fits within max chars', () => {
    expect(previewNeedsExpansion('Short text', 20)).toBe(false);
  });

  it('returns true when text exceeds max chars', () => {
    expect(previewNeedsExpansion('a'.repeat(300), DEFAULT_PREVIEW_MAX_CHARS)).toBe(true);
  });
});

describe('smartTruncatePreview', () => {
  it('returns normalized short text unchanged', () => {
    expect(smartTruncatePreview('Hello\n\nworld')).toBe('Hello world');
  });

  it('returns empty for blank input', () => {
    expect(smartTruncatePreview('')).toBe('');
    expect(smartTruncatePreview('   ')).toBe('');
  });

  it('prefers sentence boundary when within search window', () => {
    const firstSentence =
      'This opening sentence is long enough to land inside the truncation search window before the break. ';
    const secondSentence =
      'This second sentence continues with more detail about the topic and keeps going.';
    const body = firstSentence + secondSentence;
    const preview = smartTruncatePreview(body, 120);

    expect(preview.endsWith('…')).toBe(true);
    expect(preview).toContain('truncation search window');
    expect(preview).not.toContain('second sentence');
  });

  it('falls back to clause boundary when no sentence break is found', () => {
    const body =
      'A long clause without terminal punctuation, followed by more text that keeps expanding until we exceed the limit';
    const preview = smartTruncatePreview(body, 70);

    expect(preview.endsWith('…')).toBe(true);
    expect(preview).toContain(',');
    expect(preview.length).toBeLessThanOrEqual(72);
  });

  it('falls back to word boundary when no clause break is found', () => {
    const body = 'word '.repeat(100).trim();
    const preview = smartTruncatePreview(body, 40);

    expect(preview.endsWith('…')).toBe(true);
    expect(preview).not.toMatch(/\s…$/);
    expect(preview.length).toBeLessThanOrEqual(41);
  });

  it('hard-cuts when no softer boundary is available', () => {
    const body = 'a'.repeat(400);
    const preview = smartTruncatePreview(body, 50);

    expect(preview).toBe(`${'a'.repeat(50)}…`);
  });

  it('avoids tiny stubs by respecting the minimum search window', () => {
    const body = `${'x'.repeat(150)}. ${'y'.repeat(200)}`;
    const preview = smartTruncatePreview(body, 160);

    expect(preview.length).toBeGreaterThan(80);
    expect(preview.endsWith('…')).toBe(true);
  });
});
