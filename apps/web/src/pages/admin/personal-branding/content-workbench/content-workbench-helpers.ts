import type { BrainstormModelPickerValue } from '@/lib/assistant/brainstorm-model-picker';
import type {
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaApproveJob,
  ContentIdeaGenerationContextStats,
  ContentNode,
  PaginatedPersonalBranding,
  ReferencedPublishedHint,
} from '@/types/api/personal-branding.dto';
import { CONTENT_IDEA_REJECT_CATEGORY_LABELS } from '@/types/api/personal-branding.dto';

export const GENERATE_DRAFT_CTA_LABEL = 'Generate Draft';
export const GENERATE_DRAFT_CTA_HINT = 'Generate draft and open in Sandbox';

/** Stable DOM ids for empty-state focus targets and generate CTAs. */
export const VAULT_EXTRACTOR_GENERATE_BUTTON_ID = 'vault-extractor-generate-ideas';
export const VAULT_EXTRACTOR_VAULT_SEARCH_INPUT_ID = 'vault-extractor-vault-search';
export const IDEATION_ENGINE_GENERATE_BUTTON_ID = 'ideation-engine-generate-ideas';

export const IDEATION_SECTION_LEAD = 'Grounds each run in Brand Identity and prior idea outcomes.';
export const IDEATION_ADVANCED_LEARNING_HINT =
  'Rejected, existing, and drafted ideas still shape future runs.';
export const IDEATION_IMAGE_SEARCH_HINT =
  'Image-friendly ideas; Brave injects results after you approve a draft.';
export const IDEATION_KEYWORD_RESEARCH_HINT =
  'Runs DataForSEO keyword research before brainstorming (may take several minutes). Medium always includes this.';
export const IDEATION_AI_MODEL_AUTO_HINT =
  'Uses the contentIdeation server default (claude-sonnet-5). Switch to Manual to pick from the assistant catalog.';

/** Screen-reader announcement when Sandbox AI tools replace editor body. */
export const CONTENT_WORKBENCH_AI_TOOL_UPDATED_MESSAGE = 'Content updated by AI tool';

/** Live-region message for template adherence after draft generation. */
export function formatTemplateAppliedMessage(templateApplied: {
  note: string;
  adherence: string;
}): string {
  if (templateApplied.adherence === 'low' || templateApplied.adherence === 'medium') {
    return `Template adherence: ${templateApplied.note}`;
  }
  return templateApplied.note;
}

/** Screen-reader announcement when ideation brainstorm completes with new ideas. */
export function formatNewIdeasReadyMessage(count: number): string {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 1) return '1 new idea ready';
  return `${safeCount} new ideas ready`;
}

/** Operator hint when published reference already has Pipeline cross-post adaptations. */
export function formatReferencedPublishedHintLine(
  hint: ReferencedPublishedHint,
  platformLabels: Record<BrandPlatform, string>
): string {
  const labels = hint.adaptedPlatforms.map((platform) => platformLabels[platform]).join(', ');
  return `${hint.title} — already adapted to ${labels}.`;
}

/** Clear then re-set so assistive tech re-reads the same message on repeat events. */
export function announceLiveMessage(setMessage: (message: string | null) => void, message: string) {
  setMessage(null);
  queueMicrotask(() => setMessage(message));
}

/** Preset idea counts shown as compact chips on the Ideation Engine panel. */
export const IDEATION_IDEA_COUNT_PRESETS = [3, 6, 9] as const;

export type IdeationIdeaCountPreset = (typeof IDEATION_IDEA_COUNT_PRESETS)[number];

/** Platform-norm default for ideation brainstorm count (subset of API 1–12). */
export function defaultIdeaCountForPlatform(platform: BrandPlatform): IdeationIdeaCountPreset {
  if (platform === 'x') return 3;
  if (platform === 'medium') return 9;
  return 6;
}

/** Canonical mirror: `personal_branding_platform_policy.IDEA_COUNT_SOFT_MAX`. */
export function softMaxIdeaCountForPlatform(platform: BrandPlatform): number {
  if (platform === 'x') return 6;
  if (platform === 'medium') return 12;
  return 9;
}

export function clampIdeaCountForPlatform(platform: BrandPlatform, count: number): number {
  const softMax = softMaxIdeaCountForPlatform(platform);
  return Math.min(Math.max(1, count), softMax);
}

export function ideationIdeaCountPresetsForPlatform(
  platform: BrandPlatform
): readonly IdeationIdeaCountPreset[] {
  const softMax = softMaxIdeaCountForPlatform(platform);
  return IDEATION_IDEA_COUNT_PRESETS.filter((preset) => preset <= softMax);
}

export const TREND_STREAM_IDEA_COUNT_OPTIONS = [3, 4, 5, 6, 8, 10, 12] as const;

export function trendStreamIdeaCountOptionsForPlatform(platform: BrandPlatform): number[] {
  const softMax = softMaxIdeaCountForPlatform(platform);
  return TREND_STREAM_IDEA_COUNT_OPTIONS.filter((count) => count <= softMax);
}

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

export function hasIdeationAdvancedOptionsActive({
  seedIdeas,
  boostFromRecentPublishes,
  enableImageSearch,
  enableKeywordResearch,
  ideationModelPicker,
}: {
  seedIdeas: string;
  boostFromRecentPublishes: boolean;
  enableImageSearch: boolean;
  enableKeywordResearch: boolean;
  ideationModelPicker: BrainstormModelPickerValue;
}): boolean {
  return (
    seedIdeas.trim().length > 0 ||
    !boostFromRecentPublishes ||
    enableImageSearch ||
    enableKeywordResearch ||
    ideationModelPicker.mode === 'manual'
  );
}

/** Post-generation line for seed semantic vs recent-publish boost references. */
export function formatReferencedPublishedStatsLine(
  stats: Pick<ContentIdeaGenerationContextStats, 'referencedPublishedCount' | 'referenceSearchMode'>
): string | null {
  const count = stats.referencedPublishedCount;
  if (count <= 0) return null;
  if (stats.referenceSearchMode === 'recentBoost') {
    return `Boosted from ${count} recent published post${count === 1 ? '' : 's'}.`;
  }
  return `Referenced ${count} past published post${count === 1 ? '' : 's'} for style and voice.`;
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

function trendIdeaRecencyTimestamp(idea: ContentIdea): string {
  return idea.updatedAt || idea.createdAt || '';
}

/** Trend Ideas tab: merge GENERATED + DRAFTED radar-sourced ideas, unused first. */
export function selectTrendIdeas(generated: ContentIdea[], drafted: ContentIdea[]): ContentIdea[] {
  const byId = new Map<string, ContentIdea>();

  for (const idea of [...generated, ...drafted]) {
    if (idea.sourceType !== 'RADAR_INGESTED') continue;
    const existing = byId.get(idea.id);
    if (!existing) {
      byId.set(idea.id, idea);
      continue;
    }
    // Prefer non-GENERATED when the same id appears in both lists.
    if (existing.status === 'GENERATED' && idea.status !== 'GENERATED') {
      byId.set(idea.id, idea);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const aGenerated = a.status === 'GENERATED' ? 0 : 1;
    const bGenerated = b.status === 'GENERATED' ? 0 : 1;
    if (aGenerated !== bGenerated) return aGenerated - bGenerated;
    return trendIdeaRecencyTimestamp(b).localeCompare(trendIdeaRecencyTimestamp(a));
  });
}

/** Optimistic reject: remove one idea from the GENERATED list cache envelope. */
export function removeContentIdeaFromList(
  page: PaginatedPersonalBranding<ContentIdea> | undefined,
  ideaId: string
): PaginatedPersonalBranding<ContentIdea> | undefined {
  if (!page) return page;
  const nextData = page.data.filter((idea) => idea.id !== ideaId);
  if (nextData.length === page.data.length) return page;
  return {
    ...page,
    data: nextData,
    total: Math.max(0, page.total - 1),
  };
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

/** Format rejection histogram for Ideation/Vault post-generation stats lines. */
export function formatRejectedFeedbackStatsLine(
  stats: Pick<ContentIdeaGenerationContextStats, 'rejectedFeedbackCount' | 'rejectedCategoryCounts'>
): string | null {
  const count = stats.rejectedFeedbackCount;
  if (count <= 0) return null;

  const histogram = stats.rejectedCategoryCounts ?? {};
  const histogramParts = Object.entries(histogram)
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, n]) => {
      const label =
        CONTENT_IDEA_REJECT_CATEGORY_LABELS[id as keyof typeof CONTENT_IDEA_REJECT_CATEGORY_LABELS];
      const display = label ?? id;
      return `${display}×${n}`;
    });

  const rejectionWord = count === 1 ? 'rejection' : 'rejections';
  if (histogramParts.length === 0) {
    return `${count} prior ${rejectionWord} applied as hard negatives`;
  }
  return `${count} prior ${rejectionWord} applied (${histogramParts.join(', ')})`;
}
