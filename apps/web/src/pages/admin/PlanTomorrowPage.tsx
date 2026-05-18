import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { DowHistoryStrip } from '@/components/organisms/planner/DowHistoryStrip';
import { PredictionCard } from '@/components/organisms/planner/PredictionCard';
import { PlannerBlockCard } from '@/components/organisms/planner/PlannerBlockCard';
import { SuggestionsList } from '@/components/organisms/planner/SuggestionsList';
import { useCommitPlanDay, usePlanDay } from '@/hooks/usePlanner';
import { useToast } from '@/hooks/use-toast';
import { addDaysISO, todayISOLocal } from '@/lib/planner/week';
import { ROUTES } from '@/routes';
import type { PlannerDay } from '@/types/planner';

function formatPrettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PlanTomorrowPage() {
  const defaultTomorrow = useMemo(() => addDaysISO(todayISOLocal(), 1), []);
  const [planDateISO, setPlanDateISO] = useState(defaultTomorrow);

  const { data: plan, isLoading, error, refetch } = usePlanDay(planDateISO);
  const commit = useCommitPlanDay(planDateISO);
  const { showToast, ToastContainer } = useToast();

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [committedDay, setCommittedDay] = useState<PlannerDay | null>(null);

  useEffect(() => {
    if (!plan) return;
    const ids = plan.suggestions.map((s) => s.taskId);
    setOrderedIds(ids);
    setSelectedIds(new Set(ids));
    setCommittedDay(null);
  }, [plan, planDateISO]);

  const busy = commit.isPending;

  const handleToggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const submitDeterministic = () => {
    const taskIds = orderedIds.filter((id) => selectedIds.has(id));
    commit.mutate(
      { taskIds, useLlm: false },
      {
        onSuccess: (week) => {
          const row = week.days.find((day) => day.date === planDateISO);
          setCommittedDay(row ?? null);
          showToast({
            type: 'success',
            title: 'Plan scheduled',
            message: `${taskIds.length} task${taskIds.length === 1 ? '' : 's'} placed on ${planDateISO}`,
          });
        },
        onError: (e) =>
          showToast({
            type: 'error',
            title: 'Plan failed',
            message: e instanceof Error ? e.message : 'Unknown error',
          }),
      }
    );
  };

  const submitWithLlm = () => {
    commit.mutate(
      { taskIds: [], useLlm: true },
      {
        onSuccess: (week) => {
          const row = week.days.find((day) => day.date === planDateISO);
          setCommittedDay(row ?? null);
          showToast({
            type: 'success',
            title: 'AI plan scheduled',
            message: row?.blocks?.length
              ? `${row.blocks.length} blocks created`
              : 'Week refreshed — check planner week board.',
          });
        },
        onError: (e) =>
          showToast({
            type: 'error',
            title: 'AI plan failed',
            message: e instanceof Error ? e.message : 'Unknown error',
          }),
      }
    );
  };

  const predictionBlock = plan ? (
    <>
      <PredictionCard prediction={plan.prediction} />
      <DowHistoryStrip
        history={plan.prediction.dayOfWeekHistory}
        activeDayOfWeek={plan.prediction.dayOfWeek}
      />
    </>
  ) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <ToastContainer />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan a day</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Targets <strong>{formatPrettyDate(planDateISO)}</strong> using Fibonacci{' '}
            <abbr title="Task size column" className="cursor-help">
              story points
            </abbr>{' '}
            throughput.
          </p>
          <Link
            className="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
            to={ROUTES.admin.plannerWeek}
          >
            Switch to classic week board
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={() => setPlanDateISO(todayISOLocal())}
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={() => setPlanDateISO(addDaysISO(todayISOLocal(), 1))}
          >
            Tomorrow
          </button>
          <input
            aria-label="Plan date"
            type="date"
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
            value={planDateISO}
            onChange={(e) => setPlanDateISO(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={() => void refetch()}
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{String((error as Error).message)}</p>
      )}

      {isLoading && !plan ? (
        <div className="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      ) : null}

      {!isLoading && !plan && !error ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nothing to preview yet.</p>
      ) : null}

      {plan ? (
        <div className="space-y-4">
          {predictionBlock}

          {plan.existingBlocks.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Already scheduled <strong>{plan.existingBlocks.length}</strong>{' '}
              {plan.existingBlocks.length === 1 ? 'block' : 'blocks'} on this day. Committing clears
              and rebuilds deterministic plans; AI merges only that date via model output.
            </div>
          ) : null}

          <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Recommended tasks
            </h2>
            <SuggestionsList
              suggestions={plan.suggestions}
              orderedIds={orderedIds}
              capacityPoints={plan.prediction.predictedCapacityPoints}
              selectedIds={selectedIds}
              onToggleTask={handleToggleTask}
              onReorder={(next) => setOrderedIds(next)}
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy || selectedIds.size === 0}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={submitDeterministic}
              >
                Generate plan
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-purple-600 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-400 dark:text-purple-200 dark:hover:bg-purple-950/40"
                onClick={submitWithLlm}
              >
                Generate with AI
              </button>
            </div>
          </section>

          {committedDay?.blocks?.length ? (
            <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Planned blocks ({committedDay.blocks.length})
              </h2>
              <div className="space-y-2">
                {committedDay.blocks.map((b) => (
                  <PlannerBlockCard key={b.id} block={b} />
                ))}
              </div>
              <Link
                to={ROUTES.admin.plannerWeek}
                className="text-xs font-medium text-emerald-800 underline dark:text-emerald-300"
              >
                Drag &amp; finely tune on week board →
              </Link>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
