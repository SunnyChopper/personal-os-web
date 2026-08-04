import type {
  BrandProfile,
  ContentIdeaApproveJob,
  ContentNode,
} from '@/types/api/personal-branding.dto';

export const GENERATE_DRAFT_CTA_LABEL = 'Generate Draft';
export const GENERATE_DRAFT_CTA_HINT = 'Generate draft and open in Sandbox';

/**
 * Approve→draft is async (202 + poll). Never treat a job-start `{ jobId }` as
 * `{ idea, draft }` — missing `draft` crashed loadDraft in prod (bbc5bae966c5).
 */
export function getApproveJobDraft(
  job: Pick<ContentIdeaApproveJob, 'status' | 'result'>
): ContentNode | null {
  if (job.status !== 'succeeded') return null;
  const draft = job.result?.draft;
  return draft?.id ? draft : null;
}

export function isBrandProfileReadyForIdeation(profile: BrandProfile): boolean {
  const hasPillars = (profile.pillars ?? []).some((p) => p.trim().length > 0);
  const hasAudience = Boolean((profile.targetAudience ?? '').trim());
  return hasPillars && hasAudience;
}

/** Pipeline repurposer only allows finished (`active`) Brand Identity profiles. */
export function isBrandProfileSelectableForPipeline(profile: BrandProfile): boolean {
  return profile.status === 'active';
}

export function collectActiveBrandPillars(profiles: BrandProfile[]): string[] {
  if (!Array.isArray(profiles)) return [];

  const labels = new Set<string>();
  for (const profile of profiles) {
    if (profile.status !== 'active') continue;
    const pillars = profile.pillars;
    if (!Array.isArray(pillars)) continue;
    for (const pillar of pillars) {
      const label = pillar.trim();
      if (label) labels.add(label);
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b));
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function estimateReadingTimeMinutes(text: string, wordsPerMinute = 200): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.ceil(words / wordsPerMinute);
}

export function contentTextStats(body: string): { wordCount: number; readingTimeMinutes: number } {
  return {
    wordCount: countWords(body),
    readingTimeMinutes: estimateReadingTimeMinutes(body),
  };
}
