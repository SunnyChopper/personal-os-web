import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AuraScatterChart } from '@/components/molecules/AuraScatterChart';
import { useAuraSeries } from '@/hooks/useFitness';
import type { AuraXMetric } from '@/types/fitness';
import { localCalendarDate, addCalendarDays } from '@/lib/date/local-calendar';

type Preset = '7d' | '30d' | '90d' | 'all';

function rangeForPreset(preset: Preset): { start: string; end: string } {
  const end = localCalendarDate();
  if (preset === 'all') {
    return { start: addCalendarDays(end, -730), end };
  }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return { start: addCalendarDays(end, -days), end };
}

const X_OPTIONS: { value: AuraXMetric; label: string }[] = [
  { value: 'sleepHours', label: 'Sleep hours' },
  { value: 'sleepQuality', label: 'Sleep quality' },
  { value: 'energyLevel', label: 'Energy' },
  { value: 'recoveryScore', label: 'Recovery score' },
];

export default function HealthFitnessAuraPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [xMetric, setXMetric] = useState<AuraXMetric>('sleepHours');

  const { start, end } = useMemo(() => rangeForPreset(preset), [preset]);
  const { data, isLoading } = useAuraSeries(start, end, xMetric);

  const series = data?.success ? data.data : null;
  const r = series?.correlationCoefficient;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
          <Sparkles className="h-6 w-6" />
          <span className="text-sm font-medium">Aura</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Recovery × story points
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Joins <strong>DailyRecovery</strong> with completed task story points from Growth System
          (same source as weekly review velocity). Query-time only — no duplicate story-point store.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-300">Range</span>
        {(['7d', '30d', '90d', 'all'] as Preset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`rounded-full px-3 py-1 text-sm ${
              preset === p
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
            }`}
          >
            {p === 'all' ? '2y' : p}
          </button>
        ))}
        <label className="ml-4 text-sm text-gray-600 dark:text-gray-300">
          X axis
          <select
            className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
            value={xMetric}
            onChange={(e) => setXMetric(e.target.value as AuraXMetric)}
          >
            {X_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading series…</p>}

      {series && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Correlation</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Pearson{' '}
              <span className="font-mono font-medium">{r != null ? r.toFixed(3) : 'n/a'}</span> over
              days with both recovery metric and completed points ({series.points.length} points).
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Window {series.startDate} → {series.endDate} · x = {series.xMetric}
            </p>
          </div>
          <AuraScatterChart points={series.points} xMetric={xMetric} />
        </>
      )}
    </div>
  );
}
