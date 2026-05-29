import { useMemo, useState } from 'react';
import { CalendarDays, AlertTriangle } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput, formFieldClassName } from '@/components/atoms/FormInput';
import {
  useWorkoutSchedule,
  useScheduledWorkoutDays,
  usePendingWorkoutSkips,
  useUpsertWorkoutScheduleMutation,
  usePatchScheduledWorkoutDayMutation,
  useSubmitWorkoutSkipReasonMutation,
  useFitnessTemplates,
  defaultWeekdayEntries,
  WEEKDAY_LABELS,
} from '@/hooks/useFitness';
import { localCalendarDate, addCalendarDays } from '@/lib/date/local-calendar';
import { cn } from '@/lib/utils';
import type {
  ScheduleDayType,
  ScheduledWorkoutDay,
  WorkoutScheduleWeekdayEntry,
  WorkoutTemplate,
} from '@/types/fitness';

const selectClassName = cn(formFieldClassName, 'block w-full min-w-0');

function statusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    skip_pending: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
    skip_penalized: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    skip_excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    excused_off: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    rest: 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400',
  };
  return map[status] ?? map.scheduled;
}

export default function WorkoutSchedulePanel() {
  const today = localCalendarDate();
  const weekStart = addCalendarDays(today, -((new Date(`${today}T12:00:00`).getDay() + 6) % 7));
  const weekEnd = addCalendarDays(weekStart, 6);

  const { data: scheduleRes, isLoading: scheduleLoad } = useWorkoutSchedule();
  const { data: daysRes } = useScheduledWorkoutDays(weekStart, weekEnd);
  const { data: skipsRes } = usePendingWorkoutSkips();
  const { data: tplRes } = useFitnessTemplates(1, 50);

  const schedule = scheduleRes?.success ? scheduleRes.data : null;
  const templates: WorkoutTemplate[] = tplRes?.success ? (tplRes.data?.data ?? []) : [];
  const weekDays: ScheduledWorkoutDay[] = daysRes?.success ? (daysRes.data?.days ?? []) : [];
  const pendingSkips: ScheduledWorkoutDay[] = skipsRes?.success ? (skipsRes.data?.days ?? []) : [];

  const upsertSchedule = useUpsertWorkoutScheduleMutation();
  const patchDay = usePatchScheduledWorkoutDayMutation();
  const submitSkip = useSubmitWorkoutSkipReasonMutation();

  const [baselineDraft, setBaselineDraft] = useState<WorkoutScheduleWeekdayEntry[] | null>(null);
  const [penaltyMin, setPenaltyMin] = useState(25);
  const [penaltyMax, setPenaltyMax] = useState(100);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [overrideType, setOverrideType] = useState<ScheduleDayType>('day_off');
  const [overrideReason, setOverrideReason] = useState('');
  const [skipDate, setSkipDate] = useState<string | null>(null);
  const [skipReasonText, setSkipReasonText] = useState('');
  const [lastVerdict, setLastVerdict] = useState<string | null>(null);

  const effectiveBaseline = useMemo(() => {
    if (baselineDraft) return baselineDraft;
    if (schedule?.weekdays?.length) return schedule.weekdays;
    return defaultWeekdayEntries();
  }, [baselineDraft, schedule]);

  const tplById = useMemo(() => {
    const m = new Map<string, WorkoutTemplate>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  const saveBaseline = async () => {
    await upsertSchedule.mutateAsync({
      weekdays: effectiveBaseline,
      penaltyMin,
      penaltyMax,
      isActive: true,
    });
    setBaselineDraft(null);
  };

  const setWeekday = (weekday: number, patch: Partial<WorkoutScheduleWeekdayEntry>) => {
    setBaselineDraft(
      effectiveBaseline.map((e) => (e.weekday === weekday ? { ...e, ...patch } : e))
    );
  };

  const applyDateOverride = async () => {
    if (!selectedDate) return;
    await patchDay.mutateAsync({
      date: selectedDate,
      body: {
        dayType: overrideType,
        plannedReason: overrideType === 'day_off' ? overrideReason || undefined : undefined,
        templateId:
          overrideType === 'workout'
            ? (effectiveBaseline.find((e) => e.weekday === weekdayFromDate(selectedDate))
                ?.templateId ?? undefined)
            : undefined,
      },
    });
    setSelectedDate(null);
    setOverrideReason('');
  };

  const submitSkipReason = async () => {
    if (!skipDate || !skipReasonText.trim()) return;
    const res = await submitSkip.mutateAsync({ date: skipDate, reason: skipReasonText.trim() });
    if (res.success && res.data) {
      setLastVerdict(
        `${res.data.verdict}: ${res.data.rationale} (${res.data.pointsDeducted} pts deducted)`
      );
    }
    setSkipDate(null);
    setSkipReasonText('');
  };

  if (scheduleLoad) {
    return <p className="text-sm text-gray-500">Loading workout schedule…</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Workout schedule & accountability
        </h2>
      </div>

      {pendingSkips.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Pending skips ({pendingSkips.length})</span>
          </div>
          <ul className="space-y-1 text-sm">
            {pendingSkips.map((d) => (
              <li key={d.date} className="flex flex-wrap items-center gap-2">
                <span>{d.date}</span>
                {d.reasonDueBy ? (
                  <span className="text-xs text-amber-800 dark:text-amber-300">
                    due by {new Date(d.reasonDueBy).toLocaleString()}
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSkipDate(d.date)}
                >
                  Explain skip
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {skipDate ? (
        <div className="space-y-2 rounded border border-gray-200 p-3 dark:border-gray-600">
          <p className="text-sm font-medium">Skip reason for {skipDate}</p>
          <textarea
            className={cn(formFieldClassName, 'min-h-[80px] w-full')}
            value={skipReasonText}
            onChange={(e) => setSkipReasonText(e.target.value)}
            placeholder="Why did you miss this workout?"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={submitSkipReason}
              disabled={submitSkip.isPending || !skipReasonText.trim()}
            >
              Submit for AI review
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSkipDate(null)}>
              Cancel
            </Button>
          </div>
          {lastVerdict ? (
            <p className="text-xs text-gray-600 dark:text-gray-400">{lastVerdict}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Weekly pattern (baseline)
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const entry = effectiveBaseline.find((e) => e.weekday === weekday)!;
            return (
              <div key={label} className="rounded border border-gray-100 p-2 dark:border-gray-700">
                <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
                <select
                  className={cn(selectClassName, 'mt-1 text-sm')}
                  value={entry.dayType}
                  onChange={(e) =>
                    setWeekday(weekday, { dayType: e.target.value as ScheduleDayType })
                  }
                >
                  <option value="rest">Rest</option>
                  <option value="workout">Workout</option>
                </select>
                {entry.dayType === 'workout' ? (
                  <select
                    className={cn(selectClassName, 'mt-1 text-sm')}
                    value={entry.templateId ?? ''}
                    onChange={(e) =>
                      setWeekday(weekday, {
                        templateId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">No template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Penalty min
            <FormInput
              type="number"
              className="mt-1 w-24"
              value={penaltyMin}
              onChange={(e) => setPenaltyMin(Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Penalty max
            <FormInput
              type="number"
              className="mt-1 w-24"
              value={penaltyMax}
              onChange={(e) => setPenaltyMax(Number(e.target.value))}
            />
          </label>
          <Button
            type="button"
            size="sm"
            onClick={saveBaseline}
            disabled={upsertSchedule.isPending}
          >
            {schedule ? 'Update schedule' : 'Create schedule'}
          </Button>
        </div>
      </div>

      {schedule ? (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            This week ({weekStart} – {weekEnd})
          </h3>
          <ul className="space-y-1">
            {weekDays.map((d) => (
              <li
                key={d.date}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-100 px-2 py-1.5 text-sm dark:border-gray-700"
              >
                <span>
                  {d.date}{' '}
                  <span className="text-gray-500">
                    ({d.dayType}
                    {d.templateId && tplById.get(d.templateId)
                      ? ` · ${tplById.get(d.templateId)!.name}`
                      : ''}
                    )
                  </span>
                </span>
                <span
                  className={cn('rounded px-2 py-0.5 text-xs font-medium', statusBadge(d.status))}
                >
                  {d.status.replace(/_/g, ' ')}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedDate(d.date);
                    setOverrideType('day_off');
                  }}
                >
                  Take day off
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Save a weekly pattern to enable schedule tracking and skip accountability.
        </p>
      )}

      {selectedDate ? (
        <div className="space-y-2 rounded border border-gray-200 p-3 dark:border-gray-600">
          <p className="text-sm font-medium">Override {selectedDate}</p>
          <select
            className={selectClassName}
            value={overrideType}
            onChange={(e) => setOverrideType(e.target.value as ScheduleDayType)}
          >
            <option value="day_off">Day off (excused)</option>
            <option value="rest">Rest</option>
            <option value="workout">Workout</option>
          </select>
          {overrideType === 'day_off' ? (
            <FormInput
              placeholder="Reason (trip, illness, …)"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={applyDateOverride}
              disabled={patchDay.isPending}
            >
              Save override
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedDate(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function weekdayFromDate(isoDate: string): number {
  const d = new Date(`${isoDate}T12:00:00`);
  return (d.getDay() + 6) % 7;
}
