import { describe, expect, it } from 'vitest';
import type { ContentOpportunity, ReplyRun } from '@/types/api/personal-branding.dto';
import {
  findOpportunityForReplyRun,
  restoreSearchResultFromReplyRun,
} from './restore-reply-run-context';

const run: ReplyRun = {
  id: '11111111-1111-4111-8111-111111111111',
  connectionId: '22222222-2222-4222-8222-222222222222',
  opportunityId: '33333333-3333-4333-8333-333333333333',
  platform: 'x',
  creatorText: 'Great post',
  mode: 'AGENT',
  researchEnabled: false,
  suggestionCount: 3,
  status: 'RUNNING',
  userId: 'user-1',
  createdAt: '2026-07-15T00:00:00Z',
  updatedAt: '2026-07-15T00:00:00Z',
  suggestions: [],
};

const opportunity: ContentOpportunity = {
  id: run.opportunityId!,
  connectionId: run.connectionId,
  platform: 'x',
  platformPostId: 'post-1',
  postText: 'Great post',
  status: 'SUGGESTED',
  searchRunId: 'search-1',
  userId: 'user-1',
  createdAt: '2026-07-15T00:00:00Z',
  updatedAt: '2026-07-15T00:00:00Z',
};

describe('restore-reply-run-context', () => {
  it('restores search result from persisted opportunity', () => {
    const result = restoreSearchResultFromReplyRun(run, opportunity);
    expect(result.outcome).toBe('found');
    expect(result.opportunities[0]?.id).toBe(opportunity.id);
  });

  it('finds opportunity by run id', () => {
    expect(findOpportunityForReplyRun(run, [opportunity])?.id).toBe(opportunity.id);
  });
});
