import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { AutoScheduleActionBar } from '@/components/organisms/planner/AutoScheduleActionBar';
import { PlannerBacklogPanel } from '@/components/organisms/planner/PlannerBacklogPanel';
import { PlannerCalendarOverlay } from '@/components/organisms/planner/PlannerCalendarOverlay';
import { PlannerOneThingPanel } from '@/components/organisms/planner/PlannerOneThingPanel';
import { PlannerWeekBoard } from '@/components/organisms/planner/PlannerWeekBoard';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import {
  usePatchPlannerBlock,
  usePlannerAutoSchedule,
  usePlannerGenerate,
  usePlannerWeek,
} from '@/hooks/usePlanner';
import { addDaysISO, mondayISO } from '@/lib/planner/week';
import { ROUTES } from '@/routes';

export default function PlannerWeekPage() {
  const [weekStart, setWeekStart] = useState(() => mondayISO(new Date()));
  const { data: week, isLoading, error, refetch } = usePlannerWeek(weekStart);
  const generate = usePlannerGenerate(weekStart);
  const auto = usePlannerAutoSchedule(weekStart);
  const patch = usePatchPlannerBlock(weekStart);
  const { tasks } = useGrowthSystemDashboard();

  const scheduledTaskIds = useMemo(() => {
    const ids = new Set<string>();
    week?.days.forEach((d) => d.blocks.forEach((b) => b.taskId && ids.add(b.taskId)));
    return ids;
  }, [week]);

  const busy = generate.isPending || auto.isPending || patch.isPending;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 p-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
        Prefer focusing one day?
        <Link className="ml-2 font-semibold underline underline-offset-2" to={ROUTES.admin.planner}>
          Open Plan Tomorrow hub
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Planner · Week board
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Week of {weekStart} {week?.timeZone ? `· ${week.timeZone}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 p-2 dark:border-gray-600"
            onClick={() => setWeekStart((ws) => addDaysISO(ws, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-200 p-2 dark:border-gray-600"
            onClick={() => setWeekStart(mondayISO(new Date()))}
          >
            This week
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-200 p-2 dark:border-gray-600"
            onClick={() => setWeekStart((ws) => addDaysISO(ws, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <PlannerOneThingPanel onSaved={() => void refetch()} />

      <div className="flex flex-wrap items-center gap-3">
        <AutoScheduleActionBar
          isBusy={busy}
          onGenerate={(withLlm) => generate.mutate(withLlm)}
          onAutoSchedule={() => auto.mutate()}
        />
        <button
          type="button"
          className="text-sm text-blue-600 dark:text-blue-400"
          onClick={() => refetch()}
        >
          Refresh
        </button>
      </div>

      {week?.velocity && (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 md:grid-cols-4 dark:text-gray-300">
          <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
            <div className="text-gray-500">Daily capacity (pts)</div>
            <div className="font-semibold">{week.velocity.dailyCapacityStoryPoints}</div>
          </div>
          <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
            <div className="text-gray-500">Trailing weekly avg</div>
            <div className="font-semibold">{week.velocity.trailingWeeklyAverageStoryPoints}</div>
          </div>
          <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
            <div className="text-gray-500">Burn rate</div>
            <div className="font-semibold">{week.velocity.dailyBurnRate}</div>
          </div>
          <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
            <div className="text-gray-500">Confidence</div>
            <div className="font-semibold">{week.velocity.confidence}</div>
          </div>
        </div>
      )}

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">
          Failed to load planner: {(error as Error).message}
        </div>
      ) : null}

      {isLoading && !week ? (
        <div className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      ) : null}

      {week ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
          <PlannerWeekBoard week={week} onMoveBlock={(args) => patch.mutate({ ...args })} />
          <div className="space-y-3">
            <PlannerBacklogPanel tasks={tasks} scheduledTaskIds={scheduledTaskIds} />
            <PlannerCalendarOverlay />
          </div>
        </div>
      ) : null}
    </div>
  );
}
