import Button from '@/components/atoms/Button';
import type { PlannerProposedBlock } from '@/types/planner';

export interface PlannerDraftBannerProps {
  draftBlocks: PlannerProposedBlock[];
  isCommitting: boolean;
  commitError?: string | null;
  onCommit: () => void;
  onCancel: () => void;
}

export function PlannerDraftBanner({
  draftBlocks,
  isCommitting,
  commitError,
  onCommit,
  onCancel,
}: PlannerDraftBannerProps) {
  const dayCount = new Set(draftBlocks.map((b) => b.date)).size;
  const totalPts = draftBlocks.reduce((sum, b) => sum + (b.storyPointsLoad ?? 0), 0);
  const summary =
    draftBlocks.length === 0
      ? 'No proposed blocks — discard or run auto-schedule again.'
      : `${draftBlocks.length} proposed block${draftBlocks.length === 1 ? '' : 's'} across ${dayCount} day${dayCount === 1 ? '' : 's'} · ${totalPts} pts`;

  return (
    <div
      role="region"
      aria-label="Auto-schedule draft confirmation"
      className="sticky top-0 z-20 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-400/40 bg-indigo-950/90 px-4 py-3 shadow-lg backdrop-blur-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-indigo-100">Review auto-schedule draft</p>
        <p className="text-xs text-indigo-200/80">{summary}</p>
        {commitError ? (
          <p className="mt-1 text-xs text-red-300" role="alert">
            {commitError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" disabled={isCommitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={isCommitting || draftBlocks.length === 0}
          onClick={onCommit}
        >
          {isCommitting ? 'Committing…' : 'Commit Schedule'}
        </Button>
      </div>
    </div>
  );
}
