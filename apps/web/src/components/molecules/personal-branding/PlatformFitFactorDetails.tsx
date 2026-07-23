import { ExpandablePlainTextPreview } from '@/components/molecules/personal-branding/ExpandablePlainTextPreview';
import { cn } from '@/lib/utils';
import type { PlatformFitFactors } from '@/types/api/personal-branding.dto';
import { pbBodySecondaryClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

const FACTOR_DETAIL_MAX_CHARS = 120;

const FACTOR_ROWS = [
  { key: 'lengthFit', label: 'Length' },
  { key: 'structureFit', label: 'Structure' },
  { key: 'pillarFit', label: 'Pillars' },
  { key: 'rulesFit', label: 'Rules' },
] as const satisfies ReadonlyArray<{
  key: keyof PlatformFitFactors;
  label: string;
}>;

export type PlatformFitFactorDetailsProps = {
  factors: PlatformFitFactors;
  className?: string;
};

export function PlatformFitFactorDetails({ factors, className }: PlatformFitFactorDetailsProps) {
  const sortedRows = [...FACTOR_ROWS].sort((a, b) => {
    const scoreDiff = factors[a.key].score - factors[b.key].score;
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return (
      FACTOR_ROWS.findIndex((row) => row.key === a.key) -
      FACTOR_ROWS.findIndex((row) => row.key === b.key)
    );
  });

  return (
    <dl className={cn('mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2', className)}>
      {sortedRows.map(({ key, label }) => {
        const factor = factors[key];
        const scorePercent = Math.round(factor.score * 100);

        return (
          <div key={key} className="min-w-0 rounded-md bg-gray-50 p-3 dark:bg-gray-900/60">
            <dt className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {label}
              </span>
              <span className="shrink-0 tabular-nums text-xs font-medium text-gray-700 dark:text-gray-300">
                {scorePercent}%
              </span>
            </dt>
            <dd className="mt-1">
              <ExpandablePlainTextPreview
                text={factor.detail}
                maxChars={FACTOR_DETAIL_MAX_CHARS}
                className={pbBodySecondaryClassName}
                expandedMaxHeightClassName="max-h-32"
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
