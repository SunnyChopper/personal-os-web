import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { FormInput, formFieldClassName } from '@/components/atoms/FormInput';
import { NumberScale } from '@/components/atoms/NumberScale';
import { RecoveryMetricLinkControl } from '@/components/molecules/fitness/RecoveryMetricLinkControl';
import {
  useFitnessRecoveryRange,
  useRecoveryMetricLinks,
  useSetRecoveryMetricLinksMutation,
  useUpsertRecoveryMutation,
} from '@/hooks/useFitness';
import { useMetrics } from '@/hooks/useGrowthSystem';
import { useToast } from '@/hooks/use-toast';
import { addCalendarDays, localCalendarDate } from '@/lib/date/local-calendar';
import { cn } from '@/lib/utils';
import type { DailyRecovery, RecoveryLinkableField, RecoveryMetricLinks } from '@/types/fitness';
import { Textarea } from '@/components/atoms/Textarea';

function formatRecoveryDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type ScaleField =
  | 'sleepQuality'
  | 'energyLevel'
  | 'restingHeartRate'
  | 'sorenessLevel'
  | 'stressLevel';

type RecoveryFormState = {
  sleepHours: string;
  sleepQuality: number | null;
  energyLevel: number | null;
  restingHeartRate: number | null;
  sorenessLevel: number | null;
  stressLevel: number | null;
  bodyWeight: string;
  notes: string;
};

const EMPTY_FORM: RecoveryFormState = {
  sleepHours: '',
  sleepQuality: null,
  energyLevel: null,
  restingHeartRate: null,
  sorenessLevel: null,
  stressLevel: null,
  bodyWeight: '',
  notes: '',
};

function formFromRecovery(row: DailyRecovery): RecoveryFormState {
  return {
    sleepHours: row.sleepHours != null ? String(row.sleepHours) : '',
    sleepQuality: row.sleepQuality,
    energyLevel: row.energyLevel,
    restingHeartRate: row.restingHeartRate,
    sorenessLevel: row.sorenessLevel,
    stressLevel: row.stressLevel,
    bodyWeight: row.bodyWeight != null ? String(row.bodyWeight) : '',
    notes: row.notes ?? '',
  };
}

function isFieldLinked(links: RecoveryMetricLinks, field: RecoveryLinkableField): boolean {
  return Boolean(links[field]);
}

export function DailyRecoveryCard() {
  const today = localCalendarDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<RecoveryFormState>(EMPTY_FORM);
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  const { showToast, ToastContainer } = useToast();
  const { data: recoveryRes, isLoading } = useFitnessRecoveryRange(selectedDate, selectedDate);
  const { data: linksRes } = useRecoveryMetricLinks();
  const { metrics } = useMetrics();
  const upsert = useUpsertRecoveryMutation();
  const setLinks = useSetRecoveryMetricLinksMutation();

  const recoveryPage = recoveryRes?.success && recoveryRes.data ? recoveryRes.data : undefined;
  const existing = recoveryPage?.data?.[0];
  const isToday = selectedDate === today;
  const canGoForward = selectedDate < today;

  const linkConfig: RecoveryMetricLinks = useMemo(() => {
    const fromApi =
      linksRes?.success && linksRes.data?.links ? (linksRes.data.links as RecoveryMetricLinks) : {};
    const fromRecovery = existing?.linkedFields ?? {};
    return { ...fromApi, ...fromRecovery };
  }, [linksRes, existing?.linkedFields]);

  useEffect(() => {
    if (existing) {
      setForm(formFromRecovery(existing));
    } else if (!isLoading) {
      setForm(EMPTY_FORM);
    }
  }, [existing, isLoading, selectedDate]);

  useEffect(() => {
    if (!saveSucceeded) return;
    const t = window.setTimeout(() => setSaveSucceeded(false), 2000);
    return () => window.clearTimeout(t);
  }, [saveSucceeded]);

  const setScale = (field: ScaleField, value: number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveRecovery = async () => {
    const body: Record<string, unknown> = {};
    if (!isFieldLinked(linkConfig, 'sleepHours') && form.sleepHours !== '') {
      body.sleepHours = Number(form.sleepHours);
    }
    if (!isFieldLinked(linkConfig, 'sleepQuality') && form.sleepQuality != null) {
      body.sleepQuality = form.sleepQuality;
    }
    if (!isFieldLinked(linkConfig, 'energyLevel') && form.energyLevel != null) {
      body.energyLevel = form.energyLevel;
    }
    if (!isFieldLinked(linkConfig, 'restingHeartRate') && form.restingHeartRate != null) {
      body.restingHeartRate = form.restingHeartRate;
    }
    if (!isFieldLinked(linkConfig, 'sorenessLevel') && form.sorenessLevel != null) {
      body.sorenessLevel = form.sorenessLevel;
    }
    if (!isFieldLinked(linkConfig, 'stressLevel') && form.stressLevel != null) {
      body.stressLevel = form.stressLevel;
    }
    if (!isFieldLinked(linkConfig, 'bodyWeight') && form.bodyWeight !== '') {
      body.bodyWeight = Number(form.bodyWeight);
    }
    if (form.notes !== '') body.notes = form.notes;

    try {
      await upsert.mutateAsync({ date: selectedDate, body });
      setSaveSucceeded(true);
      showToast({
        type: 'success',
        title: 'Recovery saved',
        message: isToday ? "Today's check-in is updated." : `Saved for ${selectedDate}.`,
        duration: 3000,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Could not save recovery',
        message: 'Try again in a moment.',
      });
    }
  };

  const linkField = async (field: RecoveryLinkableField, metricId: string) => {
    try {
      await setLinks.mutateAsync({ [field]: metricId });
      showToast({
        type: 'success',
        title: 'Metric linked',
        message: 'Value will be read from your Growth metric on each day.',
        duration: 3000,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Could not link metric',
        message: 'Check the metric still exists and try again.',
      });
      throw new Error('link failed');
    }
  };

  const unlinkField = async (field: RecoveryLinkableField) => {
    try {
      await setLinks.mutateAsync({ [field]: null });
      showToast({
        type: 'success',
        title: 'Metric unlinked',
        message: 'You can enter this field manually again.',
        duration: 3000,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Could not unlink metric',
        message: 'Try again in a moment.',
      });
      throw new Error('unlink failed');
    }
  };

  const hasAnyValue =
    isFieldLinked(linkConfig, 'sleepHours') ||
    form.sleepHours !== '' ||
    isFieldLinked(linkConfig, 'sleepQuality') ||
    form.sleepQuality != null ||
    isFieldLinked(linkConfig, 'energyLevel') ||
    form.energyLevel != null ||
    isFieldLinked(linkConfig, 'restingHeartRate') ||
    form.restingHeartRate != null ||
    isFieldLinked(linkConfig, 'sorenessLevel') ||
    form.sorenessLevel != null ||
    isFieldLinked(linkConfig, 'stressLevel') ||
    form.stressLevel != null ||
    isFieldLinked(linkConfig, 'bodyWeight') ||
    form.bodyWeight !== '' ||
    form.notes.trim() !== '';

  const renderLinkedValue = (field: RecoveryLinkableField, display: string) => (
    <div className="mt-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">
      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{display}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Read from Growth metric — log the metric to update this day.
      </p>
      <div className="mt-2">
        <RecoveryMetricLinkControl
          field={field}
          linkedMetricId={linkConfig[field]}
          metrics={metrics}
          onLink={(id) => linkField(field, id)}
          onUnlink={() => unlinkField(field)}
          disabled={setLinks.isPending}
        />
      </div>
    </div>
  );

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isToday ? "Today's recovery" : 'Recovery check-in'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Saved to DailyRecovery for Aura and analytics. Link fields to Growth metrics to read
              values automatically.
            </p>
          </div>

          <div className="flex items-center gap-1 self-start rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-950/60">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setSelectedDate((d) => addCalendarDays(d, -1))}
              className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[10rem] px-2 text-center text-sm font-medium text-gray-900 dark:text-white">
              {formatRecoveryDateLabel(selectedDate)}
            </span>
            <button
              type="button"
              aria-label="Next day"
              disabled={!canGoForward}
              onClick={() => canGoForward && setSelectedDate((d) => addCalendarDays(d, 1))}
              className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-gray-900 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isToday && (
          <button
            type="button"
            onClick={() => setSelectedDate(today)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Jump to today
          </button>
        )}

        {isLoading ? (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Loading recovery…</p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Sleep hours</span>
              {isFieldLinked(linkConfig, 'sleepHours') ? (
                renderLinkedValue(
                  'sleepHours',
                  existing?.sleepHours != null ? String(existing.sleepHours) : '—'
                )
              ) : (
                <>
                  <FormInput
                    type="number"
                    step="0.25"
                    min={0}
                    max={24}
                    className="mt-1.5 w-full max-w-xs"
                    value={form.sleepHours}
                    onChange={(e) => setForm((p) => ({ ...p, sleepHours: e.target.value }))}
                    placeholder="e.g. 7.5"
                    disabled={upsert.isPending}
                  />
                  <div className="mt-2">
                    <RecoveryMetricLinkControl
                      field="sleepHours"
                      linkedMetricId={linkConfig.sleepHours}
                      metrics={metrics}
                      onLink={(id) => linkField('sleepHours', id)}
                      onUnlink={() => unlinkField('sleepHours')}
                      disabled={setLinks.isPending}
                    />
                  </div>
                </>
              )}
            </div>

            <fieldset className="space-y-2" disabled={isFieldLinked(linkConfig, 'sleepQuality')}>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sleep quality
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">(1–10)</span>
              </legend>
              {isFieldLinked(linkConfig, 'sleepQuality') ? (
                renderLinkedValue(
                  'sleepQuality',
                  existing?.sleepQuality != null ? String(existing.sleepQuality) : '—'
                )
              ) : (
                <>
                  <NumberScale
                    min={1}
                    max={10}
                    value={form.sleepQuality}
                    onChange={(v) => setScale('sleepQuality', v)}
                    aria-label="Sleep quality from 1 to 10"
                    disabled={upsert.isPending}
                  />
                  <RecoveryMetricLinkControl
                    field="sleepQuality"
                    linkedMetricId={linkConfig.sleepQuality}
                    metrics={metrics}
                    onLink={(id) => linkField('sleepQuality', id)}
                    onUnlink={() => unlinkField('sleepQuality')}
                    disabled={setLinks.isPending}
                  />
                </>
              )}
            </fieldset>

            <fieldset className="space-y-2" disabled={isFieldLinked(linkConfig, 'energyLevel')}>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Energy
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">(1–10)</span>
              </legend>
              {isFieldLinked(linkConfig, 'energyLevel') ? (
                renderLinkedValue(
                  'energyLevel',
                  existing?.energyLevel != null ? String(existing.energyLevel) : '—'
                )
              ) : (
                <>
                  <NumberScale
                    min={1}
                    max={10}
                    value={form.energyLevel}
                    onChange={(v) => setScale('energyLevel', v)}
                    aria-label="Energy level from 1 to 10"
                    disabled={upsert.isPending}
                  />
                  <RecoveryMetricLinkControl
                    field="energyLevel"
                    linkedMetricId={linkConfig.energyLevel}
                    metrics={metrics}
                    onLink={(id) => linkField('energyLevel', id)}
                    onUnlink={() => unlinkField('energyLevel')}
                    disabled={setLinks.isPending}
                  />
                </>
              )}
            </fieldset>

            <div className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Resting heart rate</span>
              <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">(bpm)</span>
              {isFieldLinked(linkConfig, 'restingHeartRate') ? (
                renderLinkedValue(
                  'restingHeartRate',
                  existing?.restingHeartRate != null ? String(existing.restingHeartRate) : '—'
                )
              ) : (
                <>
                  <FormInput
                    type="number"
                    min={30}
                    max={220}
                    className="mt-1.5 w-full max-w-xs"
                    value={form.restingHeartRate != null ? String(form.restingHeartRate) : ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        restingHeartRate: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="e.g. 58"
                    disabled={upsert.isPending}
                  />
                  <div className="mt-2">
                    <RecoveryMetricLinkControl
                      field="restingHeartRate"
                      linkedMetricId={linkConfig.restingHeartRate}
                      metrics={metrics}
                      onLink={(id) => linkField('restingHeartRate', id)}
                      onUnlink={() => unlinkField('restingHeartRate')}
                      disabled={setLinks.isPending}
                    />
                  </div>
                </>
              )}
            </div>

            <fieldset className="space-y-2" disabled={isFieldLinked(linkConfig, 'sorenessLevel')}>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Soreness
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">(1–10)</span>
              </legend>
              {isFieldLinked(linkConfig, 'sorenessLevel') ? (
                renderLinkedValue(
                  'sorenessLevel',
                  existing?.sorenessLevel != null ? String(existing.sorenessLevel) : '—'
                )
              ) : (
                <>
                  <NumberScale
                    min={1}
                    max={10}
                    value={form.sorenessLevel}
                    onChange={(v) => setScale('sorenessLevel', v)}
                    aria-label="Soreness level from 1 to 10"
                    disabled={upsert.isPending}
                  />
                  <RecoveryMetricLinkControl
                    field="sorenessLevel"
                    linkedMetricId={linkConfig.sorenessLevel}
                    metrics={metrics}
                    onLink={(id) => linkField('sorenessLevel', id)}
                    onUnlink={() => unlinkField('sorenessLevel')}
                    disabled={setLinks.isPending}
                  />
                </>
              )}
            </fieldset>

            <fieldset className="space-y-2" disabled={isFieldLinked(linkConfig, 'stressLevel')}>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stress
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">(1–10)</span>
              </legend>
              {isFieldLinked(linkConfig, 'stressLevel') ? (
                renderLinkedValue(
                  'stressLevel',
                  existing?.stressLevel != null ? String(existing.stressLevel) : '—'
                )
              ) : (
                <>
                  <NumberScale
                    min={1}
                    max={10}
                    value={form.stressLevel}
                    onChange={(v) => setScale('stressLevel', v)}
                    aria-label="Stress level from 1 to 10"
                    disabled={upsert.isPending}
                  />
                  <RecoveryMetricLinkControl
                    field="stressLevel"
                    linkedMetricId={linkConfig.stressLevel}
                    metrics={metrics}
                    onLink={(id) => linkField('stressLevel', id)}
                    onUnlink={() => unlinkField('stressLevel')}
                    disabled={setLinks.isPending}
                  />
                </>
              )}
            </fieldset>

            <div className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Body weight</span>
              {isFieldLinked(linkConfig, 'bodyWeight') ? (
                renderLinkedValue(
                  'bodyWeight',
                  existing?.bodyWeight != null ? String(existing.bodyWeight) : '—'
                )
              ) : (
                <>
                  <FormInput
                    type="number"
                    step="0.1"
                    min={0}
                    className="mt-1.5 w-full max-w-xs"
                    value={form.bodyWeight}
                    onChange={(e) => setForm((p) => ({ ...p, bodyWeight: e.target.value }))}
                    placeholder="e.g. 175"
                    disabled={upsert.isPending}
                  />
                  <div className="mt-2">
                    <RecoveryMetricLinkControl
                      field="bodyWeight"
                      linkedMetricId={linkConfig.bodyWeight}
                      metrics={metrics}
                      onLink={(id) => linkField('bodyWeight', id)}
                      onUnlink={() => unlinkField('bodyWeight')}
                      disabled={setLinks.isPending}
                    />
                  </div>
                </>
              )}
            </div>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Notes</span>
              <Textarea
                className={cn(formFieldClassName, 'mt-1.5 w-full resize-y')}
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional — how you slept, stress, soreness…"
                disabled={upsert.isPending}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveRecovery}
                disabled={upsert.isPending || !hasAnyValue}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
                  saveSucceeded
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {upsert.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : saveSucceeded ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Saved
                  </>
                ) : (
                  'Save recovery'
                )}
              </button>
              {!hasAnyValue && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Add at least one field to save.
                </span>
              )}
            </div>

            {existing?.recoveryScore != null && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recovery score:{' '}
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {existing.recoveryScore.toFixed(0)}
                </span>
              </p>
            )}
          </div>
        )}
      </section>
      <ToastContainer />
    </>
  );
}
