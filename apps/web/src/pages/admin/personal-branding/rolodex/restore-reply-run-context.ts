import type {
  ContentOpportunity,
  ContentOpportunitySearchResult,
  ReplyRun,
} from '@/types/api/personal-branding.dto';

function syntheticOpportunityFromRun(run: ReplyRun): ContentOpportunity {
  return {
    id: run.opportunityId ?? run.id,
    connectionId: run.connectionId,
    platform: run.platform,
    platformPostId: run.opportunityId ?? run.id,
    postText: run.creatorText,
    status: 'SUGGESTED',
    searchRunId: '',
    userId: run.userId,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

export function restoreSearchResultFromReplyRun(
  run: ReplyRun,
  opportunity?: ContentOpportunity | null
): ContentOpportunitySearchResult {
  const resolved = opportunity ?? syntheticOpportunityFromRun(run);
  return {
    outcome: 'found',
    platform: resolved.platform,
    candidatesConsidered: 0,
    candidatesExcluded: 0,
    opportunities: [resolved],
  };
}

export function findOpportunityForReplyRun(
  run: ReplyRun,
  opportunities: ContentOpportunity[]
): ContentOpportunity | null {
  if (!run.opportunityId) return null;
  return opportunities.find((item) => item.id === run.opportunityId) ?? null;
}
