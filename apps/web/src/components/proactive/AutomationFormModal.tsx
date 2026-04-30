import { useEffect, useMemo, useRef, useState } from 'react';
import { detectBrowserTimeZone } from '@/lib/iana-time-zones';
import { AssistantRunConfigPickerForm } from '@/components/assistant/AssistantRunConfigPickerForm';
import {
  modelPickerDraftFromRunConfig,
  runConfigFromModelPickerDraft,
  type ModelPickerDraft,
} from '@/lib/assistant/run-config-picker-draft';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { parseProactiveAssistantRunConfigFromUnknown } from '@/lib/proactive/assistant-run-config';
import type {
  ProactiveAssistantRunConfig,
  ProactiveAutomation,
  ProactiveAutomationKind,
  ProactiveThreadStrategy,
} from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

const KINDS: ProactiveAutomationKind[] = [
  'dailyBriefing',
  'logbookEvening',
  'custom',
  'dailyLearningTrends',
  'dailyLearningTheory',
];

const KIND_LABELS: Record<ProactiveAutomationKind, string> = {
  dailyBriefing: 'Daily Briefing',
  logbookEvening: 'Logbook Evening',
  custom: 'Custom',
  dailyLearningTrends: 'Daily Learning — Trends',
  dailyLearningTheory: 'Daily Learning — Theory',
};

/** Monday = 0 … Sunday = 6 (API). */
const WEEKDAY_OPTS: { value: number; label: string }[] = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

export interface AutomationFormDefaults {
  kind: ProactiveAutomationKind;
  localTime: string;
  timeZone: string;
  customUserPrompt: string;
  threadStrategy: ProactiveThreadStrategy;
  channelEmailEnabled: boolean;
  title: string;
  /** Selected weekday indices; empty means every day (omit `daysOfWeek` on save). */
  daysOfWeek: number[];
  assistantRunConfig: ProactiveAssistantRunConfig | null;
}

function readKindFromPayload(payload: Record<string, unknown>): ProactiveAutomationKind {
  const k = payload.kind;
  if (k === 'dailyBriefing' || k === 'logbookEvening' || k === 'custom') return k;
  return 'custom';
}

function readDaysFromPayload(payload: Record<string, unknown>): number[] {
  const raw = payload.daysOfWeek ?? payload.daysofWeek;
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const x of raw) {
    if (typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 6) {
      out.push(x);
      continue;
    }
    const n = Number.parseInt(String(x), 10);
    if (Number.isInteger(n) && n >= 0 && n <= 6) out.push(n);
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

function buildDefaults(
  mode: 'create' | 'edit' | 'suggestion' | 'rejectedSuggestion',
  initialAutomation: ProactiveAutomation | null,
  suggestionPayload: Record<string, unknown> | null,
  defaultTimeZone: string
): AutomationFormDefaults {
  if (mode === 'edit' && initialAutomation) {
    return {
      kind: initialAutomation.kind,
      localTime: initialAutomation.localTime,
      timeZone: initialAutomation.timeZone,
      customUserPrompt: initialAutomation.customUserPrompt ?? '',
      threadStrategy: initialAutomation.threadStrategy,
      channelEmailEnabled: initialAutomation.channelEmailEnabled,
      title: (initialAutomation.title ?? '').trim(),
      daysOfWeek: [...(initialAutomation.daysOfWeek ?? [])].filter(
        (d) => Number.isInteger(d) && d >= 0 && d <= 6
      ),
      assistantRunConfig: initialAutomation.assistantRunConfig ?? null,
    };
  }
  if ((mode === 'suggestion' || mode === 'rejectedSuggestion') && suggestionPayload) {
    const k = readKindFromPayload(suggestionPayload);
    const lt =
      typeof suggestionPayload.localTime === 'string' ? suggestionPayload.localTime : '08:00';
    const tz =
      typeof suggestionPayload.timeZone === 'string' ? suggestionPayload.timeZone : defaultTimeZone;
    const ts =
      suggestionPayload.threadStrategy === 'newThreadEachRun' ||
      suggestionPayload.threadStrategy === 'reuseFixedThread'
        ? suggestionPayload.threadStrategy
        : 'reuseFixedThread';
    const ce = suggestionPayload.channelEmailEnabled;
    const prompt =
      typeof suggestionPayload.customUserPrompt === 'string'
        ? suggestionPayload.customUserPrompt
        : '';
    const title = typeof suggestionPayload.title === 'string' ? suggestionPayload.title.trim() : '';
    return {
      kind: k,
      localTime: lt,
      timeZone: tz,
      customUserPrompt: prompt,
      threadStrategy: ts,
      channelEmailEnabled: typeof ce === 'boolean' ? ce : true,
      title,
      daysOfWeek: readDaysFromPayload(suggestionPayload),
      assistantRunConfig: parseProactiveAssistantRunConfigFromUnknown(
        suggestionPayload.assistantRunConfig
      ),
    };
  }
  return {
    kind: 'dailyBriefing',
    localTime: '08:00',
    timeZone: defaultTimeZone,
    customUserPrompt: '',
    threadStrategy: 'reuseFixedThread',
    channelEmailEnabled: true,
    title: '',
    daysOfWeek: [],
    assistantRunConfig: null,
  };
}

interface AutomationFormFieldsProps {
  mode: 'create' | 'edit' | 'suggestion' | 'rejectedSuggestion';
  defaults: AutomationFormDefaults;
  zoneOptions: string[];
  modelCatalog: AssistantModelCatalogData | null;
  isModelCatalogLoading: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void | Promise<void>;
}

function AutomationFormFields({
  mode,
  defaults,
  zoneOptions,
  modelCatalog,
  isModelCatalogLoading,
  saving,
  onClose,
  onSubmit,
}: AutomationFormFieldsProps) {
  const [kind, setKind] = useState<ProactiveAutomationKind>(defaults.kind);
  const [localTime, setLocalTime] = useState(defaults.localTime);
  const [timeZone, setTimeZone] = useState(defaults.timeZone);
  const [customUserPrompt, setCustomUserPrompt] = useState(defaults.customUserPrompt);
  const [threadStrategy, setThreadStrategy] = useState<ProactiveThreadStrategy>(
    defaults.threadStrategy
  );
  const [channelEmailEnabled, setChannelEmailEnabled] = useState(defaults.channelEmailEnabled);
  const [title, setTitle] = useState(defaults.title);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(defaults.daysOfWeek);
  const [modelDraft, setModelDraft] = useState<ModelPickerDraft>(() =>
    modelPickerDraftFromRunConfig(defaults.assistantRunConfig, null)
  );

  const catalogReady = Boolean(modelCatalog?.models.length);
  const catalogSyncedRef = useRef(false);
  /* Catalog often loads after first paint; hydrate draft from defaults once per modal open. */
  useEffect(() => {
    if (!catalogReady) {
      catalogSyncedRef.current = false;
      return;
    }
    if (catalogSyncedRef.current) return;
    catalogSyncedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync when async catalog first becomes available
    setModelDraft(modelPickerDraftFromRunConfig(defaults.assistantRunConfig, modelCatalog));
  }, [catalogReady, defaults.assistantRunConfig, modelCatalog]);

  useEffect(() => {
    if (!modelCatalog?.models.length) return;
    const ids = new Set(modelCatalog.models.map((m) => m.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- normalize manual ids against newly loaded catalog
    setModelDraft((d) => {
      if (d.mode !== 'manual') return d;
      let reasoningModelId = d.reasoningModelId;
      let responseModelId = d.responseModelId;
      if (!ids.has(reasoningModelId)) {
        reasoningModelId = modelCatalog.defaults.defaultReasoningModelId;
      }
      if (!ids.has(responseModelId)) {
        responseModelId = modelCatalog.defaults.defaultResponseModelId;
      }
      if (reasoningModelId === d.reasoningModelId && responseModelId === d.responseModelId) {
        return d;
      }
      return { ...d, reasoningModelId, responseModelId };
    });
  }, [modelCatalog]);

  const browserTimeZone = useMemo(() => detectBrowserTimeZone(), []);
  const timeZoneMismatch = timeZone !== browserTimeZone;

  const toggleDay = (d: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      return [...prev, d].sort((a, b) => a - b);
    });
  };

  const handleSubmit = () => {
    const body: Record<string, unknown> = {
      kind,
      localTime,
      timeZone,
      threadStrategy,
      channelEmailEnabled,
    };
    const t = title.trim();
    if (t) body.title = t;
    if (kind === 'custom') {
      body.customUserPrompt = customUserPrompt.trim();
    }
    if (daysOfWeek.length > 0) {
      body.daysOfWeek = daysOfWeek;
    }
    const runCfg = runConfigFromModelPickerDraft(modelDraft, modelCatalog);
    if (runCfg) {
      body.assistantRunConfig = runCfg;
    }
    if (mode === 'create' || mode === 'suggestion' || mode === 'rejectedSuggestion') {
      body.enabled = true;
    }
    void onSubmit(body);
  };

  const primaryLabel = saving
    ? 'Saving…'
    : mode === 'create'
      ? 'Create'
      : mode === 'suggestion'
        ? 'Create automation'
        : mode === 'rejectedSuggestion'
          ? 'Save changes'
          : 'Save changes';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs flex flex-col gap-1 sm:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Title (optional)</span>
          <input
            type="text"
            className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning briefing"
          />
        </label>
        <label className="text-xs flex flex-col gap-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Kind</span>
          <select
            className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
            value={kind}
            onChange={(e) => setKind(e.target.value as ProactiveAutomationKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs flex flex-col gap-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Local time (24h HH:MM)
          </span>
          <input
            type="text"
            className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
            value={localTime}
            onChange={(e) => setLocalTime(e.target.value)}
            placeholder="08:00"
          />
        </label>
        <label className="text-xs flex flex-col gap-1 sm:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Time zone (IANA)</span>
          <select
            className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
          >
            {zoneOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          {timeZoneMismatch ? (
            <p
              role="status"
              className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-200 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5"
            >
              Saved time zone is <strong>{timeZone}</strong>, but this browser reports{' '}
              <strong>{browserTimeZone}</strong>. If the saved IANA zone does not match where you
              live, scheduled runs (including evening logbook) may use the wrong local calendar day.
            </p>
          ) : null}
        </label>
        <div className="text-xs flex flex-col gap-2 sm:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Runs on</span>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Leave all unchecked for every day. Otherwise select specific weekdays (Mon–Sun).
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTS.map(({ value, label }) => (
              <label
                key={value}
                className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-400"
                  checked={daysOfWeek.includes(value)}
                  onChange={() => toggleDay(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {kind === 'custom' ? (
          <label className="text-xs flex flex-col gap-1 sm:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Custom prompt</span>
            <textarea
              className="border rounded-lg px-2 py-2 text-sm min-h-[100px] bg-white dark:bg-gray-900 dark:border-gray-600"
              value={customUserPrompt}
              onChange={(e) => setCustomUserPrompt(e.target.value)}
            />
          </label>
        ) : null}
        <label className="text-xs flex flex-col gap-1 sm:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Thread strategy</span>
          <select
            className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
            value={threadStrategy}
            onChange={(e) => setThreadStrategy(e.target.value as ProactiveThreadStrategy)}
          >
            <option value="reuseFixedThread">Reuse fixed thread</option>
            <option value="newThreadEachRun">New thread each run</option>
          </select>
        </label>
        <div className="text-xs flex flex-col gap-2 sm:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-3">
          <span className="font-medium text-gray-700 dark:text-gray-300">Assistant models</span>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Choose Auto (with an optimize goal) or Manual reasoning/response models for this
            automation&apos;s runs. Omit changes if the catalog is still loading.
          </p>
          <AssistantRunConfigPickerForm
            catalog={modelCatalog}
            isLoading={isModelCatalogLoading}
            draft={modelDraft}
            onDraftChange={(patch) => setModelDraft((d) => ({ ...d, ...patch }))}
            disabled={saving}
            manualHelpText="Manual choices apply when you save this automation."
          />
        </div>
        <label className="text-xs flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            className="rounded border-gray-400"
            checked={channelEmailEnabled}
            onChange={(e) => setChannelEmailEnabled(e.target.checked)}
          />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Send email notifications (when configured)
          </span>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {isModelCatalogLoading && !catalogReady ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-auto">Loading models…</span>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-lg"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="rounded-lg"
          disabled={saving || !catalogReady || (kind === 'custom' && !customUserPrompt.trim())}
          onClick={handleSubmit}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}

export interface AutomationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'suggestion' | 'rejectedSuggestion';
  /** When mode is edit, pass the automation to prefill. */
  initialAutomation: ProactiveAutomation | null;
  /** When mode is suggestion or rejectedSuggestion, pass the API proposedPayload to prefill. */
  suggestionPayload: Record<string, unknown> | null;
  zoneOptions: string[];
  /** Fallback time zone when creating (user preference). */
  defaultTimeZone: string;
  /** Increment when opening the modal so the form remounts with fresh defaults. */
  formKey: number;
  modelCatalog: AssistantModelCatalogData | null;
  isModelCatalogLoading: boolean;
  saving: boolean;
  onSubmit: (body: Record<string, unknown>) => void | Promise<void>;
}

export default function AutomationFormModal({
  isOpen,
  onClose,
  mode,
  initialAutomation,
  suggestionPayload,
  zoneOptions,
  defaultTimeZone,
  formKey,
  modelCatalog,
  isModelCatalogLoading,
  saving,
  onSubmit,
}: AutomationFormModalProps) {
  const defaults = useMemo(
    () => buildDefaults(mode, initialAutomation, suggestionPayload, defaultTimeZone),
    [mode, initialAutomation, suggestionPayload, defaultTimeZone]
  );

  const dialogTitle =
    mode === 'create'
      ? 'New automation'
      : mode === 'suggestion'
        ? 'Review suggestion'
        : mode === 'rejectedSuggestion'
          ? 'Edit suggestion'
          : 'Edit automation';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={dialogTitle} size="lg">
      {isOpen ? (
        <AutomationFormFields
          key={formKey}
          mode={mode}
          defaults={defaults}
          zoneOptions={zoneOptions}
          modelCatalog={modelCatalog}
          isModelCatalogLoading={isModelCatalogLoading}
          saving={saving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}
