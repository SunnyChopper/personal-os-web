import { describe, expect, it } from 'vitest';
import type { BrandPlatform, BrandProfile, ContentIdea } from '@/types/api/personal-branding.dto';
import {
  collectActiveBrandPillars,
  contentTextStats,
  countWords,
  defaultIdeaCountForPlatform,
  ideationIdeaCountPresetsForPlatform,
  softMaxIdeaCountForPlatform,
  trendStreamIdeaCountOptionsForPlatform,
  estimateReadingTimeMinutes,
  GENERATE_DRAFT_CTA_HINT,
  GENERATE_DRAFT_CTA_LABEL,
  IDEATION_ADVANCED_LEARNING_HINT,
  IDEATION_AI_MODEL_AUTO_HINT,
  IDEATION_IDEA_COUNT_PRESETS,
  IDEATION_IMAGE_SEARCH_HINT,
  IDEATION_SECTION_LEAD,
  CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE,
  announceLiveMessage,
  formatTemplateAppliedMessage,
  formatRejectedFeedbackStatsLine,
  formatReferencedPublishedStatsLine,
  formatNewIdeasReadyMessage,
  getApproveJobDraft,
  hasIdeationAdvancedOptionsActive,
  removeContentIdeaFromList,
  selectTrendIdeas,
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

describe('ideation helper copy', () => {
  it('exposes short section lead and tooltip hints for density polish', () => {
    expect(IDEATION_SECTION_LEAD).toBe(
      'Grounds each run in Brand Identity and prior idea outcomes.'
    );
    expect(IDEATION_ADVANCED_LEARNING_HINT).toBe(
      'Rejected, existing, and drafted ideas still shape future runs.'
    );
    expect(IDEATION_IMAGE_SEARCH_HINT).toBe(
      'Image-friendly ideas; Brave injects results after you approve a draft.'
    );
    expect(IDEATION_AI_MODEL_AUTO_HINT).toBe(
      'Uses the contentIdeation server default (claude-sonnet-5). Switch to Manual to pick from the assistant catalog.'
    );
  });
});

describe('ideation idea count presets', () => {
  it('exposes compact preset chips for the Ideation panel', () => {
    expect(IDEATION_IDEA_COUNT_PRESETS).toEqual([3, 6, 9]);
  });

  it('maps each platform to a platform-norm default count', () => {
    const cases: Array<[BrandPlatform, number]> = [
      ['x', 3],
      ['medium', 9],
      ['linkedin', 6],
      ['youtube', 6],
      ['instagram', 6],
      ['newsletter', 6],
    ];
    for (const [platform, expected] of cases) {
      expect(defaultIdeaCountForPlatform(platform)).toBe(expected);
    }
  });

  it('maps each platform to a soft max count', () => {
    expect(softMaxIdeaCountForPlatform('x')).toBe(6);
    expect(softMaxIdeaCountForPlatform('medium')).toBe(12);
    expect(softMaxIdeaCountForPlatform('linkedin')).toBe(9);
  });

  it('filters ideation presets by platform soft max', () => {
    expect(ideationIdeaCountPresetsForPlatform('x')).toEqual([3, 6]);
    expect(ideationIdeaCountPresetsForPlatform('medium')).toEqual([3, 6, 9]);
  });

  it('filters trend stream count options by platform soft max', () => {
    expect(trendStreamIdeaCountOptionsForPlatform('x')).toEqual([3, 4, 5, 6]);
    expect(trendStreamIdeaCountOptionsForPlatform('medium')).toEqual([3, 4, 5, 6, 8, 10, 12]);
  });
});

describe('formatReferencedPublishedStatsLine', () => {
  it('returns boost copy for recentBoost mode', () => {
    expect(
      formatReferencedPublishedStatsLine({
        referencedPublishedCount: 2,
        referenceSearchMode: 'recentBoost',
      })
    ).toBe('Boosted from 2 recent published posts.');
  });

  it('returns semantic copy by default', () => {
    expect(
      formatReferencedPublishedStatsLine({
        referencedPublishedCount: 1,
        referenceSearchMode: 'semantic',
      })
    ).toBe('Referenced 1 past published post for style and voice.');
  });
});

describe('hasIdeationAdvancedOptionsActive', () => {
  const defaults = {
    seedIdeas: '',
    boostFromRecentPublishes: true,
    enableImageSearch: false,
    enableKeywordResearch: false,
    ideationModelPicker: { mode: 'auto' as const, manualCatalogModelId: '' },
  };

  it('returns false when all secondary fields are at defaults', () => {
    expect(hasIdeationAdvancedOptionsActive(defaults)).toBe(false);
  });

  it('returns true when boost from recent publishes is disabled', () => {
    expect(hasIdeationAdvancedOptionsActive({ ...defaults, boostFromRecentPublishes: false })).toBe(
      true
    );
  });

  it('returns true when seed ideas are non-empty after trim', () => {
    expect(hasIdeationAdvancedOptionsActive({ ...defaults, seedIdeas: '  observability  ' })).toBe(
      true
    );
  });

  it('returns true when image search is enabled', () => {
    expect(hasIdeationAdvancedOptionsActive({ ...defaults, enableImageSearch: true })).toBe(true);
  });

  it('returns true when keyword research is enabled', () => {
    expect(hasIdeationAdvancedOptionsActive({ ...defaults, enableKeywordResearch: true })).toBe(
      true
    );
  });

  it('returns true when model picker is in manual mode', () => {
    expect(
      hasIdeationAdvancedOptionsActive({
        ...defaults,
        ideationModelPicker: { mode: 'manual', manualCatalogModelId: 'claude-sonnet-5' },
      })
    ).toBe(true);
  });
});

function makeTrendIdea(overrides: Partial<ContentIdea> = {}): ContentIdea {
  return {
    id: 'idea-1',
    title: 'Trend angle',
    contentType: 'SOCIAL_THREAD',
    sourceType: 'RADAR_INGESTED',
    tags: [],
    status: 'GENERATED',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('selectTrendIdeas', () => {
  it('keeps only RADAR_INGESTED ideas from both lists', () => {
    const generated = [
      makeTrendIdea({ id: 'radar-1' }),
      makeTrendIdea({ id: 'manual-1', sourceType: 'ON_DEMAND_AI' }),
    ];
    const drafted = [makeTrendIdea({ id: 'radar-2', status: 'DRAFTED', draftNodeId: 'draft-2' })];
    expect(selectTrendIdeas(generated, drafted).map((idea) => idea.id)).toEqual([
      'radar-1',
      'radar-2',
    ]);
  });

  it('sorts GENERATED before DRAFTED and prefers DRAFTED on duplicate ids', () => {
    const generated = [
      makeTrendIdea({
        id: 'radar-1',
        updatedAt: '2026-01-03T00:00:00.000Z',
      }),
      makeTrendIdea({
        id: 'radar-2',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    ];
    const drafted = [
      makeTrendIdea({
        id: 'radar-1',
        status: 'DRAFTED',
        draftNodeId: 'draft-1',
        updatedAt: '2026-01-04T00:00:00.000Z',
      }),
      makeTrendIdea({
        id: 'radar-3',
        status: 'DRAFTED',
        draftNodeId: 'draft-3',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = selectTrendIdeas(generated, drafted);
    expect(result.map((idea) => idea.id)).toEqual(['radar-2', 'radar-1', 'radar-3']);
    expect(result.find((idea) => idea.id === 'radar-1')?.status).toBe('DRAFTED');
  });
});

describe('announceLiveMessage', () => {
  it('clears then re-sets the message on the next microtask', async () => {
    const messages: Array<string | null> = [];
    const setMessage = (message: string | null) => {
      messages.push(message);
    };

    announceLiveMessage(setMessage, '3 new ideas ready');
    expect(messages).toEqual([null]);

    await Promise.resolve();
    expect(messages).toEqual([null, '3 new ideas ready']);
  });
});

describe('formatNewIdeasReadyMessage', () => {
  it('uses singular copy for one idea', () => {
    expect(formatNewIdeasReadyMessage(1)).toBe('1 new idea ready');
  });

  it('uses plural copy for zero or multiple ideas', () => {
    expect(formatNewIdeasReadyMessage(0)).toBe('0 new ideas ready');
    expect(formatNewIdeasReadyMessage(6)).toBe('6 new ideas ready');
  });
});

describe('formatRejectedFeedbackStatsLine', () => {
  it('returns null when rejectedFeedbackCount is zero', () => {
    expect(
      formatRejectedFeedbackStatsLine({ rejectedFeedbackCount: 0, rejectedCategoryCounts: {} })
    ).toBeNull();
  });

  it('formats count-only line when histogram is empty', () => {
    expect(
      formatRejectedFeedbackStatsLine({ rejectedFeedbackCount: 2, rejectedCategoryCounts: {} })
    ).toBe('2 prior rejections applied as hard negatives');
  });

  it('formats histogram with display labels', () => {
    expect(
      formatRejectedFeedbackStatsLine({
        rejectedFeedbackCount: 3,
        rejectedCategoryCounts: { tooGeneric: 2, offBrand: 1 },
      })
    ).toBe('3 prior rejections applied (Off-brand×1, Too generic×2)');
  });
});

describe('CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE', () => {
  it('exposes stable AI tool apply announcement copy', () => {
    expect(CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE).toBe('Content updated by AI tool');
  });
});

describe('formatTemplateAppliedMessage', () => {
  it('prefixes medium and low adherence notes', () => {
    expect(
      formatTemplateAppliedMessage({
        adherence: 'low',
        note: "Template 'Blog skeleton' structure largely ignored — draft may not match skeleton.",
      })
    ).toContain('Template adherence:');
  });

  it('returns high adherence note without prefix', () => {
    const note = "Template 'Blog skeleton' structure largely followed.";
    expect(formatTemplateAppliedMessage({ adherence: 'high', note })).toBe(note);
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

describe('removeContentIdeaFromList', () => {
  const page = {
    data: [makeTrendIdea({ id: 'idea-1' }), makeTrendIdea({ id: 'idea-2', title: 'Second' })],
    total: 2,
    page: 1,
    pageSize: 50,
    hasMore: false,
  };

  it('removes the matching idea and decrements total', () => {
    const next = removeContentIdeaFromList(page, 'idea-1');
    expect(next?.data.map((idea) => idea.id)).toEqual(['idea-2']);
    expect(next?.total).toBe(1);
  });

  it('returns the same reference when the id is missing', () => {
    expect(removeContentIdeaFromList(page, 'missing')).toBe(page);
  });

  it('returns undefined for undefined input', () => {
    expect(removeContentIdeaFromList(undefined, 'idea-1')).toBeUndefined();
  });

  it('clamps total at zero', () => {
    const single = {
      data: [makeTrendIdea({ id: 'idea-1' })],
      total: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    };
    const next = removeContentIdeaFromList(single, 'idea-1');
    expect(next?.data).toEqual([]);
    expect(next?.total).toBe(0);
  });
});
