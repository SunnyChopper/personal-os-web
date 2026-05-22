import type { PlanDayPrediction } from '@/types/planner';

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface PredictionCardProps {
  prediction: PlanDayPrediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const blocked = Boolean(prediction.isBlocked || prediction.predictedCapacityPoints <= 0);
  const dow = WEEKDAY_SHORT[prediction.dayOfWeek] ?? '—';
  const histSelf = prediction.dayOfWeekHistory.find((h) => h.dayOfWeek === prediction.dayOfWeek);
  const samples = histSelf?.samples ?? 0;
  const dowAvg = histSelf?.averagePoints ?? 0;

  const confLabel =
    prediction.confidence === 'high'
      ? 'Solid history'
      : prediction.confidence === 'medium'
        ? 'Partial history'
        : 'Estimated default';

  if (blocked) {
    const label = prediction.blockingContexts?.[0]?.label ?? 'Out of Office / Trip';
    return (
      <section className="rounded-xl border border-slate-500/40 bg-slate-900/60 p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Day unavailable
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-200">0 pts capacity</p>
        <p className="mt-2 text-sm text-slate-400">
          {label}. Auto-schedule and plan-day commits are disabled for this date.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Suggested capacity
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            ~{prediction.predictedCapacityPoints.toFixed(1)}
            <span className="text-base font-semibold text-gray-500 dark:text-gray-400"> pts</span>
          </p>
        </div>
        <span
          className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          title={`Model confidence derived from weekday samples vs recent burn rate.`}
        >
          {prediction.confidence} · {confLabel}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        On {dow}s you average about <strong>{dowAvg.toFixed(1)}</strong> story points ({samples}{' '}
        {samples === 1 ? 'sample' : 'samples'}).
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300 md:grid-cols-4">
        <div className="rounded border border-gray-100 px-2 py-1 dark:border-gray-800">
          <dt className="text-gray-500 dark:text-gray-400">Completed today</dt>
          <dd className="font-semibold">{prediction.todayActualPoints.toFixed(1)} pts</dd>
        </div>
        <div className="rounded border border-gray-100 px-2 py-1 dark:border-gray-800">
          <dt className="text-gray-500 dark:text-gray-400">Trailing daily avg</dt>
          <dd className="font-semibold">{prediction.trailingDailyAverage.toFixed(2)} pts</dd>
        </div>
      </dl>
    </section>
  );
}
