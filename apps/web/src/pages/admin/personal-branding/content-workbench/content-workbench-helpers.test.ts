import { describe, expect, it } from 'vitest';
import {
  contentTextStats,
  countWords,
  estimateReadingTimeMinutes,
} from './content-workbench-helpers';

describe('countWords', () => {
  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('counts single and multiple words', () => {
    expect(countWords('hello')).toBe(1);
    expect(countWords('hello world')).toBe(2);
    expect(countWords('  hello   world  ')).toBe(2);
  });
});

describe('estimateReadingTimeMinutes', () => {
  it('returns 0 for empty text', () => {
    expect(estimateReadingTimeMinutes('')).toBe(0);
  });

  it('ceilings partial minutes at 200 wpm', () => {
    expect(estimateReadingTimeMinutes('one two three four five')).toBe(1);
    const twoHundredWords = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
    expect(estimateReadingTimeMinutes(twoHundredWords)).toBe(1);
    const twoHundredOneWords = `${twoHundredWords} extra`;
    expect(estimateReadingTimeMinutes(twoHundredOneWords)).toBe(2);
  });
});

describe('contentTextStats', () => {
  it('returns word count and reading time together', () => {
    const body = 'The quick brown fox jumps over the lazy dog';
    expect(contentTextStats(body)).toEqual({ wordCount: 9, readingTimeMinutes: 1 });
  });
});
