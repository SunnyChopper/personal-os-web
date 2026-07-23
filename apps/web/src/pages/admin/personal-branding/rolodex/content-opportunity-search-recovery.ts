import type {
  ContentOpportunity,
  ContentOpportunitySearchOutcome,
  ContentOpportunitySearchResult,
} from '@/types/api/personal-branding.dto';

export function isContentSearchTransportError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('network error') ||
    message.includes('server may be slow')
  );
}

export function buildLateContentSearchResult(
  platform: string,
  opportunities: ContentOpportunity[]
): ContentOpportunitySearchResult | null {
  if (!opportunities.length) return null;
  return {
    outcome: 'found',
    platform,
    reason: 'Search completed after the request timed out. Showing saved suggestions.',
    candidatesConsidered: 0,
    candidatesExcluded: 0,
    opportunities,
  };
}

export function contentSearchOutcomeNeedsRetry(
  outcome: ContentOpportunitySearchOutcome | null | undefined
): boolean {
  return outcome === 'fetchFailed' || outcome === 'rankingFailed';
}
