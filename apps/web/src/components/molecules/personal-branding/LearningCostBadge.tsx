import { GraduationCap } from 'lucide-react';
import {
  RECON_LEARNING_COST_LABELS,
  type ReconLearningCostTier,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

const VALID_TIERS = new Set<string>(['low', 'medium', 'high', 'max']);

function normalizeLearningCostTier(value?: string | null): ReconLearningCostTier | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!VALID_TIERS.has(normalized)) {
    return null;
  }
  return normalized as ReconLearningCostTier;
}

function learningCostBadgeClassName(tier: ReconLearningCostTier): string {
  switch (tier) {
    case 'low':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300';
    case 'max':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export interface LearningCostBadgeProps {
  learningCost?: string | null;
  className?: string;
}

export default function LearningCostBadge({ learningCost, className }: LearningCostBadgeProps) {
  const tier = normalizeLearningCostTier(learningCost);
  if (!tier) return null;

  const label = RECON_LEARNING_COST_LABELS[tier];

  return (
    <span
      data-learning-cost={tier}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        learningCostBadgeClassName(tier),
        className
      )}
      title={`Learning cost: ${label}`}
    >
      <GraduationCap className="size-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
