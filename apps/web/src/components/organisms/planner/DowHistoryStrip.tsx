import type { DayOfWeekStat } from '@/types/planner';

const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface DowHistoryStripProps {
  history: DayOfWeekStat[];
  activeDayOfWeek: number;
}

export function DowHistoryStrip({ history, activeDayOfWeek }: DowHistoryStripProps) {
  const maxAcross = Math.max(...history.map((h) => h.averagePoints), 1e-6);

  const rows = LABELS.map((label, idx) => {
    const row = history.find((h) => h.dayOfWeek === idx);
    const h = Math.min(100, row ? Math.round((row.averagePoints / maxAcross) * 100) : 0);
    return { label, row, height: Math.max(h, 6), samples: row?.samples ?? 0 };
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Weekday history (story points avg)
      </p>
      <div className="flex items-end gap-2">
        {rows.map(({ label, row, height, samples }, idx) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="group relative flex h-20 w-full items-end justify-center">
              <div
                role="presentation"
                className={`w-full rounded-t transition-colors group-hover:bg-blue-600 ${
                  idx === activeDayOfWeek
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-500 dark:group-hover:bg-blue-500'
                }`}
                style={{ height: `${height}%`, minHeight: 6 }}
              />
              <div className="pointer-events-none invisible absolute bottom-full mb-2 w-32 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-800 shadow-lg group-hover:visible dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <div className="font-semibold">{label}</div>
                <div>Avg {row?.averagePoints.toFixed(1) ?? 0} pts</div>
                <div>Med {row?.medianPoints.toFixed(1) ?? 0} pts</div>
                <div>Samples {samples}</div>
              </div>
            </div>
            <span
              className={`text-[10px] uppercase ${
                idx === activeDayOfWeek
                  ? 'font-bold text-blue-600 dark:text-blue-400'
                  : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
