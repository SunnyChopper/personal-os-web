import { useMemo, useState } from 'react';
import { CronExpressionParser } from 'cron-parser/dist/CronExpressionParser.js';
import Button from '@/components/atoms/Button';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { PageContainer } from '@/components/templates/PageContainer';
import {
  cronControlsFromExpression,
  cronFromPreset,
  describeCron,
  type CronFieldMode,
  type CronQuickPreset,
} from '@/lib/tools/cron-builder';
import { cn } from '@/lib/utils';
import { cronToolsService } from '@/services/tools/cron.service';

const cronFieldClass = cn(formFieldClassName, 'mt-1 w-full font-mono text-xs');

/** Build standard 5-field cron from simplified per-field controls (minute + hour presets). */
function buildCron(parts: {
  minute: CronFieldMode;
  minuteN: string;
  hour: CronFieldMode;
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
  const [minute, setMinute] = useState<CronFieldMode>('every');
  const [minuteN, setMinuteN] = useState('*/15');
  const [hour, setHour] = useState<CronFieldMode>('every');
  const [hourN, setHourN] = useState('9');
  const [dom, setDom] = useState('*');
  const [month, setMonth] = useState('*');
  const [dow, setDow] = useState('1-5');
  const [english, setEnglish] = useState('');
  const [englishError, setEnglishError] = useState<string | null>(null);
  const [englishLoading, setEnglishLoading] = useState(false);

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

  const applyExpression = (expr: string) => {
    const fields = cronControlsFromExpression(expr);
    if (!fields) {
      setEnglishError('That expression is not a 5-field cron.');
      return;
    }
    setMinute(fields.minute);
    setMinuteN(fields.minuteN);
    setHour(fields.hour);
    setHourN(fields.hourN);
    setDom(fields.dom);
    setMonth(fields.month);
    setDow(fields.dow);
    setEnglishError(null);
  };

  const applyPreset = (p: CronQuickPreset) => {
    applyExpression(cronFromPreset(p));
  };

  const buildFromEnglish = async () => {
    const text = english.trim();
    if (!text || englishLoading) return;
    setEnglishLoading(true);
    setEnglishError(null);
    try {
      const { expression: next } = await cronToolsService.fromEnglish(text);
      applyExpression(next);
    } catch (e) {
      setEnglishError(e instanceof Error ? e.message : 'Could not build a cron expression');
    } finally {
      setEnglishLoading(false);
    }
  };

  return (
    <PageContainer width="narrow" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cron Builder</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Describe a schedule in English, or tune the fields. The expression updates live.
        </p>
      </div>

      <form
        className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
        onSubmit={(e) => {
          e.preventDefault();
          void buildFromEnglish();
        }}
      >
        <label className="block text-xs text-gray-500 dark:text-gray-400" htmlFor="cron-english">
          Describe a schedule
        </label>
        <Textarea
          id="cron-english"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="Every 15 minutes on weekdays"
          rows={2}
        />
        <Button type="submit" size="sm" disabled={englishLoading || !english.trim()}>
          {englishLoading ? 'Building…' : 'Build cron'}
        </Button>
        {englishError ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {englishError}
          </p>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        {(['every-minute', 'hourly', 'daily-midnight', 'weekdays-9'] as const).map((p) => (
          <button
            key={p}
            type="button"
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            onClick={() => applyPreset(p)}
          >
            {p.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">Minute</span>
          <Select
            className="mt-1"
            value={minute}
            onChange={(e) => setMinute(e.target.value as CronFieldMode)}
          >
            <option value="every">Every (*)</option>
            <option value="n">Custom</option>
          </Select>
          {minute === 'n' && (
            <input
              className={cronFieldClass}
              value={minuteN}
              onChange={(e) => setMinuteN(e.target.value)}
              placeholder="*/15 or 0"
            />
          )}
        </label>
        <label className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">Hour</span>
          <Select
            className="mt-1"
            value={hour}
            onChange={(e) => setHour(e.target.value as CronFieldMode)}
          >
            <option value="every">Every (*)</option>
            <option value="n">Custom</option>
          </Select>
          {hour === 'n' && (
            <input
              className={cronFieldClass}
              value={hourN}
              onChange={(e) => setHourN(e.target.value)}
              placeholder="9 or 9-17"
            />
          )}
        </label>
        <label className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">Day of month</span>
          <input className={cronFieldClass} value={dom} onChange={(e) => setDom(e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">Month</span>
          <input
            className={cronFieldClass}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Day of week</span>
          <input
            className={cronFieldClass}
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
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">
          Next 5 fire times (local)
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
          {nextFive.ok
            ? nextFive.dates.map((d) => <li key={d.toISOString()}>{d.toLocaleString()}</li>)
            : nextFive.error}
        </ul>
      </div>
    </PageContainer>
  );
}
