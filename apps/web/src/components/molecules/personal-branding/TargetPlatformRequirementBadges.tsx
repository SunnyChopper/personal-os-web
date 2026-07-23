import { type MouseEvent } from 'react';
import { useEffectivePlatformRules } from '@/hooks/useEffectivePlatformRules';
import { cn } from '@/lib/utils';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';

export interface PlatformRequirementCountBadgeProps {
  platform: BrandPlatform;
  count: number;
  expanded: boolean;
  panelId: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function PlatformRequirementCountBadge({
  platform,
  count,
  expanded,
  panelId,
  onClick,
}: PlatformRequirementCountBadgeProps) {
  const platformLabel = BRAND_PLATFORM_LABELS[platform];

  const requirementWord = count === 1 ? 'requirement' : 'requirements';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label={`${count} platform requirement${count === 1 ? '' : 's'} for ${platformLabel}`}
      title={`${count} ${requirementWord} — click to view`}
      className={cn(
        'ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        expanded
          ? 'bg-blue-700 text-white dark:bg-blue-300 dark:text-blue-950'
          : 'bg-blue-600/15 text-blue-800 dark:bg-blue-400/20 dark:text-blue-100'
      )}
    >
      {count} req
    </button>
  );
}

export interface TargetPlatformRequirementsExpandPanelProps {
  profileByPlatform: Partial<Record<BrandPlatform, string>>;
  targetPlatforms: BrandPlatform[];
  expandedPlatform: BrandPlatform | null;
  byPlatform: ReturnType<typeof useEffectivePlatformRules>['byPlatform'];
  panelId: (platform: BrandPlatform) => string;
}

function RequirementsList({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1.5 border-l border-gray-200 pl-3 dark:border-gray-700" role="list">
      {lines.map((line, index) => (
        <li
          key={`${index}-${line}`}
          className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
        >
          {line}
        </li>
      ))}
    </ul>
  );
}

export function TargetPlatformRequirementsExpandPanel({
  profileByPlatform,
  targetPlatforms,
  expandedPlatform,
  byPlatform,
  panelId,
}: TargetPlatformRequirementsExpandPanelProps) {
  if (
    !expandedPlatform ||
    !targetPlatforms.includes(expandedPlatform) ||
    !profileByPlatform[expandedPlatform]
  ) {
    return null;
  }

  const entry = byPlatform.get(expandedPlatform);
  if (!entry || entry.isPending) {
    return null;
  }

  const policy = entry.data?.resolvedPolicy;
  const requirementLines = entry.requirementLines;
  const hasLimits = policy?.characterLimit != null || policy?.readTimeLimitMinutes != null;

  if (requirementLines.length === 0 && !hasLimits) {
    return null;
  }

  return (
    <div
      id={panelId(expandedPlatform)}
      role="region"
      aria-labelledby={`platform-rules-heading-${expandedPlatform}`}
      className="mt-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/40"
    >
      <p
        id={`platform-rules-heading-${expandedPlatform}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      >
        Active rules for {BRAND_PLATFORM_LABELS[expandedPlatform]}
      </p>

      {hasLimits ? (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {policy?.characterLimit != null ? (
            <span>
              Character limit{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {policy.characterLimit.toLocaleString()}
              </span>
            </span>
          ) : null}
          {policy?.characterLimit != null && policy?.readTimeLimitMinutes != null ? (
            <span className="mx-2" aria-hidden>
              ·
            </span>
          ) : null}
          {policy?.readTimeLimitMinutes != null ? (
            <span>
              Read time{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {policy.readTimeLimitMinutes} min
              </span>
            </span>
          ) : null}
        </p>
      ) : null}

      {requirementLines.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Requirements
          </p>
          <RequirementsList lines={requirementLines} />
        </div>
      ) : null}
    </div>
  );
}
