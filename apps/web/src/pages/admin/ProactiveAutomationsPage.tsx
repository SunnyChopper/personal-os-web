import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { detectBrowserTimeZone, getIanaTimeZoneOptions } from '@/lib/iana-time-zones';
import type {
  ProactiveAutomation,
  ProactiveAutomationKind,
  ProactiveSuggestion,
} from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';
import AutomationCard from '@/components/proactive/AutomationCard';
import AutomationFormModal from '@/components/proactive/AutomationFormModal';
import AutomationRunHistoryDialog from '@/components/proactive/AutomationRunHistoryDialog';
import ProactiveSuggestionCard from '@/components/proactive/ProactiveSuggestionCard';
import RejectSuggestionDialog from '@/components/proactive/RejectSuggestionDialog';
import UpdateSuggestionFeedbackDialog from '@/components/proactive/UpdateSuggestionFeedbackDialog';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import Dialog from '@/components/molecules/Dialog';
import { ChevronDown, Settings2, Sparkles } from 'lucide-react';
import { BrainstormModelPicker } from '@/components/assistant/BrainstormModelPicker';
import {
  brainstormValueToApiModelField,
  type BrainstormModelPickerValue,
} from '@/lib/assistant/brainstorm-model-picker';
import { chatbotService } from '@/services/chatbot.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { partitionProactiveSuggestions } from '@/pages/admin/proactive-suggestions-partition';

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

type MainTab = 'automations' | 'suggestions' | 'settings';

const SUGGESTION_HISTORY_PAGE_SIZE = 5;

function mergeZoneOptions(currentValues: string[]): string[] {
  const base = getIanaTimeZoneOptions();
  const set = new Set(base);
  for (const v of currentValues) {
    if (v && !set.has(v)) {
      base.push(v);
      set.add(v);
    }
  }
  return base.slice().sort((a, b) => a.localeCompare(b));
}

interface AutomationsTabProps {
  isLoading: boolean;
  automations: ProactiveAutomation[];
  modelCatalog: AssistantModelCatalogData | null;
  onCreate: () => void;
  onEdit: (a: ProactiveAutomation) => void;
  onTestRun: (a: ProactiveAutomation) => void;
  testRunPendingId: string | undefined;
  onToggle: (id: string, enabled: boolean) => void;
  togglePending: boolean;
  onDelete: (id: string) => void;
  deletePending: boolean;
  onOpenHistory: (a: ProactiveAutomation) => void;
}

function AutomationsTab({
  isLoading,
  automations,
  modelCatalog,
  onCreate,
  onEdit,
  onTestRun,
  testRunPendingId,
  onToggle,
  togglePending,
  onDelete,
  deletePending,
  onOpenHistory,
}: AutomationsTabProps) {
  return (
    <section aria-labelledby="automations-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="automations-heading"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          Your automations
        </h2>
        <Button type="button" size="sm" className="rounded-lg" onClick={onCreate}>
          New automation
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : automations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No automations yet. Create a daily briefing or evening check-in to get started.
          </p>
          <Button type="button" size="sm" className="rounded-lg" onClick={onCreate}>
            Create your first automation
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 items-stretch">
          {automations.map((a: ProactiveAutomation) => (
            <AutomationCard
              key={a.id}
              automation={a}
              kindLabel={KIND_LABELS[a.kind]}
              modelCatalog={modelCatalog}
              onTestRun={() => onTestRun(a)}
              testRunPending={testRunPendingId === a.id}
              onToggleEnabled={(enabled) => onToggle(a.id, enabled)}
              togglePending={togglePending}
              onEdit={() => onEdit(a)}
              onDelete={() => onDelete(a.id)}
              deletePending={deletePending}
              onOpenHistory={() => onOpenHistory(a)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface SuggestionsTabProps {
  isLoading: boolean;
  pendingSuggestions: ProactiveSuggestion[];
  acceptedSuggestions: ProactiveSuggestion[];
  rejectedSuggestions: ProactiveSuggestion[];
  resolvePending: boolean;
  onApprove: (id: string) => void;
  onRejectRequest: (s: ProactiveSuggestion) => void;
  onEditSuggestion: (s: ProactiveSuggestion) => void;
  onEditRejectedSuggestion: (s: ProactiveSuggestion) => void;
  onUpdateRejectedFeedback: (s: ProactiveSuggestion) => void;
  onApproveRejected: (id: string) => void;
  onBrainstorm: () => void;
  brainstormPending: boolean;
  brainstormError: string | null;
  brainstormStatus: string | null;
  brainstormPicker: BrainstormModelPickerValue;
  onBrainstormPickerChange: (next: BrainstormModelPickerValue) => void;
  brainstormCatalogLoading: boolean;
  brainstormModelCatalog: AssistantModelCatalogData | null;
}

function PendingSuggestionSection({
  id,
  title,
  description,
  emptyMessage,
  suggestions,
  resolvePending,
  onApprove,
  onRejectRequest,
  onEditSuggestion,
  modelCatalog,
}: {
  id: string;
  title: string;
  description?: string;
  emptyMessage: string;
  suggestions: ProactiveSuggestion[];
  resolvePending: boolean;
  onApprove: (suggestionId: string) => void;
  onRejectRequest: (s: ProactiveSuggestion) => void;
  onEditSuggestion: (s: ProactiveSuggestion) => void;
  modelCatalog: AssistantModelCatalogData | null;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 id={id} className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500 tabular-nums">
            ({suggestions.length})
          </span>
        </h3>
        {description ? (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {suggestions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <ProactiveSuggestionCard
              key={s.id}
              suggestion={s}
              modelCatalog={modelCatalog}
              variant="pending"
              resolvePending={resolvePending}
              onApprove={() => onApprove(s.id)}
              onReject={() => onRejectRequest(s)}
              onEdit={() => onEditSuggestion(s)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ExpandablePaginatedSuggestionSection({
  id,
  title,
  description,
  emptyMessage,
  suggestions,
  resolvePending,
  variant,
  onEditRejected,
  onUpdateRejectedFeedback,
  onApproveRejected,
  modelCatalog,
}: {
  id: string;
  title: string;
  description?: string;
  emptyMessage: string;
  suggestions: ProactiveSuggestion[];
  resolvePending: boolean;
  variant: 'approved' | 'rejected';
  onEditRejected?: (s: ProactiveSuggestion) => void;
  onUpdateRejectedFeedback?: (s: ProactiveSuggestion) => void;
  onApproveRejected?: (suggestionId: string) => void;
  modelCatalog: AssistantModelCatalogData | null;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(suggestions.length / SUGGESTION_HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * SUGGESTION_HISTORY_PAGE_SIZE;
    return suggestions.slice(start, start + SUGGESTION_HISTORY_PAGE_SIZE);
  }, [suggestions, safePage]);

  useEffect(() => {
    setPage(1);
  }, [suggestions.length]);

  return (
    <details className="group rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <summary
        className="flex cursor-pointer list-none items-start gap-2 px-4 py-3 text-left [&::-webkit-details-marker]:hidden"
        aria-labelledby={id}
      >
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180 dark:text-gray-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 id={id} className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
            <span className="ml-2 text-sm font-normal text-gray-500 tabular-nums">
              ({suggestions.length})
            </span>
          </h3>
          {description ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">{description}</p>
          ) : null}
        </div>
      </summary>
      <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-1">{emptyMessage}</p>
        ) : (
          <>
            <ul className="space-y-3">
              {pageSlice.map((s) => (
                <ProactiveSuggestionCard
                  key={s.id}
                  suggestion={s}
                  modelCatalog={modelCatalog}
                  variant={variant}
                  resolvePending={resolvePending}
                  onEdit={
                    variant === 'rejected' && onEditRejected ? () => onEditRejected(s) : undefined
                  }
                  onUpdateFeedback={
                    variant === 'rejected' && onUpdateRejectedFeedback
                      ? () => onUpdateRejectedFeedback(s)
                      : undefined
                  }
                  onApproveRejected={
                    variant === 'rejected' && onApproveRejected
                      ? () => onApproveRejected(s.id)
                      : undefined
                  }
                />
              ))}
            </ul>
            {totalPages > 1 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
                <span className="tabular-nums">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg !px-3 !py-1.5 text-xs"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg !px-3 !py-1.5 text-xs"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}

function SuggestionsTab({
  isLoading,
  pendingSuggestions,
  acceptedSuggestions,
  rejectedSuggestions,
  resolvePending,
  onApprove,
  onRejectRequest,
  onEditSuggestion,
  onEditRejectedSuggestion,
  onUpdateRejectedFeedback,
  onApproveRejected,
  onBrainstorm,
  brainstormPending,
  brainstormError,
  brainstormStatus,
  brainstormPicker,
  onBrainstormPickerChange,
  brainstormCatalogLoading,
  brainstormModelCatalog,
}: SuggestionsTabProps) {
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);

  const brainstormModelTriggerLabel = useMemo(() => {
    if (brainstormCatalogLoading || !brainstormModelCatalog) {
      return 'Model: …';
    }
    if (!brainstormModelCatalog.models.length) {
      return 'Model: Unavailable';
    }
    if (brainstormPicker.mode === 'auto') {
      return 'Model: Auto';
    }
    const entry = brainstormModelCatalog.models.find(
      (m) => m.id === brainstormPicker.manualCatalogModelId
    );
    const name = entry?.label ?? brainstormPicker.manualCatalogModelId;
    return `Model: ${name}`;
  }, [
    brainstormCatalogLoading,
    brainstormModelCatalog,
    brainstormPicker.mode,
    brainstormPicker.manualCatalogModelId,
  ]);

  return (
    <section aria-labelledby="suggestions-heading" className="space-y-10">
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2
            id="suggestions-heading"
            className="text-lg font-semibold leading-tight text-gray-900 dark:text-white"
          >
            Suggestions
          </h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full shrink-0 rounded-lg sm:w-auto inline-flex items-center justify-center gap-2"
              disabled={brainstormPending}
              onClick={() => setIsPickerModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isPickerModalOpen}
            >
              <Settings2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {brainstormModelTriggerLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full shrink-0 rounded-lg sm:w-auto"
              disabled={brainstormPending}
              onClick={onBrainstorm}
            >
              {brainstormPending ? 'Generating…' : 'Generate from my data'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 w-full">
          Pending ideas need your OK before they become automations. Accepted and rejected history
          stays on this page and informs the next <strong>Generate from my data</strong> run (along
          with your tasks, goals, logbook, and memory). Generation often takes ~30–60s.
        </p>
      </div>
      <Dialog
        isOpen={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
        title="Brainstorm Model"
        size="md"
      >
        <BrainstormModelPicker
          catalog={brainstormModelCatalog}
          isLoading={brainstormCatalogLoading}
          value={brainstormPicker}
          onChange={onBrainstormPickerChange}
          disabled={brainstormPending}
        />
        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="rounded-lg"
            onClick={() => setIsPickerModalOpen(false)}
          >
            Done
          </Button>
        </div>
      </Dialog>
      {brainstormError ? (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
          {brainstormError}
        </p>
      ) : null}
      {brainstormStatus ? (
        <p className="text-sm text-green-700 dark:text-green-400 mb-3" role="status">
          {brainstormStatus}
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : pendingSuggestions.length === 0 &&
        acceptedSuggestions.length === 0 &&
        rejectedSuggestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center w-full">
          <Sparkles className="h-10 w-10 mx-auto text-primary/80 mb-3" aria-hidden />
          <p className="text-sm font-medium text-gray-900 dark:text-white">No suggestions yet</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Run <strong>Generate from my data</strong> to brainstorm automations from your
            workspace.
          </p>
        </div>
      ) : (
        <>
          <PendingSuggestionSection
            id="pending-suggestions-heading"
            title="Pending"
            description="Approve to create an automation, or reject (optionally with feedback)."
            emptyMessage="Nothing waiting for review."
            suggestions={pendingSuggestions}
            resolvePending={resolvePending}
            onApprove={onApprove}
            onRejectRequest={onRejectRequest}
            onEditSuggestion={onEditSuggestion}
            modelCatalog={brainstormModelCatalog}
          />
          <ExpandablePaginatedSuggestionSection
            id="accepted-suggestions-heading"
            title="Accepted"
            description="Suggestions you approved (final schedule may differ if you edited before saving)."
            emptyMessage="No accepted suggestions yet."
            suggestions={acceptedSuggestions}
            resolvePending={resolvePending}
            variant="approved"
            modelCatalog={brainstormModelCatalog}
          />
          <ExpandablePaginatedSuggestionSection
            id="rejected-suggestions-heading"
            title="Rejected"
            description="Dismissed ideas remain visible. Feedback you provide is used in future brainstorms."
            emptyMessage="No rejected suggestions yet."
            suggestions={rejectedSuggestions}
            resolvePending={resolvePending}
            variant="rejected"
            onEditRejected={onEditRejectedSuggestion}
            onUpdateRejectedFeedback={onUpdateRejectedFeedback}
            onApproveRejected={onApproveRejected}
            modelCatalog={brainstormModelCatalog}
          />
        </>
      )}
    </section>
  );
}

interface SettingsTabProps {
  emailTestPending: boolean;
  onEmailTest: () => void;
  emailTestError: string | null;
  emailTestMessage: string | null;
  tz: string;
  zoneOptions: string[];
  onTzChange: (z: string) => void;
  onDetectTz: () => void;
  tzSaving: boolean;
  onSaveTz: () => void;
}

function SettingsTab({
  emailTestPending,
  onEmailTest,
  emailTestError,
  emailTestMessage,
  tz,
  zoneOptions,
  onTzChange,
  onDetectTz,
  tzSaving,
  onSaveTz,
}: SettingsTabProps) {
  return (
    <section className="space-y-8" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="sr-only">
        Settings
      </h2>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Test email delivery
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 max-w-2xl">
          Delivers to the email stored on your Cognito user (login email). The visible From address
          is whatever the API sets in SES_FROM_ADDRESS; that identity must be verified in Amazon SES
          and is not the same as using your Gmail as the sender unless you verified that address in
          SES.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-lg border-amber-600 text-amber-900 bg-white hover:bg-amber-50 hover:text-amber-950 dark:border-amber-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white"
          disabled={emailTestPending}
          onClick={onEmailTest}
        >
          {emailTestPending ? 'Sending…' : 'Send test email'}
        </Button>
        {emailTestError ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2" role="alert">
            {emailTestError}
          </p>
        ) : null}
        {emailTestMessage ? (
          <p className="text-sm text-green-700 dark:text-green-400 mt-2" role="status">
            {emailTestMessage}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Default time zone
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 max-w-2xl">
          Used as the default when you create an automation. Each automation stores its own time
          zone, so you can mix regions if needed.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-600 min-w-[14rem] max-w-full flex-1"
            value={tz}
            onChange={(e) => onTzChange(e.target.value)}
          >
            {zoneOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            onClick={onDetectTz}
          >
            Detect timezone
          </button>
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 disabled:opacity-50"
            disabled={tzSaving}
            onClick={onSaveTz}
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 bg-gray-50/50 dark:bg-gray-950/20">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Automation kinds
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          {KINDS.map((k) => (
            <li key={k}>
              <span className="font-medium text-gray-800 dark:text-gray-200">{KIND_LABELS[k]}</span>
              {k === 'dailyBriefing' ? ' — morning summary and priorities.' : null}
              {k === 'logbookEvening' ? ' — end-of-day reflection prompt.' : null}
              {k === 'custom' ? ' — your own instructions each run.' : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function ProactiveAutomationsPage() {
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>('automations');
  const [draftTimeZone, setDraftTimeZone] = useState<string | null>(null);
  const [tzSaving, setTzSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTestMessage, setEmailTestMessage] = useState<string | null>(null);
  const [emailTestError, setEmailTestError] = useState<string | null>(null);
  const [singleRunFeedback, setSingleRunFeedback] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'suggestion' | 'rejectedSuggestion'>(
    'create'
  );
  const [editingAutomation, setEditingAutomation] = useState<ProactiveAutomation | null>(null);
  const [suggestionEditId, setSuggestionEditId] = useState<string | null>(null);
  const [suggestionFormPayload, setSuggestionFormPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [automationFormKey, setAutomationFormKey] = useState(0);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [brainstormStatus, setBrainstormStatus] = useState<string | null>(null);
  const [brainstormPicker, setBrainstormPicker] = useState<BrainstormModelPickerValue>({
    mode: 'auto',
    manualCatalogModelId: '',
  });
  const [historyAutomation, setHistoryAutomation] = useState<ProactiveAutomation | null>(null);
  const [rejectSuggestionTarget, setRejectSuggestionTarget] = useState<ProactiveSuggestion | null>(
    null
  );
  const [updateFeedbackTarget, setUpdateFeedbackTarget] = useState<ProactiveSuggestion | null>(
    null
  );

  const timeZonePrefQ = useQuery({
    queryKey: ['preferences', 'time-zone'],
    queryFn: async () => {
      const res = await apiClient.getPreferencesTimeZone();
      if (!res.success || !res.data?.timeZone)
        throw new Error(res.error?.message ?? 'Failed to load');
      return res.data.timeZone;
    },
  });

  const savedTimeZone = timeZonePrefQ.data ?? 'UTC';
  const tz = draftTimeZone ?? savedTimeZone;

  const automationsQ = useQuery({
    queryKey: ['proactive', 'automations'],
    queryFn: async () => {
      const res = await apiClient.getProactiveAutomations();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load');
      return res.data;
    },
  });

  const suggestionsQ = useQuery({
    queryKey: ['proactive', 'suggestions'],
    queryFn: async () => {
      const res = await apiClient.getProactiveSuggestions();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load');
      return res.data;
    },
  });

  const brainstormModelCatalogQ = useQuery({
    queryKey: queryKeys.chatbot.modelCatalog(),
    queryFn: () => chatbotService.getAssistantModelCatalog(),
  });

  useEffect(() => {
    const data = brainstormModelCatalogQ.data;
    if (!data?.models.length) return;
    const fallback = data.defaults.defaultReasoningModelId || data.models[0].id;
    setBrainstormPicker((p) => {
      if (p.mode !== 'manual') return p;
      if (p.manualCatalogModelId && data.models.some((m) => m.id === p.manualCatalogModelId)) {
        return p;
      }
      return { ...p, manualCatalogModelId: fallback };
    });
  }, [brainstormModelCatalogQ.data]);

  const automations = automationsQ.data ?? [];
  const zoneOptions = useMemo(
    () =>
      mergeZoneOptions([tz, savedTimeZone, ...(automationsQ.data ?? []).map((a) => a.timeZone)]),
    [tz, savedTimeZone, automationsQ.data]
  );

  const saveTz = async () => {
    setTzSaving(true);
    const res = await apiClient.setPreferencesTimeZone({ timeZone: tz });
    setTzSaving(false);
    if (!res.success) {
      setFormError(res.error?.message ?? 'Failed to save time zone');
      return;
    }
    setDraftTimeZone(null);
    void qc.invalidateQueries({ queryKey: ['preferences', 'time-zone'] });
  };

  const createMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiClient.createProactiveAutomation(body);
      if (!res.success) throw new Error(res.error?.message ?? 'Create failed');
      return res.data;
    },
    onSuccess: () => {
      setFormError(null);
      setFormModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await apiClient.updateProactiveAutomation(id, body);
      if (!res.success) throw new Error(res.error?.message ?? 'Update failed');
      return res.data;
    },
    onSuccess: () => {
      setFormError(null);
      setFormModalOpen(false);
      setEditingAutomation(null);
      void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiClient.updateProactiveAutomation(id, { enabled });
      if (!res.success) throw new Error(res.error?.message ?? 'Update failed');
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.deleteProactiveAutomation(id);
      if (!res.success) throw new Error(res.error?.message ?? 'Delete failed');
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] }),
  });

  const resolveMut = useMutation({
    mutationFn: async (payload: {
      id: string;
      approve: boolean;
      feedback?: string;
      resolvedPayload?: Record<string, unknown>;
    }) => {
      const res = await apiClient.resolveProactiveSuggestion(payload.id, {
        approve: payload.approve,
        ...(payload.feedback ? { feedback: payload.feedback } : {}),
        ...(payload.resolvedPayload ? { resolvedPayload: payload.resolvedPayload } : {}),
      });
      if (!res.success) throw new Error(res.error?.message ?? 'Resolve failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['proactive', 'suggestions'] });
      void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] });
    },
  });

  const suggestionWorkflowMut = useMutation({
    mutationFn: async ({
      body,
      suggestionId,
    }: {
      body: Record<string, unknown>;
      suggestionId: string;
    }) => {
      const res = await apiClient.resolveProactiveSuggestion(suggestionId, {
        approve: true,
        resolvedPayload: body,
      });
      if (!res.success) throw new Error(res.error?.message ?? 'Could not approve suggestion');
    },
    onSuccess: () => {
      setFormError(null);
      setFormModalOpen(false);
      setEditingAutomation(null);
      setSuggestionEditId(null);
      setSuggestionFormPayload(null);
      setFormMode('create');
      void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] });
      void qc.invalidateQueries({ queryKey: ['proactive', 'suggestions'] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const patchSuggestionMut = useMutation({
    mutationFn: async (args: {
      id: string;
      body: { feedback?: string; proposedPayload?: Record<string, unknown> };
    }) => {
      const res = await apiClient.patchProactiveSuggestion(args.id, args.body);
      if (!res.success) throw new Error(res.error?.message ?? 'Update failed');
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['proactive', 'suggestions'] });
    },
  });

  const brainstormMut = useMutation({
    mutationFn: async (picker: BrainstormModelPickerValue) => {
      const res = await apiClient.brainstormProactiveSuggestions({
        timeZone: savedTimeZone,
        model: brainstormValueToApiModelField(picker),
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Suggestion run failed');
      return res.data;
    },
    onSuccess: (data) => {
      setBrainstormError(null);
      const skipped = data.skipped.length;
      setBrainstormStatus(
        `Added ${data.created.length} suggestion(s)${skipped ? ` (${skipped} skipped)` : ''} via ${data.model}. ` +
          `Context: ${data.contextStats.taskCount} tasks, ${data.contextStats.goalCount} goals, ` +
          `${data.contextStats.memorySnippetCount} memory hits, ${data.contextStats.existingAutomationCount} existing automations.`
      );
      void qc.invalidateQueries({ queryKey: ['proactive', 'suggestions'] });
    },
    onError: (e: Error) => {
      setBrainstormStatus(null);
      setBrainstormError(e.message);
    },
  });

  const emailTestMut = useMutation({
    mutationFn: async () => {
      const res = await apiClient.sendProactiveTestEmail();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Test email failed');
      return res.data;
    },
    onSuccess: (data) => {
      setEmailTestError(null);
      setEmailTestMessage(
        `Request succeeded — SES accepted the message for ${data.sentTo}${
          data.messageId ? ` (message id: ${data.messageId})` : ''
        }. Stage ${data.deployedStage}: open thread ${data.threadId} and reply to the email to verify inbound routing. If nothing appears in the inbox, check spam and SES suppression lists.`
      );
    },
    onError: (e: Error) => {
      setEmailTestMessage(null);
      setEmailTestError(e.message);
    },
  });

  const singleDispatchMut = useMutation({
    mutationFn: async (automationId: string) => {
      const res = await apiClient.runProactiveAutomationDispatchTest(automationId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Run failed');
      return res.data;
    },
    onSuccess: (data, automationId) => {
      const errCount = data.errors.length;
      if (errCount === 0) {
        setSingleRunFeedback({
          variant: 'success',
          message: `Ran automation successfully (${data.ran} run).`,
        });
      } else {
        setSingleRunFeedback({
          variant: 'error',
          message: data.errors[0]?.error ?? 'Run failed',
        });
      }
      setFormError(null);
      void qc.invalidateQueries({ queryKey: ['proactive', 'automations'] });
      if (automationId) {
        void qc.invalidateQueries({ queryKey: ['proactive', 'automation-runs', automationId] });
      }
    },
    onError: (e: Error) => {
      setSingleRunFeedback(null);
      setFormError(e.message);
    },
  });

  const {
    pending: pendingSuggestions,
    accepted: acceptedSuggestions,
    rejected: rejectedSuggestions,
  } = useMemo(() => partitionProactiveSuggestions(suggestionsQ.data ?? []), [suggestionsQ.data]);

  const openCreateModal = () => {
    setFormError(null);
    setFormMode('create');
    setEditingAutomation(null);
    setSuggestionEditId(null);
    setSuggestionFormPayload(null);
    setAutomationFormKey((k) => k + 1);
    setFormModalOpen(true);
  };

  const openEditModal = (a: ProactiveAutomation) => {
    setFormError(null);
    setFormMode('edit');
    setEditingAutomation(a);
    setSuggestionEditId(null);
    setSuggestionFormPayload(null);
    setAutomationFormKey((k) => k + 1);
    setFormModalOpen(true);
  };

  const openSuggestionEditModal = (s: ProactiveSuggestion) => {
    setFormError(null);
    setFormMode('suggestion');
    setEditingAutomation(null);
    setSuggestionEditId(s.id);
    const raw = s.proposedPayload;
    setSuggestionFormPayload(
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? { ...(raw as Record<string, unknown>) }
        : {}
    );
    setAutomationFormKey((k) => k + 1);
    setFormModalOpen(true);
  };

  const openRejectedSuggestionEditModal = (s: ProactiveSuggestion) => {
    setFormError(null);
    setFormMode('rejectedSuggestion');
    setEditingAutomation(null);
    setSuggestionEditId(s.id);
    const raw = s.proposedPayload;
    setSuggestionFormPayload(
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? { ...(raw as Record<string, unknown>) }
        : {}
    );
    setAutomationFormKey((k) => k + 1);
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (
      createMut.isPending ||
      updateMut.isPending ||
      suggestionWorkflowMut.isPending ||
      patchSuggestionMut.isPending
    )
      return;
    setFormModalOpen(false);
    setEditingAutomation(null);
    setSuggestionEditId(null);
    setSuggestionFormPayload(null);
    setFormMode('create');
  };

  const handleFormSubmit = (body: Record<string, unknown>) => {
    setFormError(null);
    if ((formMode === 'suggestion' || formMode === 'rejectedSuggestion') && suggestionFormPayload) {
      const reasoning = suggestionFormPayload.reasoning;
      if (typeof reasoning === 'string' && reasoning.trim() && body.reasoning === undefined) {
        body.reasoning = reasoning.trim();
      }
    }
    if (formMode === 'rejectedSuggestion' && suggestionEditId) {
      patchSuggestionMut.mutate(
        { id: suggestionEditId, body: { proposedPayload: body } },
        {
          onSuccess: () => {
            setFormError(null);
            setFormModalOpen(false);
            setSuggestionEditId(null);
            setSuggestionFormPayload(null);
            setFormMode('create');
          },
          onError: (e: Error) => setFormError(e.message),
        }
      );
    } else if (formMode === 'suggestion' && suggestionEditId) {
      suggestionWorkflowMut.mutate({ body, suggestionId: suggestionEditId });
    } else if (formMode === 'create') {
      createMut.mutate(body);
    } else if (formMode === 'edit' && editingAutomation) {
      updateMut.mutate({ id: editingAutomation.id, body });
    }
  };

  const tabs: Array<{ id: MainTab; label: string; badge?: number }> = [
    { id: 'automations', label: 'Automations' },
    { id: 'suggestions', label: 'Suggestions', badge: pendingSuggestions.length },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12 pt-20 lg:px-8 lg:pt-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Proactive assistant
          </h1>
          <p className="mt-1 w-full text-sm text-gray-600 dark:text-gray-400">
            Schedule morning briefings and evening logbook check-ins. At the time you pick, the
            assistant prepares an update you can open in the app; you can also get a short email
            with a link back to the conversation. When your workspace is set up for it, replying to
            that email continues the same thread.
          </p>
        </header>

        <div
          className="mb-6 flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800/80"
          role="tablist"
          aria-label="Proactive assistant sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mainTab === tab.id}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                mainTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              )}
              onClick={() => setMainTab(tab.id)}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 ? (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs tabular-nums text-primary">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {formError ? (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        {singleRunFeedback ? (
          <p
            className={
              singleRunFeedback.variant === 'success'
                ? 'mb-4 text-sm text-green-700 dark:text-green-400'
                : 'mb-4 text-sm text-red-600 dark:text-red-400'
            }
            role="status"
          >
            {singleRunFeedback.message}
          </p>
        ) : null}

        {mainTab === 'automations' ? (
          <AutomationsTab
            isLoading={automationsQ.isPending}
            automations={automations}
            modelCatalog={brainstormModelCatalogQ.data ?? null}
            onCreate={openCreateModal}
            onEdit={openEditModal}
            onTestRun={(a) => {
              setSingleRunFeedback(null);
              singleDispatchMut.mutate(a.id);
            }}
            testRunPendingId={
              singleDispatchMut.isPending && singleDispatchMut.variables
                ? singleDispatchMut.variables
                : undefined
            }
            onToggle={(id, enabled) => toggleMut.mutate({ id, enabled })}
            togglePending={toggleMut.isPending}
            onDelete={(id) => {
              if (confirm('Delete this automation?')) deleteMut.mutate(id);
            }}
            deletePending={deleteMut.isPending}
            onOpenHistory={(a) => setHistoryAutomation(a)}
          />
        ) : null}

        {mainTab === 'suggestions' ? (
          <SuggestionsTab
            isLoading={suggestionsQ.isPending}
            pendingSuggestions={pendingSuggestions}
            acceptedSuggestions={acceptedSuggestions}
            rejectedSuggestions={rejectedSuggestions}
            resolvePending={
              resolveMut.isPending ||
              suggestionWorkflowMut.isPending ||
              patchSuggestionMut.isPending
            }
            onApprove={(id) => resolveMut.mutate({ id, approve: true })}
            onRejectRequest={(s) => setRejectSuggestionTarget(s)}
            onEditSuggestion={openSuggestionEditModal}
            onEditRejectedSuggestion={openRejectedSuggestionEditModal}
            onUpdateRejectedFeedback={(s) => {
              setFormError(null);
              setUpdateFeedbackTarget(s);
            }}
            onApproveRejected={(id) => resolveMut.mutate({ id, approve: true })}
            onBrainstorm={() => {
              setBrainstormError(null);
              setBrainstormStatus(null);
              brainstormMut.mutate(brainstormPicker);
            }}
            brainstormPending={brainstormMut.isPending}
            brainstormError={brainstormError}
            brainstormStatus={brainstormStatus}
            brainstormPicker={brainstormPicker}
            onBrainstormPickerChange={setBrainstormPicker}
            brainstormCatalogLoading={brainstormModelCatalogQ.isLoading}
            brainstormModelCatalog={brainstormModelCatalogQ.data ?? null}
          />
        ) : null}

        {mainTab === 'settings' ? (
          <SettingsTab
            emailTestPending={emailTestMut.isPending}
            onEmailTest={() => {
              setEmailTestMessage(null);
              setEmailTestError(null);
              emailTestMut.mutate();
            }}
            emailTestError={emailTestError}
            emailTestMessage={emailTestMessage}
            tz={tz}
            zoneOptions={zoneOptions}
            onTzChange={setDraftTimeZone}
            onDetectTz={() => setDraftTimeZone(detectBrowserTimeZone())}
            tzSaving={tzSaving}
            onSaveTz={() => void saveTz()}
          />
        ) : null}

        <AutomationFormModal
          isOpen={formModalOpen}
          onClose={closeFormModal}
          mode={formMode}
          initialAutomation={editingAutomation}
          suggestionPayload={
            formMode === 'suggestion' || formMode === 'rejectedSuggestion'
              ? suggestionFormPayload
              : null
          }
          zoneOptions={zoneOptions}
          defaultTimeZone={savedTimeZone}
          formKey={automationFormKey}
          modelCatalog={brainstormModelCatalogQ.data ?? null}
          isModelCatalogLoading={brainstormModelCatalogQ.isLoading}
          saving={
            createMut.isPending ||
            updateMut.isPending ||
            suggestionWorkflowMut.isPending ||
            patchSuggestionMut.isPending
          }
          onSubmit={handleFormSubmit}
        />

        <AutomationRunHistoryDialog
          isOpen={historyAutomation !== null}
          onClose={() => setHistoryAutomation(null)}
          automation={historyAutomation}
          kindLabel={historyAutomation ? KIND_LABELS[historyAutomation.kind] : ''}
        />

        <RejectSuggestionDialog
          isOpen={rejectSuggestionTarget !== null}
          suggestion={rejectSuggestionTarget}
          onClose={() => {
            if (!resolveMut.isPending) setRejectSuggestionTarget(null);
          }}
          isSubmitting={resolveMut.isPending}
          onConfirm={(feedback) => {
            if (!rejectSuggestionTarget) return;
            const id = rejectSuggestionTarget.id;
            resolveMut.mutate(
              { id, approve: false, ...(feedback ? { feedback } : {}) },
              { onSuccess: () => setRejectSuggestionTarget(null) }
            );
          }}
        />

        <UpdateSuggestionFeedbackDialog
          isOpen={updateFeedbackTarget !== null}
          suggestion={updateFeedbackTarget}
          onClose={() => {
            if (!patchSuggestionMut.isPending) setUpdateFeedbackTarget(null);
          }}
          isSubmitting={patchSuggestionMut.isPending}
          onSave={(feedback) => {
            if (!updateFeedbackTarget) return;
            setFormError(null);
            patchSuggestionMut.mutate(
              { id: updateFeedbackTarget.id, body: { feedback: feedback.trim() } },
              {
                onSuccess: () => setUpdateFeedbackTarget(null),
                onError: (e: Error) => setFormError(e.message),
              }
            );
          }}
        />
      </div>
    </div>
  );
}
