import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ShieldAlert, Zap } from 'lucide-react';

import { DowHistoryStrip } from '@/components/organisms/planner/DowHistoryStrip';
import { PlannerBlockCard } from '@/components/organisms/planner/PlannerBlockCard';
import { PredictionCard } from '@/components/organisms/planner/PredictionCard';
import { SuggestionsList } from '@/components/organisms/planner/SuggestionsList';
import {
  useCommitPlanDay,
  usePlanDay,
  usePlannerKillSwitch,
  usePlannerRolloverDecision,
} from '@/hooks/usePlanner';
import { mondayISOForDate } from '@/lib/planner/week';
import { useToast } from '@/hooks/use-toast';
import { addDaysISO, todayISOLocal } from '@/lib/planner/week';
import type { PlannerDay, PlannerRolloverAction } from '@/types/planner';

import { RolloverTaskCard } from './RolloverTaskCard';

function formatPrettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export interface PlannerDayFocusPanelProps {
  focusDateISO: string;
  onFocusDateChange: (iso: string) => void;
  onCommitted?: () => void;
}

export function PlannerDayFocusPanel({
  focusDateISO,
  onFocusDateChange,
  onCommitted,
}: PlannerDayFocusPanelProps) {
  const today = todayISOLocal();
  const tomorrow = useMemo(() => addDaysISO(today, 1), [today]);

  const { data: plan, isLoading, error, refetch } = usePlanDay(focusDateISO);
  const weekStart = mondayISOForDate(focusDateISO);
  const commit = useCommitPlanDay(focusDateISO);
  const killSwitch = usePlannerKillSwitch(weekStart, focusDateISO);
  const rollover = usePlannerRolloverDecision(weekStart, focusDateISO);
  const { showToast, ToastContainer } = useToast();

  const KILL_SWITCH_CONFIRM =
    "Drowning? Let's fix it. This will drop all non-essential items back to your backlog.";

  const [rolloverPendingId, setRolloverPendingId] = useState<string | null>(null);
  const [rolloverPendingAction, setRolloverPendingAction] = useState<PlannerRolloverAction | null>(
    null
  );

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [committedDay, setCommittedDay] = useState<PlannerDay | null>(null);

  useEffect(() => {
    if (!plan) return;
    const ids = plan.suggestions.map((s) => s.taskId);
    setOrderedIds(ids);
    setSelectedIds(new Set(ids));
    setCommittedDay(null);
  }, [plan, focusDateISO]);

  const busy = commit.isPending || killSwitch.isPending;

  const selectedStoryPoints = useMemo(() => {
    if (!plan) return 0;
    const byId = new Map(plan.suggestions.map((s) => [s.taskId, s.storyPoints]));
    return orderedIds.reduce((sum, id) => sum + (selectedIds.has(id) ? (byId.get(id) ?? 0) : 0), 0);
  }, [plan, orderedIds, selectedIds]);

  const dayBlocked = Boolean(
    plan?.prediction.isBlocked || (plan?.prediction.predictedCapacityPoints ?? 0) <= 0
  );
  const capacityPoints = plan?.prediction.predictedCapacityPoints ?? 0;
  const overCapacity =
    !dayBlocked && capacityPoints > 0 && selectedStoryPoints > capacityPoints + 1e-6;

  const handleToggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleCommitSuccess = (week: { days: PlannerDay[] }, message: string) => {
    const row = week.days.find((day) => day.date === focusDateISO);
    setCommittedDay(row ?? null);
    onCommitted?.();
    showToast({ type: 'success', title: 'Plan scheduled', message });
  };

  const handleKillSwitch = () => {
    if (!confirm(KILL_SWITCH_CONFIRM)) return;
    killSwitch.mutate(undefined, {
      onSuccess: (result) => {
        const row = result.week.days.find((day) => day.date === focusDateISO);
        setCommittedDay(row ?? null);
        setSelectedIds(new Set());
        setOrderedIds([]);
        onCommitted?.();
        const moved = result.movedToBacklogCount;
        showToast({
          type: 'success',
          title: 'Kill switch applied',
          message:
            moved === 0
              ? `Nothing left to de-scope on ${formatPrettyDate(focusDateISO)}.`
              : `Moved ${moved} task${moved === 1 ? '' : 's'} to backlog; kept ${result.protectedTaskIds.length} essential.`,
        });
      },
      onError: (e) =>
        showToast({
          type: 'error',
          title: 'Kill switch failed',
          message: e instanceof Error ? e.message : 'Unknown error',
        }),
    });
  };

  const submitDeterministic = () => {
    if (dayBlocked) {
      showToast({
        type: 'error',
        title: 'Day unavailable',
        message: 'This date is blocked (Out of Office / Trip).',
      });
      return;
    }
    if (overCapacity) {
      showToast({
        type: 'error',
        title: 'Over capacity',
        message: 'Remove a task to stay within today’s capacity.',
      });
      return;
    }
    const taskIds = orderedIds.filter((id) => selectedIds.has(id));
    commit.mutate(
      { taskIds, useLlm: false },
      {
        onSuccess: (week) =>
          handleCommitSuccess(
            week,
            `${taskIds.length} task${taskIds.length === 1 ? '' : 's'} on ${formatPrettyDate(focusDateISO)}`
          ),
        onError: (e) =>
          showToast({
            type: 'error',
            title: 'Plan failed',
            message: e instanceof Error ? e.message : 'Unknown error',
          }),
      }
    );
  };

  const dateChipClass = (active: boolean) =>
    active
      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
      : 'bg-white/5 text-gray-300 hover:bg-white/10 dark:bg-gray-800/60 dark:text-gray-300';

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/80 to-gray-950/90 p-4 shadow-xl backdrop-blur-sm">
      <ToastContainer />

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">Plan a day</h2>
          <p className="text-xs text-gray-400">
            Fibonacci story-point throughput for{' '}
            <strong className="text-gray-200">{formatPrettyDate(focusDateISO)}</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${dateChipClass(focusDateISO === today)}`}
          onClick={() => onFocusDateChange(today)}
        >
          Today
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${dateChipClass(focusDateISO === tomorrow)}`}
          onClick={() => onFocusDateChange(tomorrow)}
        >
          Tomorrow
        </button>
        <input
          aria-label="Plan date"
          type="date"
          className="rounded-lg border border-white/10 bg-gray-900/60 px-2 py-1.5 text-xs text-gray-200"
          value={focusDateISO}
          onChange={(e) => onFocusDateChange(e.target.value)}
        />
        <button
          type="button"
          className="ml-auto text-xs font-medium text-blue-400 hover:text-blue-300"
          onClick={() => void refetch()}
        >
          Refresh
        </button>
        <button
          type="button"
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleKillSwitch}
          aria-label="Kill Switch — de-scope non-essential tasks for this day"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Kill Switch
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{String((error as Error).message)}</p> : null}

      {isLoading && !plan ? <div className="h-32 animate-pulse rounded-xl bg-white/5" /> : null}

      {plan ? (
        <div className="space-y-3">
          {(plan.rolloverTasks?.length ?? 0) > 0 ? (
            <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                Rolled over ({plan.rolloverTasks!.length})
              </h3>
              <div className="space-y-2">
                {plan.rolloverTasks!.map((r) => (
                  <RolloverTaskCard
                    key={r.rolloverId}
                    task={r}
                    disabled={rollover.isPending}
                    pendingAction={
                      rolloverPendingId === r.rolloverId ? rolloverPendingAction : null
                    }
                    onAction={(id, action) => {
                      setRolloverPendingId(id);
                      setRolloverPendingAction(action);
                      rollover.mutate(
                        { rolloverId: id, action },
                        {
                          onSuccess: () =>
                            showToast({
                              type: 'success',
                              title: action === 'keep' ? 'Kept for today' : 'Moved to backlog',
                              message: r.title,
                            }),
                          onError: (e) =>
                            showToast({
                              type: 'error',
                              title: 'Rollover action failed',
                              message: e instanceof Error ? e.message : 'Unknown error',
                            }),
                          onSettled: () => {
                            setRolloverPendingId(null);
                            setRolloverPendingAction(null);
                          },
                        }
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <PredictionCard prediction={plan.prediction} />
          <DowHistoryStrip
            history={plan.prediction.dayOfWeekHistory}
            activeDayOfWeek={plan.prediction.dayOfWeek}
          />

          {plan.existingBlocks.length > 0 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {plan.existingBlocks.length} block{plan.existingBlocks.length === 1 ? '' : 's'}{' '}
              already on this day. Committing rebuilds deterministic plans for the date.
            </p>
          ) : null}

          <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Recommended tasks
            </h3>
            {dayBlocked ? (
              <p className="text-xs text-slate-400">
                No task recommendations while this day is marked unavailable.
              </p>
            ) : (
              <SuggestionsList
                suggestions={plan.suggestions}
                orderedIds={orderedIds}
                capacityPoints={plan.prediction.predictedCapacityPoints}
                selectedIds={selectedIds}
                onToggleTask={handleToggleTask}
                onReorder={(next) => setOrderedIds(next)}
              />
            )}
            {overCapacity ? (
              <p className="text-xs text-amber-300">
                Remove a task to stay within today’s capacity.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy || dayBlocked || selectedIds.size === 0 || overCapacity}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={submitDeterministic}
              >
                <Zap className="h-3.5 w-3.5" />
                Generate plan
              </button>
            </div>
          </div>

          {committedDay?.blocks?.length ? (
            <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <h3 className="text-xs font-semibold text-emerald-300">
                Planned blocks ({committedDay.blocks.length})
              </h3>
              <div className="space-y-2">
                {committedDay.blocks.map((b) => (
                  <PlannerBlockCard key={b.id} block={b} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !plan && !error ? (
        <p className="text-sm text-gray-500">Nothing to preview yet.</p>
      ) : null}
    </section>
  );
}
