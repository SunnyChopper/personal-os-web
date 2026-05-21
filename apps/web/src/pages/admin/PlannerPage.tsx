import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { AutoScheduleActionBar } from '@/components/organisms/planner/AutoScheduleActionBar';
import { PlannerBacklogPanel } from '@/components/organisms/planner/PlannerBacklogPanel';
import { PlannerCalendarOverlay } from '@/components/organisms/planner/PlannerCalendarOverlay';
import { PlannerDayFocusPanel } from '@/components/organisms/planner/PlannerDayFocusPanel';
import { PlannerOneThingPanel } from '@/components/organisms/planner/PlannerOneThingPanel';
import { PlannerWeekBoard } from '@/components/organisms/planner/PlannerWeekBoard';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import {
  usePatchPlannerBlock,
  usePlannerAutoSchedule,
  usePlannerGenerate,
  usePlannerWeek,
} from '@/hooks/usePlanner';
import { addDaysISO, mondayISO, mondayISOForDate, todayISOLocal } from '@/lib/planner/week';

function VelocityStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
      <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

export default function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFocus = addDaysISO(todayISOLocal(), 1);
  const initialFocus = searchParams.get('date') ?? defaultFocus;

  const [focusDateISO, setFocusDateISO] = useState(initialFocus);
  const [weekStart, setWeekStart] = useState(() => mondayISOForDate(initialFocus));

  const { data: week, isLoading, error, refetch } = usePlannerWeek(weekStart);
  const generate = usePlannerGenerate(weekStart);
  const auto = usePlannerAutoSchedule(weekStart);
  const patch = usePatchPlannerBlock(weekStart);
  const { tasks } = useGrowthSystemDashboard();

  const syncFocusDate = useCallback(
    (iso: string) => {
      setFocusDateISO(iso);
      setWeekStart(mondayISOForDate(iso));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('date', iso);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const fromUrl = searchParams.get('date');
    if (fromUrl) {
      setFocusDateISO(fromUrl);
      setWeekStart(mondayISOForDate(fromUrl));
    }
  }, [searchParams]);

  const scheduledTaskIds = useMemo(() => {
    const ids = new Set<string>();
    week?.days.forEach((d) => d.blocks.forEach((b) => b.taskId && ids.add(b.taskId)));
    return ids;
  }, [week]);

  const busy = generate.isPending || auto.isPending || patch.isPending;

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 p-4 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-400 ring-1 ring-white/10">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Planner</h1>
            <p className="text-sm text-gray-400">
              Week of {weekStart}
              {week?.timeZone ? ` · ${week.timeZone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
            onClick={() => setWeekStart((ws) => addDaysISO(ws, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:bg-white/10"
            onClick={() => {
              const mon = mondayISO(new Date());
              setWeekStart(mon);
              syncFocusDate(addDaysISO(todayISOLocal(), 1));
            }}
          >
            This week
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
            onClick={() => setWeekStart((ws) => addDaysISO(ws, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <PlannerOneThingPanel onSaved={() => void refetch()} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AutoScheduleActionBar
          isBusy={busy}
          onGenerate={(withLlm) => generate.mutate(withLlm)}
          onAutoSchedule={() => auto.mutate()}
        />
        <button
          type="button"
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
          onClick={() => void refetch()}
        >
          Refresh week
        </button>
      </div>

      {week?.velocity ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <VelocityStat
            label="Daily capacity"
            value={`${week.velocity.dailyCapacityStoryPoints} pts`}
          />
          <VelocityStat
            label="Trailing weekly avg"
            value={`${week.velocity.trailingWeeklyAverageStoryPoints} pts`}
          />
          <VelocityStat label="Burn rate" value={week.velocity.dailyBurnRate} />
          <VelocityStat label="Confidence" value={week.velocity.confidence} />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          Failed to load planner: {(error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Week board
            </h2>
            <p className="text-xs text-gray-500">Click a day to focus planning</p>
          </div>

          {isLoading && !week ? (
            <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          ) : null}

          {week ? (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/50 to-gray-950/80 p-3 shadow-inner">
              <PlannerWeekBoard
                week={week}
                focusDate={focusDateISO}
                onSelectDay={syncFocusDate}
                onMoveBlock={(args) => patch.mutate({ ...args })}
              />
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <PlannerDayFocusPanel
            focusDateISO={focusDateISO}
            onFocusDateChange={syncFocusDate}
            onCommitted={() => void refetch()}
          />
          <PlannerBacklogPanel tasks={tasks} scheduledTaskIds={scheduledTaskIds} />
          <PlannerCalendarOverlay />
        </aside>
      </div>
    </div>
  );
}
