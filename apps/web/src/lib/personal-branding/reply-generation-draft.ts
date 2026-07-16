import type { ReplyGenerationDraft, SuggestedReplyParams } from '@/types/api/personal-branding.dto';

export function draftFromSuggestedParams(
  suggested: SuggestedReplyParams | null | undefined,
  fallbackCatalogModelId: string
): ReplyGenerationDraft {
  return {
    mode: suggested?.mode ?? 'SIMPLE',
    researchEnabled: suggested?.researchEnabled ?? false,
    catalogModelId: fallbackCatalogModelId,
    reasoningEffort: suggested?.reasoningEffort ?? 'medium',
    suggestionCount: suggested?.suggestionCount ?? 3,
  };
}
