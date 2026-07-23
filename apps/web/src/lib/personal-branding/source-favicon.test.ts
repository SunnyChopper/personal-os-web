import { describe, expect, it } from 'vitest';
import { getFaviconUrl, getSourceHostname, getSourceLetterAvatar } from './source-favicon';

describe('source-favicon', () => {
  it('extracts hostname from URL', () => {
    expect(getSourceHostname('https://www.example.com/path')).toBe('example.com');
  });

  it('returns null for invalid URL', () => {
    expect(getSourceHostname('not-a-url')).toBeNull();
  });

  it('builds Google favicon URL', () => {
    expect(getFaviconUrl('example.com')).toBe(
      'https://www.google.com/s2/favicons?domain=example.com&sz=32'
    );
  });

  it('returns stable letter avatar colors', () => {
    const first = getSourceLetterAvatar('Tech RSS');
    const second = getSourceLetterAvatar('Tech RSS');
    expect(first.letter).toBe('T');
    expect(first.backgroundColor).toBe(second.backgroundColor);
  });
});
