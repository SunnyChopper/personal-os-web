import { useEffect, useRef, useState } from 'react';
import { Moon } from 'lucide-react';

import Button from '@/components/atoms/Button';
import { useOneThing, useSetOneThing, useSuggestOneThing } from '@/hooks/usePlanner';
import {
  plannerFeaturePanelClassName,
  plannerHeadingClassName,
  plannerMutedClassName,
} from '@/lib/planner/planner-surfaces';
import { addDaysISO, todayISOLocal } from '@/lib/planner/week';
import type { OneThingCandidate } from '@/types/planner';

export interface PlannerOneThingPanelProps {
  /** Called after a successful save (e.g. refetch week). */
  onSaved?: () => void;
}

function sortCandidatesByScore(items: OneThingCandidate[]): OneThingCandidate[] {
  return [...items].sort((a, b) => b.plannerScore - a.plannerScore).slice(0, 3);
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
    if (isLoading) return;
    if (existing?.selectedTaskId) {
      setSelected(existing.selectedTaskId);
    }
  }, [existing, isLoading]);

  useEffect(() => {
    if (isLoading || fetched.current) return;
    if (existing?.selectedTaskId) return;
    fetched.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const res = await suggest.mutateAsync(tomorrow);
        const sorted = sortCandidatesByScore(res.candidates);
        if (!cancelled) {
          setCandidates(sorted);
          if (sorted.length > 0) setSelected(sorted[0].taskId);
        }
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

  const primaryCandidate = candidates[0] ?? null;
  const alternateCandidates = candidates.slice(1);
  const lockedTaskId = existing?.selectedTaskId ?? null;
  const lockedCandidate = lockedTaskId
    ? candidates.find((c) => c.taskId === lockedTaskId)
    : undefined;
  const showSuggestionPicker = !isLoading && !lockedTaskId && primaryCandidate !== null;

  return (
    <section
      className={`space-y-3 p-4 ${plannerFeaturePanelClassName}`}
      aria-labelledby="planner-one-thing-heading"
    >
      <div className="flex items-start gap-2">
        <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <h2
            id="planner-one-thing-heading"
            className={`text-base font-semibold ${plannerHeadingClassName}`}
          >
            One thing for tomorrow
          </h2>
          <p className={`text-sm ${plannerMutedClassName}`}>
            Pick a single focus task for <strong>{tomorrow}</strong>. It pins on that day in the
            week below.
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {suggest.isPending && !isLoading && !lockedTaskId && (
        <p className="text-sm text-gray-500">Finding your highest-leverage task…</p>
      )}

      {suggest.isError && !isLoading && !lockedTaskId && candidates.length === 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Could not load suggestions. Refresh the page or try again later.
        </p>
      )}

      {showSuggestionPicker && primaryCandidate && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelected(primaryCandidate.taskId)}
            className={`w-full text-left rounded-xl border-2 p-4 transition ${
              selected === primaryCandidate.taskId
                ? 'border-indigo-400 bg-indigo-50 shadow-md ring-1 ring-indigo-500/30 dark:bg-indigo-950/50'
                : 'border-indigo-500/40 bg-white/80 dark:bg-gray-900/60 hover:border-indigo-400/60'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-400">
              Recommended focus
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {primaryCandidate.title}
            </h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-gray-200">
                Why this is the bottleneck:
              </span>{' '}
              {primaryCandidate.reason}
            </p>
            <p className="mt-2 text-[10px] text-gray-500">
              Score {primaryCandidate.plannerScore.toFixed(1)}
            </p>
          </button>

          {alternateCandidates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Switch focus to:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {alternateCandidates.map((c) => (
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
            </div>
          )}
        </div>
      )}

      {lockedTaskId && !isLoading && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-1 dark:border-emerald-500/30 dark:bg-emerald-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Locked for tomorrow
          </p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {lockedCandidate?.title ?? lockedTaskId}
          </p>
          {lockedCandidate?.reason && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-gray-200">
                Why this is the bottleneck:
              </span>{' '}
              {lockedCandidate.reason}
            </p>
          )}
          {existing?.selectionReason && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{existing.selectionReason}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="primary" disabled={!selected || save.isPending} onClick={handleSave}>
          Save one thing
        </Button>
      </div>
    </section>
  );
}
