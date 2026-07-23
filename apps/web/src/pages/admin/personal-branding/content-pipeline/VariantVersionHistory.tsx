import { History } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import { cn } from '@/lib/utils';
import type {
  ContentVariant,
  ContentVariantVersionOrigin,
} from '@/types/api/personal-branding.dto';
import {
  pbBodySecondaryClassName,
  pbFormLabelClassName,
  pbMetaClassName,
  pbNestedSectionTitleClassName,
} from '../personal-branding-ui';
import { diffVariantContent, type DiffLine } from './variant-line-diff';

const ORIGIN_LABELS: Record<ContentVariantVersionOrigin, string> = {
  generation: 'Generated',
  regenerate: 'Regenerated',
  tweaks: 'Tweak regen',
  manual_save: 'Manual save',
};

function formatVersionDateAbsolute(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function DiffBlock({ label, lines }: { label: string; lines: DiffLine[] }) {
  const hasChanges = lines.some((line) => line.kind !== 'same');
  if (!hasChanges) return null;
  return (
    <div className="mt-2">
      <EyebrowLabel as="p">{label}</EyebrowLabel>
      <pre className="mt-1 overflow-x-auto rounded-md border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-950">
        {lines.map((line, idx) => (
          <div
            key={`${line.kind}-${idx}`}
            className={cn(
              line.kind === 'add' &&
                'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
              line.kind === 'remove' &&
                'bg-red-50 text-red-900 line-through dark:bg-red-950/40 dark:text-red-200'
            )}
          >
            {line.kind === 'add' ? '+ ' : line.kind === 'remove' ? '- ' : '  '}
            {line.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

interface VersionTimelineItemProps {
  version: ContentVariant;
  isLast: boolean;
  isComparing: boolean;
  isActivating: boolean;
  isSaving: boolean;
  onCompare: (versionId: string | null) => void;
  onActivate: (versionId: string) => void;
}

function VersionTimelineItem({
  version,
  isLast,
  isComparing,
  isActivating,
  isSaving,
  onCompare,
  onActivate,
}: VersionTimelineItemProps) {
  const origin = version.versionOrigin ?? 'generation';
  const isActive = Boolean(version.isActive);
  const relativeTime = formatRelativeChatTimestamp(version.createdAt);
  const absoluteTime = formatVersionDateAbsolute(version.createdAt);

  return (
    <li className="relative pl-6">
      {!isLast ? (
        <span
          className="absolute left-[7px] top-4 h-[calc(100%+0.25rem)] w-px bg-gray-200 dark:bg-gray-700"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          'absolute left-0 top-3 size-[15px] rounded-full border-2',
          isActive
            ? 'border-sky-500 bg-sky-500 dark:border-sky-400 dark:bg-sky-400'
            : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'
        )}
        aria-hidden
      />
      <div
        className={cn(
          'mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
          isActive
            ? 'border-sky-200 bg-sky-50/80 ring-1 ring-sky-500/30 dark:border-sky-900/50 dark:bg-sky-950/30 dark:ring-sky-400/20'
            : isComparing
              ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60'
              : 'border-gray-200/80 bg-white/60 dark:border-gray-700/80 dark:bg-gray-950/30'
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              'font-medium',
              isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            v{version.generationAttempt}
            {isActive ? (
              <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">
                Active
              </span>
            ) : null}
          </p>
          <p
            className={cn(
              'text-xs',
              isActive ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'
            )}
          >
            {ORIGIN_LABELS[origin]} ·{' '}
            <time dateTime={version.createdAt} title={absoluteTime} className="cursor-default">
              {relativeTime}
            </time>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {version.parentVariantId ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isActivating || isSaving}
              onClick={() => onCompare(isComparing ? null : version.id)}
            >
              {isComparing ? 'Hide diff' : 'Compare'}
            </Button>
          ) : null}
          {!isActive && version.status !== 'rejected' ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isActivating || isSaving}
              onClick={() => onActivate(version.id)}
            >
              Activate
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

interface VariantVersionHistoryProps {
  versions: ContentVariant[];
  isLoading?: boolean;
  isActivating?: boolean;
  isSaving?: boolean;
  comparingVersionId: string | null;
  onCompare: (versionId: string | null) => void;
  onActivate: (versionId: string) => void;
}

export default function VariantVersionHistory({
  versions,
  isLoading = false,
  isActivating = false,
  isSaving = false,
  comparingVersionId,
  onCompare,
  onActivate,
}: VariantVersionHistoryProps) {
  const comparingVersion = versions.find((v) => v.id === comparingVersionId) ?? null;
  const parentVersion =
    comparingVersion?.parentVariantId != null
      ? (versions.find((v) => v.id === comparingVersion.parentVariantId) ?? null)
      : null;
  const compareDiff =
    comparingVersion && parentVersion
      ? diffVariantContent(
          { title: parentVersion.title, body: parentVersion.body },
          { title: comparingVersion.title, body: comparingVersion.body }
        )
      : null;

  return (
    <InsetPanel className="mt-4" padding="standard">
      <div className="mb-3 flex items-start gap-2">
        <History className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden />
        <div>
          <h4 className={pbNestedSectionTitleClassName}>Version history</h4>
          <p className={cn('mt-1', pbBodySecondaryClassName, 'text-xs')}>
            Regenerations create versions automatically. Manual edits need Save version.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className={pbMetaClassName}>Loading versions…</p>
      ) : versions.length === 0 ? (
        <p className={pbMetaClassName}>No versions yet.</p>
      ) : (
        <ul className="list-none space-y-0" role="list" aria-label="Version history timeline">
          {versions.map((version, index) => (
            <VersionTimelineItem
              key={version.id}
              version={version}
              isLast={index === versions.length - 1}
              isComparing={comparingVersionId === version.id}
              isActivating={isActivating}
              isSaving={isSaving}
              onCompare={onCompare}
              onActivate={onActivate}
            />
          ))}
        </ul>
      )}

      {compareDiff ? (
        <InsetPanel className="mt-4" padding="compact">
          <p className={cn(pbFormLabelClassName, 'text-xs')}>Changes vs previous version</p>
          <DiffBlock label="Title" lines={compareDiff.title} />
          <DiffBlock label="Body" lines={compareDiff.body} />
          {!compareDiff.title.some((l) => l.kind !== 'same') &&
          !compareDiff.body.some((l) => l.kind !== 'same') ? (
            <p className={cn('mt-2', pbMetaClassName)}>No textual differences from parent.</p>
          ) : null}
        </InsetPanel>
      ) : null}
    </InsetPanel>
  );
}
