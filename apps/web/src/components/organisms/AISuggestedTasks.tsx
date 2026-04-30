import { Plus, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { WeeklyReviewAcceptedTask, WeeklyReviewSuggestedTask } from '@/types/growth-system';

interface AISuggestedTasksProps {
  suggestions: WeeklyReviewSuggestedTask[];
  accepted: WeeklyReviewAcceptedTask[];
  onAdd: (task: WeeklyReviewAcceptedTask) => void;
  onRefresh: () => void;
  loading?: boolean;
  /** When true, hide refresh and add actions (archived / completed week). */
  readOnly?: boolean;
}

export function AISuggestedTasks({
  suggestions,
  accepted,
  onAdd,
  onRefresh,
  loading,
  readOnly = false,
}: AISuggestedTasksProps) {
  const isAccepted = (t: WeeklyReviewSuggestedTask) => accepted.some((a) => a.title === t.title);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles className="h-4 w-4 text-amber-400" />
          AI task ideas
        </h3>
        {!readOnly && (
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? 'Thinking…' : 'Refresh suggestions'}
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {suggestions.map((t, i) => (
          <div
            key={`${t.title}-${i}`}
            className="flex flex-col gap-2 rounded-lg border border-slate-700/60 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-slate-100">{t.title}</p>
              <p className="text-sm text-slate-400">{t.rationale}</p>
              {t.suggestedStoryPoints != null && (
                <p className="mt-1 text-xs text-slate-500">~{t.suggestedStoryPoints} pts</p>
              )}
            </div>
            {readOnly ? (
              isAccepted(t) ? (
                <span className="shrink-0 rounded-lg bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  Added to sprint
                </span>
              ) : null
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="shrink-0 gap-2"
                disabled={isAccepted(t)}
                onClick={() =>
                  onAdd({
                    title: t.title,
                    description: t.rationale,
                    area: t.area || 'Operations',
                    priority: 'P3',
                    size: t.suggestedStoryPoints ?? undefined,
                    goalIds: t.goalIds ?? [],
                    projectIds: t.projectIds ?? [],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {isAccepted(t) ? 'Added' : 'Add to sprint'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
