import type { ReconLearningCostTier } from '@/types/api/personal-branding.dto';

export function defaultIncludeOperatorBriefing(
  learningCost?: ReconLearningCostTier | string | null
): boolean {
  const tier = (learningCost ?? '').toLowerCase();
  return tier === 'high' || tier === 'max';
}
