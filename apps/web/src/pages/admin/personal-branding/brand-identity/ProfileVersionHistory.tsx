import { History, RefreshCw } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type {
  BrandProfileVersion,
  BrandProfileVersionOrigin,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

const ORIGIN_LABELS: Record<BrandProfileVersionOrigin, string> = {
  manual: 'Manual save',
  initial_extraction: 'Initial extraction',
  rerun_extraction: 'Rerun extraction',
};

function formatVersionDate(iso: string): string {
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

interface ProfileVersionHistoryProps {
  versions: BrandProfileVersion[];
  isLoading?: boolean;
  isActivating?: boolean;
  isRerunning?: boolean;
  canRerun: boolean;
  onRerun: () => void;
  onActivate: (versionId: string) => void;
}

export default function ProfileVersionHistory({
  versions,
  isLoading = false,
  isActivating = false,
  isRerunning = false,
  canRerun,
  onRerun,
  onActivate,
}: ProfileVersionHistoryProps) {
  const activeVersion = versions.find((v) => v.isActive);

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <History className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Extraction versions
            </h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {activeVersion
                ? `Active: ${activeVersion.label || ORIGIN_LABELS[activeVersion.origin]}`
                : 'Switch between extraction runs or rerun from stored sources.'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!canRerun || isRerunning || isActivating}
          onClick={onRerun}
          className="inline-flex shrink-0 items-center gap-2"
        >
          <RefreshCw className={cn('size-4', isRerunning && 'animate-spin')} aria-hidden />
          {isRerunning ? 'Rerunning…' : 'Rerun extraction'}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-gray-500">Loading versions…</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-gray-500">
          No saved extraction versions yet. Complete an extraction or rerun to build history.
        </p>
      ) : (
        <ul className="space-y-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
                version.isActive
                  ? 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950/50'
              )}
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {version.label || ORIGIN_LABELS[version.origin]}
                  {version.isActive ? (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      Active
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500">
                  {ORIGIN_LABELS[version.origin]} · {formatVersionDate(version.createdAt)}
                  {version.pillars.length
                    ? ` · ${version.pillars.length} pillar${version.pillars.length === 1 ? '' : 's'}`
                    : ''}
                </p>
              </div>
              {!version.isActive ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isActivating || isRerunning}
                  onClick={() => onActivate(version.id)}
                >
                  Activate
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
