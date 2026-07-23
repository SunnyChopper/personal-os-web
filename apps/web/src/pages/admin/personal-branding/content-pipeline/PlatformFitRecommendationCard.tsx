import Button from '@/components/atoms/Button';
import { BrandPlatformChip } from '@/components/molecules/personal-branding/BrandPlatformChip';
import { PlatformFitFactorDetails } from '@/components/molecules/personal-branding/PlatformFitFactorDetails';
import { cn } from '@/lib/utils';
import { platformFitRecommendationSurfaceClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import type { PlatformFitRecommendation, PlatformFitTier } from '@/types/api/personal-branding.dto';
import {
  pbBodySecondaryClassName,
  pbMetaClassName,
  statusPillClassName,
} from '../personal-branding-ui';

const FIT_TIER_LABELS: Record<PlatformFitTier, string> = {
  high: 'High fit',
  medium: 'Medium fit',
  low: 'Low fit',
};

const FIT_TIER_TONES: Record<PlatformFitTier, 'success' | 'warning' | 'neutral'> = {
  high: 'success',
  medium: 'warning',
  low: 'neutral',
};

export type PlatformFitRecommendationCardProps = {
  recommendation: PlatformFitRecommendation;
  /** 1-based display rank from the ordered recommendations list. */
  rank: number;
  selected: boolean;
  onToggle: () => void;
};

export function PlatformFitRecommendationCard({
  recommendation,
  rank,
  selected,
  onToggle,
}: PlatformFitRecommendationCardProps) {
  const scorePercent = Math.round(recommendation.score * 100);

  return (
    <li className={platformFitRecommendationSurfaceClassName(rank)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 tabular-nums text-sm font-semibold text-gray-500 dark:text-gray-400">
          #{rank}
        </span>
        <BrandPlatformChip platform={recommendation.platform} />
        <span className={statusPillClassName(FIT_TIER_TONES[recommendation.fitTier])}>
          {FIT_TIER_LABELS[recommendation.fitTier]}
        </span>
        <span className="ml-auto shrink-0 tabular-nums text-sm font-semibold text-gray-900 dark:text-white">
          {scorePercent}%
        </span>
        <Button
          type="button"
          size="sm"
          variant={selected ? 'ghost' : 'secondary'}
          aria-pressed={selected}
          onClick={onToggle}
        >
          {selected ? 'Remove' : 'Add'}
        </Button>
      </div>

      <p className={cn('mt-3', pbBodySecondaryClassName)}>{recommendation.rationale}</p>

      <details className="mt-3">
        <summary className={cn('cursor-pointer select-none', pbMetaClassName)}>
          Factor details
        </summary>
        <PlatformFitFactorDetails factors={recommendation.factors} />
      </details>
    </li>
  );
}
