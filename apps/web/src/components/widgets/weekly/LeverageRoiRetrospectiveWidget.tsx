import { useId, useState } from 'react';
import { AlertTriangle, HelpCircle, Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  LeverageRoiQuadrantBlock,
  LeverageRoiQuadrantKey,
  WeeklyReviewLeverageRoiResponse,
} from '@/types/growth-system';

const ROI_FORMULA_TOOLTIP =
  'Power-law efficiency ratio:\nROI = PlannerScore ÷ EnergyWeight\n\nEnergyWeight: Admin = 1, Low Kinetic = 2, Deep Work = 3 (untagged defaults to 2).';

const QUADRANT_DISPLAY: Record<LeverageRoiQuadrantKey, { title: string; subtitle: string }> = {
  coreWins: {
    title: 'Quick Wins',
    subtitle: 'High leverage / low energy',
  },
  strategicInvestments: {
    title: 'Deep Focus Investments',
    subtitle: 'High leverage / high energy',
  },
  necessaryFriction: {
    title: 'Routine Maintenance',
    subtitle: 'Low leverage / low energy',
  },
  bikesheddingTrap: {
    title: 'The Bikeshedding Trap',
    subtitle: 'Low leverage / high energy',
  },
};

const QUADRANT_STYLES: Record<
  LeverageRoiQuadrantKey,
  { border: string; header: string; badge?: string }
> = {
  coreWins: {
    border: 'border-emerald-200 dark:border-emerald-800/60',
    header: 'text-emerald-800 dark:text-emerald-200',
    badge: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200',
  },
  strategicInvestments: {
    border: 'border-blue-200 dark:border-blue-800/60',
    header: 'text-blue-800 dark:text-blue-200',
    badge: 'bg-blue-600/15 text-blue-800 dark:text-blue-200',
  },
  necessaryFriction: {
    border: 'border-slate-200 dark:border-slate-700',
    header: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  },
  bikesheddingTrap: {
    border: 'border-amber-400 dark:border-amber-600/80',
    header: 'text-amber-900 dark:text-amber-100',
    badge: 'bg-amber-500/20 text-amber-950 dark:text-amber-100',
  },
};

function formatShortDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RoiFormulaTooltip() {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((prev) => !prev)}
        className="rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-gray-300"
        aria-label="How leverage ROI is calculated"
        aria-expanded={showTooltip}
        aria-describedby={showTooltip ? tooltipId : undefined}
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
      </button>
      {showTooltip ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute right-0 z-20 mt-2 w-64 max-w-[min(16rem,90vw)] rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-white shadow-lg dark:bg-gray-700 sm:left-0 sm:right-auto"
        >
          <p className="font-medium">ROI formula</p>
          <p className="mt-1 whitespace-pre-line text-gray-200">{ROI_FORMULA_TOOLTIP}</p>
        </div>
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  trap,
}: {
  task: LeverageRoiQuadrantBlock['tasks'][number];
  trap: boolean;
}) {
  return (
    <li
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        trap
          ? 'border-amber-300/90 bg-amber-50/80 dark:border-amber-700/60 dark:bg-amber-950/30'
          : 'border-gray-200/80 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/40'
      )}
    >
      <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
        ROI {task.roi.toFixed(2)} · score {task.plannerScore.toFixed(1)} ·{' '}
        {task.energyLevel ?? 'Untagged'} (×{task.energyWeight}) ·{' '}
        {formatShortDate(task.completedDate)}
      </p>
      {task.reason ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{task.reason}</p>
      ) : null}
    </li>
  );
}

function QuadrantCard({ block }: { block: LeverageRoiQuadrantBlock }) {
  const styles = QUADRANT_STYLES[block.key];
  const display = QUADRANT_DISPLAY[block.key];
  const trap = block.key === 'bikesheddingTrap';

  return (
    <div
      className={cn(
        'flex min-h-[140px] flex-col rounded-xl border-2 p-4',
        styles.border,
        trap && 'ring-2 ring-amber-400/60 dark:ring-amber-500/40'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={cn('text-sm font-semibold', styles.header)}>
            {trap ? (
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle
                  className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                {display.title}
              </span>
            ) : (
              display.title
            )}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{display.subtitle}</p>
          {trap ? (
            <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
              High cognitive energy spent on low-leverage work.
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            styles.badge
          )}
        >
          {block.tasks.length}
        </span>
      </div>
      {block.tasks.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-500">No tasks in this quadrant.</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {block.tasks.map((t) => (
            <TaskRow key={t.taskId} task={t} trap={trap} />
          ))}
        </ul>
      )}
    </div>
  );
}

export interface LeverageRoiRetrospectiveWidgetProps {
  data?: WeeklyReviewLeverageRoiResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  muted?: boolean;
  className?: string;
}

export function LeverageRoiRetrospectiveWidget({
  data,
  isLoading,
  isError,
  errorMessage,
  muted,
  className,
}: LeverageRoiRetrospectiveWidgetProps) {
  return (
    <section
      className={cn(
        'w-full rounded-xl border border-gray-200 p-6 dark:border-gray-700',
        muted ? 'opacity-90' : 'bg-white dark:bg-gray-800',
        className
      )}
      aria-labelledby="leverage-roi-matrix-heading"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="leverage-roi-matrix-heading"
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
            >
              <TrendingUp className="h-5 w-5 text-violet-500 dark:text-violet-400" aria-hidden />
              Leverage ROI Matrix
            </h2>
            <RoiFormulaTooltip />
          </div>
          {data ? (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {data.periodStart} → {data.periodEnd} ({data.days} days)
            </p>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          aria-busy="true"
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading leverage ROI matrix…
        </div>
      ) : null}

      {isError && !isLoading ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage ?? 'Could not load leverage ROI data.'}
        </p>
      ) : null}

      {data && !isLoading && !isError ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.summary.headline}</p>

          {data.dataQuality.untaggedEnergyCount > 0 ? (
            <div
              className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100"
              role="status"
            >
              {data.dataQuality.untaggedEnergyCount} of {data.dataQuality.totalCompleted} completed
              tasks lack an energy tag — ROI uses a default weight until you tag them in Tasks or
              Planner.
            </div>
          ) : null}

          {data.dataQuality.totalCompleted === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete tasks with energy levels set to see how leverage and cognitive load align.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.quadrants.map((block) => (
                <QuadrantCard key={block.key} block={block} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
