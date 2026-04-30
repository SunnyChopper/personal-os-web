import { describe, expect, it } from 'vitest';
import { formatRelativeChatTimestamp } from './format-relative-time';

describe('formatRelativeChatTimestamp', () => {
  const fixedNow = new Date('2026-03-30T12:00:00.000Z');

  it('returns Just now for under 60 seconds', () => {
    expect(formatRelativeChatTimestamp('2026-03-30T11:59:30.000Z', fixedNow)).toBe('Just now');
  });

  it('returns minutes for under 1 hour', () => {
    expect(formatRelativeChatTimestamp('2026-03-30T11:30:00.000Z', fixedNow)).toBe('30m ago');
  });

  it('returns hours for under 24 hours', () => {
    expect(formatRelativeChatTimestamp('2026-03-30T06:00:00.000Z', fixedNow)).toBe('6h ago');
  });

  it('returns days for under 7 days', () => {
    expect(formatRelativeChatTimestamp('2026-03-28T12:00:00.000Z', fixedNow)).toBe('2d ago');
  });

  it('returns short date for older messages', () => {
    expect(formatRelativeChatTimestamp('2026-03-01T12:00:00.000Z', fixedNow)).toBe('Mar 1');
  });
});
