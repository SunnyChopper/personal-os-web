import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CronExpressionParser } from 'cron-parser/dist/CronExpressionParser.js';
import { ROUTES } from '@/routes';
import {
  cronFromPreset,
  describeCron,
  type CronQuickPreset,
} from '@/lib/tools/cron-builder';

type FieldMode = 'every' | 'n';

/** Build standard 5-field cron from simplified per-field controls (minute + hour presets). */
function buildCron(parts: {
  minute: FieldMode;
  minuteN: string;
  hour: FieldMode;
  hourN: string;
  dom: string;
  month: string;
  dow: string;
}): string {
  const min = parts.minute === 'every' ? '*' : parts.minuteN || '0';
  const hr = parts.hour === 'every' ? '*' : parts.hourN || '0';
  return `${min} ${hr} ${parts.dom} ${parts.month} ${parts.dow}`;
}

export default function CronBuilderPage() {
  const navigate = useNavigate();
  const [minute, setMinute] = useState<FieldMode>('every');
  const [minuteN, setMinuteN] = useState('*/15');
  const [hour, setHour] = useState<FieldMode>('every');
  const [hourN, setHourN] = useState('9');
  const [dom, setDom] = useState('*');
  const [month, setMonth] = useState('*');
  const [dow, setDow] = useState('1-5');

  const expression = useMemo(
    () => buildCron({ minute, minuteN, hour, hourN, dom, month, dow }),
    [minute, minuteN, hour, hourN, dom, month, dow]
  );

  const human = useMemo(() => describeCron(expression), [expression]);
  const nextFive = useMemo(() => {
    try {
      const it = CronExpressionParser.parse(expression);
      const out: Date[] = [];
      for (let i = 0; i < 5; i++) {
        out.push(it.next().toDate());
      }
      return { ok: true as const, dates: out };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : 'Invalid cron' };
    }
  }, [expression]);

  const applyPreset = (p: CronQuickPreset) => {
    const expr = cronFromPreset(p);
    try {
      const parts = expr.split(/\s+/);
      if (parts.length === 5) {
        setMinute(parts[0].includes('*') ? 'every' : 'n');
        setMinuteN(parts[0]);
        setHour(parts[1].includes('*') ? 'every' : 'n');
        setHourN(parts[1]);
        setDom(parts[2]);
        setMonth(parts[3]);
        setDow(parts[4]);
      }
    } catch {
      /* keep UI */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cron Builder</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tune fields below — expression updates live. Everything runs in your browser (no network).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['every-minute', 'hourly', 'daily-midnight', 'weekdays-9'] as const).map((p) => (
          <button
            key={p}
            type="button"
            className="rounded border border-gray-300 px-3 py-1 text-xs dark:border-gray-600"
            onClick={() => applyPreset(p)}
          >
            {p.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-gray-500">Minute</span>
          <select
            className="mt-1 w-full rounded border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-950"
            value={minute}
            onChange={(e) => setMinute(e.target.value as FieldMode)}
          >
            <option value="every">Every (*)</option>
            <option value="n">Custom</option>
          </select>
          {minute === 'n' && (
            <input
              className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600"
              value={minuteN}
              onChange={(e) => setMinuteN(e.target.value)}
              placeholder="*/15 or 0"
            />
          )}
        </label>
        <label className="text-xs">
          <span className="text-gray-500">Hour</span>
          <select
            className="mt-1 w-full rounded border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-950"
            value={hour}
            onChange={(e) => setHour(e.target.value as FieldMode)}
          >
            <option value="every">Every (*)</option>
            <option value="n">Custom</option>
          </select>
          {hour === 'n' && (
            <input
              className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600"
              value={hourN}
              onChange={(e) => setHourN(e.target.value)}
              placeholder="9 or 9-17"
            />
          )}
        </label>
        <label className="text-xs">
          Day of month
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600"
            value={dom}
            onChange={(e) => setDom(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Month
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Day of week
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs dark:border-gray-600"
            value={dow}
            onChange={(e) => setDow(e.target.value)}
            placeholder="0-6 or 1-5"
          />
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm dark:border-gray-700 dark:bg-gray-950">
        {expression}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        {human.ok ? human.human : human.error}
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Next 5 fire times (local)</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
          {nextFive.ok
            ? nextFive.dates.map((d) => (
                <li key={d.toISOString()}>{d.toLocaleString()}</li>
              ))
            : nextFive.error}
        </ul>
      </div>

      <button
        type="button"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        onClick={() => {
          try {
            sessionStorage.setItem('tools.pendingCron', expression);
          } catch {
            /* ignore */
          }
          navigate(`${ROUTES.admin.tools.base}/workflows`);
        }}
      >
        Use in workflow
      </button>
    </div>
  );
}
