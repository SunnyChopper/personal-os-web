import { defaultReplyPlatformFormat } from '@/lib/personal-branding/platform-format-helpers';
import type {
  BrandPlatform,
  ReplyGenerationDraft,
  SuggestedReplyParams,
} from '@/types/api/personal-branding.dto';

export function draftFromSuggestedParams(
  suggested: SuggestedReplyParams | null | undefined,
  fallbackCatalogModelId: string,
  defaultProfileId = '',
  platform: BrandPlatform = 'x'
): ReplyGenerationDraft {
  return {
    profileId: defaultProfileId,
    mode: suggested?.mode ?? 'SIMPLE',
    researchEnabled: suggested?.researchEnabled ?? false,
    vaultGroundingEnabled: suggested?.vaultGroundingEnabled ?? false,
    includeOperatorBriefing: false,
    catalogModelId: fallbackCatalogModelId,
    reasoningEffort: suggested?.reasoningEffort ?? 'medium',
    suggestionCount: suggested?.suggestionCount ?? 3,
    questionFirstBias: 'auto',
    platformFormat: defaultReplyPlatformFormat(platform),
  };
}
