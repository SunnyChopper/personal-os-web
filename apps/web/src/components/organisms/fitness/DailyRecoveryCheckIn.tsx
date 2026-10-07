import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { FormInput } from '@/components/atoms/FormInput';
import { RecoveryScoreRing } from '@/components/atoms/RecoveryScoreRing';
import { ScaleSelector } from '@/components/molecules/ScaleSelector';
import { EmptyState } from '@/components/molecules/EmptyState';
import { RecoveryDateNavigator } from '@/components/molecules/fitness/RecoveryDateNavigator';
import { RecoveryEmptyFormShell } from '@/components/molecules/fitness/RecoveryEmptyFormShell';
import { RecoveryMetricLinkControl } from '@/components/molecules/fitness/RecoveryMetricLinkControl';
import {
  useFitnessRecoveryRange,
  useRecoveryMetricLinks,
  useSetRecoveryMetricLinksMutation,
  useUpsertRecoveryMutation,
} from '@/hooks/useFitness';
import { useMetrics } from '@/hooks/useGrowthSystem';
import { useToast } from '@/hooks/use-toast';
import { localCalendarDate, addCalendarDays } from '@/lib/date/local-calendar';
import { focusFirstIncompleteControl } from '@/lib/forms/focusFirstIncompleteControl';
import { cn } from '@/lib/utils';
import {
  fitnessSectionClassName,
  fitnessSectionPaddingClassName,
} from '@/lib/fitness/fitness-surfaces';
import { computeRecoveryScore } from '@/lib/fitness/compute-recovery-score';
import type { DailyRecovery, RecoveryLinkableField, RecoveryMetricLinks } from '@/types/fitness';
import { Textarea } from '@/components/atoms/Textarea';

function formatRecoveryEmptyStateDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function recoveryEmptyStateTitle(isoDate: string, isToday: boolean): string {
  if (isToday) return "Log today's recovery in <30 s";
  return `Log recovery for ${formatRecoveryEmptyStateDate(isoDate)} in <30 s`;
}

const SCALE_FOCUS_LABELS: { field: RecoveryLinkableField; label: string }[] = [
  { field: 'sleepQuality', label: 'Sleep quality from 1 to 10' },
  { field: 'energyLevel', label: 'Energy level from 1 to 10' },
  { field: 'sorenessLevel', label: 'Soreness level from 1 to 10' },
  { field: 'stressLevel', label: 'Stress level from 1 to 10' },
];

const recoveryFieldLabelClassName = 'text-xs font-normal text-gray-500 dark:text-gray-400';

const recoveryClusterLegendClassName = 'text-xs font-medium text-gray-600 dark:text-gray-400';

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

function recoveryRowHasContent(row: DailyRecovery): boolean {
  return (
    row.sleepHours != null ||
    row.sleepQuality != null ||
    row.energyLevel != null ||
    row.restingHeartRate != null ||
    row.sorenessLevel != null ||
    row.stressLevel != null ||
    row.bodyWeight != null ||
    Boolean(row.notes?.trim()) ||
    (row.metricResolvedFields?.length ?? 0) > 0
  );
}

function recoveryDayIsEmpty(row: DailyRecovery | undefined): boolean {
  return !row || (row.isPersisted === false && !recoveryRowHasContent(row));
}

function isFieldMetricResolved(
  row: DailyRecovery | undefined,
  field: RecoveryLinkableField
): boolean {
  return Boolean(row?.metricResolvedFields?.includes(field));
}

export type DailyRecoveryCheckInProps = {
  /** Called after a successful save (e.g. close host Dialog). */
  onSaveSuccess?: () => void;
  /** When true, omit outer section shell (Dialog host). */
  embedded?: boolean;
  /** Minimal fields for sub-30s check-in (sleep hours, quality, energy). */
  quickMode?: boolean;
  /** Expand from quick mode to the full form. */
  onExpandFullForm?: () => void;
};

export function DailyRecoveryCheckIn({
  onSaveSuccess,
  embedded = false,
  quickMode = false,
  onExpandFullForm,
}: DailyRecoveryCheckInProps) {
  const today = localCalendarDate();
  const yesterdayIso = addCalendarDays(today, -1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<RecoveryFormState>(EMPTY_FORM);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const sleepHoursRef = useRef<HTMLInputElement>(null);
  const restingHeartRateRef = useRef<HTMLInputElement>(null);
  const bodyWeightRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const shouldFocusOnFormEnterRef = useRef(false);
  const startFormAfterDateChangeRef = useRef(false);

  const { showToast } = useToast();
  const shouldReduceMotion = useReducedMotion();
  const { data: recoveryRes, isLoading } = useFitnessRecoveryRange(selectedDate, selectedDate);
  const { data: yesterdayRecoveryRes, isLoading: yesterdayLoading } = useFitnessRecoveryRange(
    yesterdayIso,
    yesterdayIso,
    { enabled: !quickMode }
  );
  const { data: linksRes } = useRecoveryMetricLinks();
  const { metrics } = useMetrics();
  const upsert = useUpsertRecoveryMutation();
  const setLinks = useSetRecoveryMetricLinksMutation();

  const recoveryPage = recoveryRes?.success && recoveryRes.data ? recoveryRes.data : undefined;
  const existing = recoveryPage?.data?.[0];
  const isToday = selectedDate === today;
  const showEmptyState = !quickMode && !isLoading && !formStarted && recoveryDayIsEmpty(existing);

  const yesterdayRecoveryPage =
    yesterdayRecoveryRes?.success && yesterdayRecoveryRes.data
      ? yesterdayRecoveryRes.data
      : undefined;
  const yesterdayRow = yesterdayRecoveryPage?.data?.[0];
  const yesterdayEmpty = recoveryDayIsEmpty(yesterdayRow);
  const showLogYesterdayInstead = showEmptyState && isToday && !yesterdayLoading && yesterdayEmpty;

  const linkConfig: RecoveryMetricLinks = useMemo(() => {
    const fromApi =
      linksRes?.success && linksRes.data?.links ? (linksRes.data.links as RecoveryMetricLinks) : {};
    const fromRecovery = existing?.linkedFields ?? {};
    return { ...fromApi, ...fromRecovery };
  }, [linksRes, existing?.linkedFields]);

  useEffect(() => {
    if (startFormAfterDateChangeRef.current) {
      startFormAfterDateChangeRef.current = false;
      shouldFocusOnFormEnterRef.current = true;
      setFormStarted(true);
      return;
    }
    setFormStarted(false);
  }, [selectedDate]);

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

  const focusFirstRecoveryField = useCallback(() => {
    const canEditField = (field: RecoveryLinkableField) =>
      !isFieldLinked(linkConfig, field) && !isFieldMetricResolved(existing, field);

    const targets: Parameters<typeof focusFirstIncompleteControl>[0] = [];

    if (canEditField('sleepHours')) {
      targets.push({
        id: 'sleepHours',
        isComplete: () => form.sleepHours !== '',
        focus: () => sleepHoursRef.current?.focus(),
      });
    }

    for (const { field, label } of SCALE_FOCUS_LABELS) {
      if (!canEditField(field)) continue;
      const scaleField = field as ScaleField;
      targets.push({
        id: field,
        isComplete: () => form[scaleField] != null,
        focus: () => {
          const group = document.querySelector(`[aria-label="${label}"]`);
          const button = group?.querySelector('button');
          if (button instanceof HTMLButtonElement) {
            button.focus();
          }
        },
      });
    }

    if (canEditField('restingHeartRate')) {
      targets.push({
        id: 'restingHeartRate',
        isComplete: () => form.restingHeartRate != null,
        focus: () => restingHeartRateRef.current?.focus(),
      });
    }

    if (canEditField('bodyWeight')) {
      targets.push({
        id: 'bodyWeight',
        isComplete: () => form.bodyWeight !== '',
        focus: () => bodyWeightRef.current?.focus(),
      });
    }

    targets.push({
      id: 'notes',
      isComplete: () => form.notes.trim() !== '',
      focus: () => notesRef.current?.focus(),
    });

    focusFirstIncompleteControl(targets);
  }, [existing, linkConfig, form]);

  useEffect(() => {
    if (!saveSucceeded) return;
    focusFirstRecoveryField();
  }, [saveSucceeded, focusFirstRecoveryField]);

  const setScale = (field: ScaleField, value: number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveRecovery = async () => {
    const includeField = (field: RecoveryLinkableField): boolean =>
      !isFieldLinked(linkConfig, field) || !isFieldMetricResolved(existing, field);

    const body: Record<string, unknown> = {};
    if (includeField('sleepHours') && form.sleepHours !== '') {
      body.sleepHours = Number(form.sleepHours);
    }
    if (includeField('sleepQuality') && form.sleepQuality != null) {
      body.sleepQuality = form.sleepQuality;
    }
    if (includeField('energyLevel') && form.energyLevel != null) {
      body.energyLevel = form.energyLevel;
    }
    if (includeField('restingHeartRate') && form.restingHeartRate != null) {
      body.restingHeartRate = form.restingHeartRate;
    }
    if (includeField('sorenessLevel') && form.sorenessLevel != null) {
      body.sorenessLevel = form.sorenessLevel;
    }
    if (includeField('stressLevel') && form.stressLevel != null) {
      body.stressLevel = form.stressLevel;
    }
    if (includeField('bodyWeight') && form.bodyWeight !== '') {
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
      onSaveSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Try again in a moment.';
      showToast({
        type: 'error',
        title: 'Could not save recovery',
        message,
        action: {
          label: 'Retry',
          onClick: () => void saveRecovery(),
        },
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
    form.sleepHours !== '' ||
    form.sleepQuality != null ||
    form.energyLevel != null ||
    (!quickMode &&
      (form.restingHeartRate != null ||
        form.sorenessLevel != null ||
        form.stressLevel != null ||
        form.bodyWeight !== '' ||
        form.notes.trim() !== '')) ||
    (existing?.metricResolvedFields?.length ?? 0) > 0;

  const hasQuickValue =
    form.sleepHours !== '' || form.sleepQuality != null || form.energyLevel != null;

  const isEmptyEligible = recoveryDayIsEmpty(existing);

  const handleFormPanelAnimationComplete = () => {
    if (!shouldFocusOnFormEnterRef.current) return;
    shouldFocusOnFormEnterRef.current = false;
    focusFirstRecoveryField();
  };

  const handleFormPanelFocusOut = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    if (hasAnyValue) return;
    if (!isEmptyEligible) return;
    setFormStarted(false);
  };

  const handleStartLogging = () => {
    shouldFocusOnFormEnterRef.current = true;
    setFormStarted(true);
  };

  const handleLogYesterdayInstead = () => {
    startFormAfterDateChangeRef.current = true;
    setSelectedDate(yesterdayIso);
  };

  const showRecoveryForm = !isLoading && !showEmptyState;

  const liveScore = useMemo(() => {
    const parsedSleepHours = form.sleepHours !== '' ? Number(form.sleepHours) : null;
    const sleepHours =
      parsedSleepHours != null && Number.isFinite(parsedSleepHours) ? parsedSleepHours : null;

    return computeRecoveryScore({
      sleepHours,
      sleepQuality: form.sleepQuality,
      energyLevel: form.energyLevel,
      sorenessLevel: form.sorenessLevel,
    });
  }, [form.sleepHours, form.sleepQuality, form.energyLevel, form.sorenessLevel]);

  const fieldInputDisabled = (field: RecoveryLinkableField) =>
    upsert.isPending || isFieldMetricResolved(existing, field);

  const renderFieldLink = (field: RecoveryLinkableField) => (
    <RecoveryMetricLinkControl
      field={field}
      linkedMetricId={linkConfig[field]}
      metrics={metrics}
      onLink={(id) => linkField(field, id)}
      onUnlink={() => unlinkField(field)}
      disabled={setLinks.isPending}
    />
  );

  const headerBlock = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {!embedded && (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isToday ? "Today's recovery" : 'Recovery check-in'}
            </h2>
            {showRecoveryForm && (
              <div className="relative h-7 w-7 shrink-0" aria-live="polite">
                <AnimatePresence initial={false}>
                  {liveScore != null && (
                    <RecoveryScoreRing key="recovery-score" score={liveScore} />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
        {embedded && showRecoveryForm && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live score</span>
            <div className="relative h-7 w-7 shrink-0" aria-live="polite">
              <AnimatePresence initial={false}>
                {liveScore != null && <RecoveryScoreRing key="recovery-score" score={liveScore} />}
              </AnimatePresence>
            </div>
          </div>
        )}
        <p className={cn('text-sm text-gray-500 dark:text-gray-400', !embedded && 'mt-1')}>
          Saved to DailyRecovery for Aura. Link a metric per field when you want auto-fill.
        </p>
      </div>

      <RecoveryDateNavigator value={selectedDate} onChange={setSelectedDate} maxDate={today} />
    </div>
  );

  const quickFormBody = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Quick check-in — under 30 seconds. Powers Aura and coaching.
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading recovery…</p>
      ) : (
        <>
          <div className="block">
            <span className={recoveryFieldLabelClassName}>Sleep hours</span>
            <FormInput
              ref={sleepHoursRef}
              id="recovery-sleep-hours"
              type="number"
              step="0.25"
              min={0}
              max={24}
              className="mt-1 w-full max-w-xs"
              value={form.sleepHours}
              onChange={(e) => setForm((p) => ({ ...p, sleepHours: e.target.value }))}
              placeholder="e.g. 7.5"
              disabled={fieldInputDisabled('sleepHours')}
            />
          </div>
          <fieldset className="space-y-1">
            <legend className={recoveryFieldLabelClassName}>Sleep quality (1–10)</legend>
            <ScaleSelector
              min={1}
              max={10}
              value={form.sleepQuality}
              onChange={(v) => setScale('sleepQuality', v)}
              aria-label="Sleep quality from 1 to 10"
              disabled={fieldInputDisabled('sleepQuality')}
            />
          </fieldset>
          <fieldset className="space-y-1">
            <legend className={recoveryFieldLabelClassName}>Energy (1–10)</legend>
            <ScaleSelector
              min={1}
              max={10}
              value={form.energyLevel}
              onChange={(v) => setScale('energyLevel', v)}
              aria-label="Energy level from 1 to 10"
              disabled={fieldInputDisabled('energyLevel')}
            />
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveRecovery}
              disabled={upsert.isPending || !hasQuickValue}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
                saveSucceeded ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
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
            {onExpandFullForm ? (
              <button
                type="button"
                onClick={onExpandFullForm}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                More fields
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  const formBody = (
    <>
      {!isToday && (
        <button
          type="button"
          onClick={() => setSelectedDate(today)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Jump to today
        </button>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading recovery…</p>
      ) : (
        <RecoveryEmptyFormShell
          panelKey={showEmptyState ? 'empty' : 'form'}
          shouldReduceMotion={shouldReduceMotion ?? false}
          onFormPanelAnimationComplete={handleFormPanelAnimationComplete}
          onFormPanelFocusOut={handleFormPanelFocusOut}
          formPanelBlurCapture={handleFormPanelFocusOut}
          formPanelRef={formPanelRef}
        >
          {showEmptyState ? (
            <EmptyState
              scene="recoveryCheckIn"
              title={recoveryEmptyStateTitle(selectedDate, isToday)}
              description="Under 30 seconds · powers Aura and coaching"
              actionLabel="Log recovery"
              onAction={handleStartLogging}
              secondaryActionLabel={showLogYesterdayInstead ? 'Log yesterday instead' : undefined}
              onSecondaryAction={showLogYesterdayInstead ? handleLogYesterdayInstead : undefined}
              density="compact"
            />
          ) : (
            <>
              <div className="block">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={recoveryFieldLabelClassName}>Sleep hours</span>
                  {renderFieldLink('sleepHours')}
                </div>
                <FormInput
                  ref={sleepHoursRef}
                  id="recovery-sleep-hours"
                  type="number"
                  step="0.25"
                  min={0}
                  max={24}
                  className="mt-1 w-full max-w-xs"
                  value={form.sleepHours}
                  onChange={(e) => setForm((p) => ({ ...p, sleepHours: e.target.value }))}
                  placeholder="e.g. 7.5"
                  disabled={fieldInputDisabled('sleepHours')}
                />
              </div>

              <fieldset className="space-y-1">
                <legend className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={recoveryFieldLabelClassName}>Sleep quality</span>
                  <span className={recoveryFieldLabelClassName}>(1–10)</span>
                  {renderFieldLink('sleepQuality')}
                </legend>
                <ScaleSelector
                  min={1}
                  max={10}
                  value={form.sleepQuality}
                  onChange={(v) => setScale('sleepQuality', v)}
                  aria-label="Sleep quality from 1 to 10"
                  disabled={fieldInputDisabled('sleepQuality')}
                />
              </fieldset>

              <fieldset className="space-y-3">
                <legend className={recoveryClusterLegendClassName}>Subjective state</legend>

                <fieldset className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={recoveryFieldLabelClassName}>Energy</span>
                    <span className={recoveryFieldLabelClassName}>(1–10)</span>
                    {renderFieldLink('energyLevel')}
                  </div>
                  <ScaleSelector
                    min={1}
                    max={10}
                    value={form.energyLevel}
                    onChange={(v) => setScale('energyLevel', v)}
                    aria-label="Energy level from 1 to 10"
                    disabled={fieldInputDisabled('energyLevel')}
                  />
                </fieldset>

                <fieldset className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={recoveryFieldLabelClassName}>Soreness</span>
                    <span className={recoveryFieldLabelClassName}>(1–10)</span>
                    {renderFieldLink('sorenessLevel')}
                  </div>
                  <ScaleSelector
                    min={1}
                    max={10}
                    value={form.sorenessLevel}
                    onChange={(v) => setScale('sorenessLevel', v)}
                    aria-label="Soreness level from 1 to 10"
                    disabled={fieldInputDisabled('sorenessLevel')}
                  />
                </fieldset>

                <fieldset className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={recoveryFieldLabelClassName}>Stress</span>
                    <span className={recoveryFieldLabelClassName}>(1–10)</span>
                    {renderFieldLink('stressLevel')}
                  </div>
                  <ScaleSelector
                    min={1}
                    max={10}
                    value={form.stressLevel}
                    onChange={(v) => setScale('stressLevel', v)}
                    aria-label="Stress level from 1 to 10"
                    disabled={fieldInputDisabled('stressLevel')}
                  />
                </fieldset>
              </fieldset>

              <div className="block">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={recoveryFieldLabelClassName}>Resting heart rate</span>
                  <span className={recoveryFieldLabelClassName}>(bpm)</span>
                  {renderFieldLink('restingHeartRate')}
                </div>
                <FormInput
                  ref={restingHeartRateRef}
                  id="recovery-resting-heart-rate"
                  type="number"
                  min={30}
                  max={220}
                  className="mt-1 w-full max-w-xs"
                  value={form.restingHeartRate != null ? String(form.restingHeartRate) : ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      restingHeartRate: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="e.g. 58"
                  disabled={fieldInputDisabled('restingHeartRate')}
                />
              </div>

              <div className="block">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={recoveryFieldLabelClassName}>Body weight</span>
                  {renderFieldLink('bodyWeight')}
                </div>
                <FormInput
                  ref={bodyWeightRef}
                  id="recovery-body-weight"
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full max-w-xs"
                  value={form.bodyWeight}
                  onChange={(e) => setForm((p) => ({ ...p, bodyWeight: e.target.value }))}
                  placeholder="e.g. 175"
                  disabled={fieldInputDisabled('bodyWeight')}
                />
              </div>

              <label className="block">
                <span className={recoveryFieldLabelClassName}>Notes</span>
                <Textarea
                  ref={notesRef}
                  id="recovery-notes"
                  className="mt-1 w-full resize-y"
                  rows={2}
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
                      Saved to DailyRecovery
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
            </>
          )}
        </RecoveryEmptyFormShell>
      )}
    </>
  );

  const inner = (
    <div className="space-y-4">
      {!quickMode ? headerBlock : null}
      {quickMode ? quickFormBody : formBody}
    </div>
  );

  return (
    <>
      {embedded ? (
        inner
      ) : (
        <section className={cn(fitnessSectionClassName, fitnessSectionPaddingClassName)}>
          {inner}
        </section>
      )}
    </>
  );
}
