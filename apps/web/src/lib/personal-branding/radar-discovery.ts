import type {
  BrandProfile,
  RadarDiscoveryCandidate,
  RadarDiscoveryCandidateFilters,
  RadarDiscoveryProfileSelectionInput,
  RadarDiscoveryProgress,
  RadarDiscoveryRun,
  StartRadarDiscoveryRunInput,
} from '@/types/api/personal-branding.dto';

export type RadarDiscoveryCandidateFilter =
  | 'all'
  | 'relevant'
  | 'irrelevant'
  | 'duplicate'
  | 'errors';

export interface RadarDiscoveryDisplayCounts {
  queriesTotal: number;
  queriesCompleted: number;
  candidatesTotal: number;
  candidatesEvaluated: number;
  relevantCount: number;
  irrelevantCount: number;
  errorCount: number;
}

function dedupeTopics(topics: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const topic of topics) {
    const trimmed = topic.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function radarDiscoveryRunId(run: Pick<RadarDiscoveryRun, 'runId'>): string {
  return run.runId;
}

export function radarDiscoveryDisplayCounts(
  progress: RadarDiscoveryProgress
): RadarDiscoveryDisplayCounts {
  return {
    queriesTotal: progress.queriesTotal,
    queriesCompleted: progress.queriesCompleted,
    candidatesTotal: progress.candidatesDiscovered,
    candidatesEvaluated: progress.candidatesEvaluated,
    relevantCount: progress.candidatesRelevant,
    irrelevantCount: progress.candidatesNotRelevant,
    errorCount: progress.candidatesFailed,
  };
}

export function effectiveRadarDiscoveryTopics(
  profileSelections: RadarDiscoveryProfileSelectionInput[],
  customTopics: string[]
): string[] {
  return dedupeTopics([
    ...profileSelections.flatMap((selection) => selection.pillars),
    ...customTopics,
  ]);
}

export function buildRadarDiscoveryInput(
  selectedProfileIds: string[],
  pillarsByProfile: Record<string, string[]>,
  customTopics: string[]
): StartRadarDiscoveryRunInput {
  const profileSelections = selectedProfileIds.map((profileId) => ({
    profileId,
    pillars: dedupeTopics(pillarsByProfile[profileId] ?? []),
  }));
  return {
    profileSelections,
    customTopics: dedupeTopics(customTopics),
  };
}

export function validateRadarDiscoveryInput(
  input: StartRadarDiscoveryRunInput,
  profiles: BrandProfile[]
): string | null {
  if (input.profileSelections.length === 0) {
    return 'Select at least one brand profile.';
  }
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  for (const selection of input.profileSelections) {
    const profile = profilesById.get(selection.profileId);
    if (!profile) return 'One of the selected profiles is no longer available.';
    if (selection.pillars.length === 0) {
      return `Select at least one pillar for ${profile.name}.`;
    }
  }
  if (effectiveRadarDiscoveryTopics(input.profileSelections, input.customTopics).length === 0) {
    return 'Add at least one effective topic.';
  }
  return null;
}

export function radarDiscoveryCandidateFilterParams(
  filter: RadarDiscoveryCandidateFilter
): RadarDiscoveryCandidateFilters {
  switch (filter) {
    case 'relevant':
      return { verdict: 'relevant' };
    case 'irrelevant':
      return { verdict: 'not_relevant' };
    case 'errors':
      return { status: 'failed' };
    default:
      return {};
  }
}

export function filterDiscoveryCandidates(
  candidates: RadarDiscoveryCandidate[],
  filter: RadarDiscoveryCandidateFilter
): RadarDiscoveryCandidate[] {
  if (filter === 'duplicate') {
    return candidates.filter((candidate) => candidate.duplicateStatus === 'duplicate');
  }
  return candidates;
}

export const MAX_DISCOVERY_CANDIDATE_SELECTION = 20;

export function formatRadarDiscoveryBadgeLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function canSaveDiscoveryCandidate(candidate: RadarDiscoveryCandidate): boolean {
  const verifiedEndpoint = candidate.resolvedEndpoint ?? candidate.endpoint;
  const isMarkedNotASource = candidate.userNotASource === true;
  return (
    !isMarkedNotASource &&
    candidate.verdict === 'relevant' &&
    !candidate.savedSourceId &&
    candidate.duplicateStatus === 'new' &&
    Boolean(verifiedEndpoint) &&
    !candidate.error
  );
}

export function canAddDiscoveryCandidateAsItem(candidate: RadarDiscoveryCandidate): boolean {
  const isMarkedNotASource = candidate.userNotASource === true;
  return (
    !isMarkedNotASource &&
    candidate.verdict === 'not_relevant' &&
    !candidate.savedItemId &&
    Boolean(candidate.url) &&
    !candidate.error
  );
}
