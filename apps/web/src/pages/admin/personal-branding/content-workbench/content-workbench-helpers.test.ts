import { describe, expect, it } from 'vitest';
import type { BrandProfile } from '@/types/api/personal-branding.dto';
import {
  collectActiveBrandPillars,
  contentTextStats,
  countWords,
  estimateReadingTimeMinutes,
  GENERATE_DRAFT_CTA_HINT,
  GENERATE_DRAFT_CTA_LABEL,
  getApproveJobDraft,
} from './content-workbench-helpers';

function makeProfile(overrides: Partial<BrandProfile> = {}): BrandProfile {
  return {
    id: 'profile-1',
    name: 'Test Profile',
    pillars: [],
    toneMetrics: {},
    bannedPhrases: [],
    status: 'active',
    targetAudience: 'Builders',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('collectActiveBrandPillars', () => {
  it('returns sorted unique labels from active profiles', () => {
    const profiles = [
      makeProfile({ id: 'a', pillars: ['Systems', 'Clarity'] }),
      makeProfile({ id: 'b', pillars: ['Clarity', 'Growth'] }),
      makeProfile({ id: 'c', status: 'draft', pillars: ['Hidden'] }),
    ];
    expect(collectActiveBrandPillars(profiles)).toEqual(['Clarity', 'Growth', 'Systems']);
  });

  it('returns empty array for non-array profiles input', () => {
    const paginatedShaped = {
      data: [makeProfile({ pillars: ['Clarity'] })],
      total: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    };
    expect(collectActiveBrandPillars(paginatedShaped as unknown as BrandProfile[])).toEqual([]);
  });

  it('skips profiles with missing or non-array pillars', () => {
    const profiles = [
      makeProfile({ id: 'a', pillars: ['Clarity'] }),
      makeProfile({ id: 'b', pillars: null as unknown as string[] }),
      makeProfile({ id: 'c', pillars: 'not-an-array' as unknown as string[] }),
      makeProfile({ id: 'd', pillars: undefined as unknown as string[] }),
    ];
    expect(collectActiveBrandPillars(profiles)).toEqual(['Clarity']);
  });
});

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

describe('generate draft CTA copy', () => {
  it('exposes short label and Sandbox hint for tooltips', () => {
    expect(GENERATE_DRAFT_CTA_LABEL).toBe('Generate Draft');
    expect(GENERATE_DRAFT_CTA_HINT).toBe('Generate draft and open in Sandbox');
  });
});

describe('getApproveJobDraft (bbc5bae966c5)', () => {
  it('returns null for 202-style job-start shaped payloads mistaken for success', () => {
    // Prod crash: onSuccess destructured `{ idea, draft }` from `{ jobId, status, pollAfterMs }`.
    expect(
      getApproveJobDraft({
        status: 'succeeded',
        result: undefined,
      })
    ).toBeNull();
    expect(
      getApproveJobDraft({
        status: 'succeeded',
        result: { idea: { id: 'idea-1' } as never, draft: undefined as never },
      })
    ).toBeNull();
  });

  it('returns the draft when the polled job includes a draft id', () => {
    const draft = { id: 'draft-1', title: 'Ship it', status: 'DRAFT' } as never;
    expect(
      getApproveJobDraft({
        status: 'succeeded',
        result: { idea: { id: 'idea-1' } as never, draft },
      })
    ).toEqual(draft);
  });

  it('ignores non-succeeded statuses even if result is present', () => {
    expect(
      getApproveJobDraft({
        status: 'running',
        result: {
          idea: { id: 'idea-1' } as never,
          draft: { id: 'draft-1' } as never,
        },
      })
    ).toBeNull();
  });
});
