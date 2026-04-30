import { useEffect, useRef, useState } from 'react';
import { Moon } from 'lucide-react';

import Button from '@/components/atoms/Button';
import { useOneThing, useSetOneThing, useSuggestOneThing } from '@/hooks/usePlanner';
import { addDaysISO, todayISOLocal } from '@/lib/planner/week';
import type { OneThingCandidate } from '@/types/planner';

export interface PlannerOneThingPanelProps {
  /** Called after a successful save (e.g. refetch week). */
  onSaved?: () => void;
}

/**
 * Tomorrow’s single focus task: load selection, fetch top-3 suggestions if empty, save via API.
 * Lives on the main Planner page so scheduling and commitment stay in one place.
 */
export function PlannerOneThingPanel({ onSaved }: PlannerOneThingPanelProps) {
  const tomorrow = addDaysISO(todayISOLocal(), 1);
  const { data: existing, isLoading } = useOneThing(tomorrow);
  const suggest = useSuggestOneThing();
  const save = useSetOneThing();
  const [candidates, setCandidates] = useState<OneThingCandidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!existing || isLoading) return;
    if (existing.selectedTaskId) {
      setSelected(existing.selectedTaskId);
    }
  }, [existing, isLoading]);

  useEffect(() => {
    if (isLoading || !existing || fetched.current) return;
    if (existing.selectedTaskId) return;
    fetched.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const res = await suggest.mutateAsync(tomorrow);
        if (!cancelled) setCandidates(res.candidates.slice(0, 3));
      } catch {
        fetched.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, tomorrow, suggest, existing]);

  const handleSave = () => {
    if (!selected) return;
    save.mutate(
      { targetDate: tomorrow, taskId: selected, selectionReason: 'Planner — one thing' },
      {
        onSuccess: () => onSaved?.(),
      }
    );
  };

  return (
    <section
      className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3"
      aria-labelledby="planner-one-thing-heading"
    >
      <div className="flex items-start gap-2">
        <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <h2
            id="planner-one-thing-heading"
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            One thing for tomorrow
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pick a single focus task for <strong>{tomorrow}</strong>. It pins on that day in the
            week below.
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {!isLoading && candidates.length === 0 && !existing?.selectedTaskId && !suggest.isPending && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No suggestions yet. Refresh the page or check your connection.
        </p>
      )}

      {!isLoading && (
        <ul className="grid gap-2 sm:grid-cols-3">
          {(candidates.length ? candidates : []).map((c) => (
            <li key={c.taskId}>
              <button
                type="button"
                onClick={() => setSelected(c.taskId)}
                className={`w-full text-left rounded-lg border p-3 transition text-sm ${
                  selected === c.taskId
                    ? 'border-indigo-500 bg-white dark:bg-gray-900 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/70 dark:bg-gray-900/40'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white line-clamp-2">
                  {c.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {c.reason}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Score {c.plannerScore.toFixed(1)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {existing?.selectedTaskId && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Locked: <strong className="font-mono text-xs">{existing.selectedTaskId}</strong>
          {existing.selectionReason ? ` — ${existing.selectionReason}` : ''}. Choose another card to
          replace.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="primary" disabled={!selected || save.isPending} onClick={handleSave}>
          Save one thing
        </Button>
      </div>
    </section>
  );
}
