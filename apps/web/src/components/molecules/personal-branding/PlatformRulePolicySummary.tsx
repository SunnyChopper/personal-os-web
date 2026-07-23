import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  labelFromCatalog,
  parseRequirementLines,
  RHETORICAL_STRENGTH_LABELS,
} from '@/lib/personal-branding/platform-rule-display';
import { statusPillClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import type {
  PlatformRuleCatalog,
  RhetoricalDeviceId,
  RhetoricalModeSetting,
} from '@/types/api/personal-branding.dto';

export interface PlatformRulePolicySummaryProps {
  characterLimit?: number | null;
  readTimeLimitMinutes?: number | null;
  rhetoricalModes: RhetoricalModeSetting[];
  rhetoricalDevices: RhetoricalDeviceId[];
  requirements?: string | null;
  needsReview?: boolean;
  catalog?: PlatformRuleCatalog | null;
  className?: string;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {children}
    </p>
  );
}

function ChipList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} role="list">
      {children}
    </ul>
  );
}

export default function PlatformRulePolicySummary({
  characterLimit,
  readTimeLimitMinutes,
  rhetoricalModes,
  rhetoricalDevices,
  requirements,
  needsReview = false,
  catalog,
  className,
}: PlatformRulePolicySummaryProps) {
  const requirementLines = parseRequirementLines(requirements);
  const hasMeta = characterLimit != null || readTimeLimitMinutes != null;
  const hasModes = rhetoricalModes.length > 0;
  const hasDevices = rhetoricalDevices.length > 0;
  const hasRequirements = requirementLines.length > 0;

  if (!hasMeta && !hasModes && !hasDevices && !hasRequirements && !needsReview) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {hasMeta && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
          {characterLimit != null && (
            <span>
              <span className="text-gray-500 dark:text-gray-400">Character limit</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {characterLimit.toLocaleString()}
              </span>
            </span>
          )}
          {readTimeLimitMinutes != null && (
            <span>
              <span className="text-gray-500 dark:text-gray-400">Read time</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {readTimeLimitMinutes} min
              </span>
            </span>
          )}
        </div>
      )}

      {hasModes && (
        <section aria-labelledby="platform-rule-modes-label">
          <SectionLabel>
            <span id="platform-rule-modes-label">Modes</span>
          </SectionLabel>
          <ChipList className="mt-2">
            {rhetoricalModes.map((mode) => (
              <li key={mode.mode}>
                <span className={statusPillClassName('info', 'gap-1')}>
                  <span>{labelFromCatalog(catalog?.modes, mode.mode)}</span>
                  <span className="font-normal text-blue-700/80 dark:text-blue-200/80">
                    {RHETORICAL_STRENGTH_LABELS[mode.strength]}
                  </span>
                </span>
              </li>
            ))}
          </ChipList>
        </section>
      )}

      {hasDevices && (
        <section aria-labelledby="platform-rule-devices-label">
          <SectionLabel>
            <span id="platform-rule-devices-label">Allowed devices</span>
          </SectionLabel>
          <ChipList className="mt-2">
            {rhetoricalDevices.map((deviceId) => (
              <li key={deviceId}>
                <span className={statusPillClassName('neutral')}>
                  {labelFromCatalog(catalog?.devices, deviceId)}
                </span>
              </li>
            ))}
          </ChipList>
        </section>
      )}

      {hasRequirements && (
        <section aria-labelledby="platform-rule-requirements-label">
          <SectionLabel>
            <span id="platform-rule-requirements-label">Requirements</span>
          </SectionLabel>
          <ul
            className="mt-2 space-y-1.5 border-l border-gray-200 pl-3 dark:border-gray-700"
            role="list"
          >
            {requirementLines.map((line, index) => (
              <li
                key={`${index}-${line}`}
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {needsReview && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Legacy rule — add requirements on edit.
        </p>
      )}
    </div>
  );
}
