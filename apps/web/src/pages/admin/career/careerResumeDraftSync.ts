import type { CareerGeneratedResume, CareerResumeBulletRationale } from '@/types/api/career.types';

export type ResumePreviewMeta = {
  atsKeywordsUsed: string[];
  biasStrategyNotes?: string | null;
  atsScore?: number | null;
  humanScore?: number | null;
  llmAtsScore?: number | null;
  bulletRationales?: CareerResumeBulletRationale[];
};

export type ResumePreviewKeywordDiff = {
  mandatory: string[];
  matched: string[];
  missing: string[];
};

export function previewMetaFromDraft(draft: CareerGeneratedResume): ResumePreviewMeta {
  return {
    atsKeywordsUsed: draft.atsKeywordsUsed ?? [],
    biasStrategyNotes: draft.biasStrategyNotes,
    atsScore: draft.atsScore,
    humanScore: draft.humanScore,
    llmAtsScore: draft.llmAtsScore,
    bulletRationales: draft.bulletRationales ?? [],
  };
}

export function previewKeywordDiffFromDraft(
  draft: CareerGeneratedResume
): ResumePreviewKeywordDiff {
  return {
    mandatory: draft.mandatoryKeywords ?? [],
    matched: draft.matchedKeywords ?? [],
    missing: draft.missingKeywords ?? [],
  };
}
