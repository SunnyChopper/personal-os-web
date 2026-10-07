import { describe, expect, it } from 'vitest';
import {
  isSparseCreatorText,
  SPARSE_SUBSTANTIVE_CHAR_THRESHOLD,
  substantiveCreatorTextLength,
} from './creator-text-quality';

describe('creator-text-quality', () => {
  it('treats empty text as sparse', () => {
    expect(isSparseCreatorText('')).toBe(true);
    expect(isSparseCreatorText('   ')).toBe(true);
  });

  it('treats URL-only text as sparse', () => {
    expect(isSparseCreatorText('https://t.co/abc123')).toBe(true);
    expect(isSparseCreatorText('https://x.com/alice/status/1234567890123456789')).toBe(true);
  });

  it('treats emoji-only text as sparse', () => {
    expect(isSparseCreatorText('🔥🔥🔥')).toBe(true);
  });

  it('treats short captions as sparse', () => {
    expect(isSparseCreatorText('lol')).toBe(true);
    expect(substantiveCreatorTextLength('lol')).toBe(3);
  });

  it('treats long quoted-only body as adequate', () => {
    const quoted = 'a'.repeat(SPARSE_SUBSTANTIVE_CHAR_THRESHOLD);
    const text = `\n\nQuoted:\n${quoted}`;
    expect(isSparseCreatorText(text)).toBe(false);
  });

  it('treats normal thread text as adequate', () => {
    const text =
      'We shipped a new observability pipeline with structured logs and trace correlation across services.';
    expect(isSparseCreatorText(text)).toBe(false);
  });
});
