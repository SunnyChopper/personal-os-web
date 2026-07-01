import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  ExternalLink,
  Play,
  RefreshCw,
  Search,
} from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import Button from '@/components/atoms/Button';
import LinkedStackTrace from '@/components/molecules/observability/LinkedStackTrace';
import Dialog from '@/components/molecules/Dialog';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { useEditorLinkSettings } from '@/hooks/useEditorLinkSettings';
import { formatObservabilityUsd } from '@/lib/observability-formatters';
import {
  getObservabilityMessageRole,
  parseObservabilityPromptText,
  resolveObservabilityMessageContent,
} from '@/lib/observability-prompt-display';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { assistantSandboxService } from '@/services/assistant-sandbox.service';
import { observabilityService } from '@/services/observability.service';
import { cn } from '@/lib/utils';
import type { ObservabilityExecutionRow, ObservabilityHealthRow } from '@/types/observability';
import { formatLatencyMs } from '@/utils/latency-formatters';
import ExecutionDetailMetadata from './ExecutionDetailMetadata';
import { Select } from '@/components/atoms/Select';

const TAB_ORDER = ['burn', 'executions', 'health'] as const;
type MainTab = (typeof TAB_ORDER)[number];

function tabLabel(t: MainTab): string {
  switch (t) {
    case 'burn':
      return 'Burn dashboard';
    case 'executions':
      return 'Execution log';
    case 'health':
      return 'Automation health';
    default:
      return t;
  }
}

function parseMainTab(value: string | null): MainTab | null {
  if (value && (TAB_ORDER as readonly string[]).includes(value)) {
    return value as MainTab;
  }
  return null;
}

const EXECUTION_TEXT_PANEL_CLASS =
  'text-xs bg-gray-50 dark:bg-gray-950 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto';

function renderPromptText(text: string) {
  const parsed = parseObservabilityPromptText(text);

  if (parsed.kind === 'messages') {
    return (
      <div className="space-y-4">
        {parsed.messages.map((msg, idx) => (
          <div
            key={idx}
            className="space-y-1 pb-3 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0"
          >
            <div className="text-xs font-semibold text-violet-600 dark:text-violet-400 capitalize">
              {getObservabilityMessageRole(msg)}
            </div>
            <MarkdownRenderer content={resolveObservabilityMessageContent(msg)} variant="chat" />
          </div>
        ))}
      </div>
    );
  }

  if (parsed.kind === 'json') {
    return (
      <pre className="whitespace-pre-wrap font-mono text-xs">
        {JSON.stringify(parsed.value, null, 2)}
      </pre>
    );
  }

  return <MarkdownRenderer content={parsed.content} variant="chat" />;
}

export default function ObservabilityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlHydratedRef = useRef(false);
  const { settings: editorLinkSettings } = useEditorLinkSettings();
  const [tab, setTab] = useState<MainTab>(() => parseMainTab(searchParams.get('tab')) ?? 'burn');

  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [groupBy, setGroupBy] = useState<'module' | 'model' | 'provider'>('module');

  const burnShared = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      module: moduleFilter.trim() || undefined,
      model: modelFilter.trim() || undefined,
      provider: providerFilter.trim() || undefined,
    }),
    [startDate, endDate, moduleFilter, modelFilter, providerFilter]
  );

  const burnBreakdownFilters = useMemo(() => ({ ...burnShared, groupBy }), [burnShared, groupBy]);

  const summaryQ = useQuery({
    queryKey: queryKeys.observability.burnSummary(burnShared),
    queryFn: () => observabilityService.getBurnSummary(burnShared),
    placeholderData: keepPreviousData,
  });

  const seriesQ = useQuery({
    queryKey: queryKeys.observability.burnTimeseries(burnShared),
    queryFn: () => observabilityService.getBurnTimeseries(burnShared),
    placeholderData: keepPreviousData,
  });

  const breakdownQ = useQuery({
    queryKey: queryKeys.observability.burnBreakdown(burnBreakdownFilters),
    queryFn: () => observabilityService.getBurnBreakdown(burnBreakdownFilters),
    placeholderData: keepPreviousData,
  });

  const points = seriesQ.data?.points ?? [];
  const maxTokens = useMemo(() => Math.max(1, ...points.map((p) => p.totalTokens)), [points]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (startDate) n += 1;
    if (endDate) n += 1;
    if (moduleFilter.trim()) n += 1;
    if (modelFilter.trim()) n += 1;
    if (providerFilter.trim()) n += 1;
    return n;
  }, [startDate, endDate, moduleFilter, modelFilter, providerFilter]);

  const anomalies = useMemo(() => {
    const msgs: string[] = [];
    const s = summaryQ.data;
    if (s && (s.unpricedExecutionCount ?? 0) > 0) {
      msgs.push(
        `${s.unpricedExecutionCount} execution(s) have token usage but no resolved USD rate — cost totals may under-report.`
      );
    }
    if (s && s.totalCalls >= 5 && s.failedExecutions > s.totalCalls * 0.2) {
      msgs.push(
        `Elevated failure rate: ${s.failedExecutions} failures in ${s.totalCalls} calls (${Math.round((100 * s.failedExecutions) / s.totalCalls)}%).`
      );
    }
    if (points.length >= 3) {
      const last = points[points.length - 1].totalCostUsd;
      const prev = points.slice(0, -1);
      const avg = prev.reduce((a, p) => a + p.totalCostUsd, 0) / prev.length;
      if (avg > 0 && last > avg * 2) {
        msgs.push(`Recent spend spike: latest day is more than 2× the trailing average burn.`);
      }
    }
    return msgs;
  }, [summaryQ.data, points]);

  const [execPage, setExecPage] = useState(1);
  const [execModule, setExecModule] = useState('');
  const [execModel, setExecModel] = useState('');
  const [execProvider, setExecProvider] = useState('');
  const [execStatus, setExecStatus] = useState('');
  const [execRequestId, setExecRequestId] = useState('');
  const [execProviderRequestId, setExecProviderRequestId] = useState('');
  const [execThreadId, setExecThreadId] = useState(() => searchParams.get('threadId') ?? '');
  const [execRunId, setExecRunId] = useState(() => searchParams.get('runId') ?? '');
  const [execJobRunId, setExecJobRunId] = useState(() => searchParams.get('jobRunId') ?? '');

  useEffect(() => {
    if (urlHydratedRef.current) return;
    urlHydratedRef.current = true;
    const tabParam = parseMainTab(searchParams.get('tab'));
    if (tabParam) setTab(tabParam);
    const threadId = searchParams.get('threadId');
    if (threadId != null) setExecThreadId(threadId);
    const runId = searchParams.get('runId');
    if (runId != null) setExecRunId(runId);
    const jobRunId = searchParams.get('jobRunId');
    if (jobRunId != null) setExecJobRunId(jobRunId);
  }, [searchParams]);

  useEffect(() => {
    if (!urlHydratedRef.current) return;
    const next = new URLSearchParams();
    if (tab !== 'burn') next.set('tab', tab);
    if (tab === 'executions') {
      const threadId = execThreadId.trim();
      const runId = execRunId.trim();
      const jobRunId = execJobRunId.trim();
      if (threadId) next.set('threadId', threadId);
      if (runId) next.set('runId', runId);
      if (jobRunId) next.set('jobRunId', jobRunId);
    }
    const nextStr = next.toString();
    if (nextStr !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [tab, execThreadId, execRunId, execJobRunId, searchParams, setSearchParams]);

  const execFilters = useMemo(
    () => ({
      page: execPage,
      pageSize: 50,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      module: execModule.trim() || undefined,
      model: execModel.trim() || undefined,
      provider: execProvider.trim() || undefined,
      status: execStatus.trim() || undefined,
      requestId: execRequestId.trim() || undefined,
      providerRequestId: execProviderRequestId.trim() || undefined,
      threadId: execThreadId.trim() || undefined,
      runId: execRunId.trim() || undefined,
      jobRunId: execJobRunId.trim() || undefined,
    }),
    [
      execPage,
      startDate,
      endDate,
      execModule,
      execModel,
      execProvider,
      execStatus,
      execRequestId,
      execProviderRequestId,
      execThreadId,
      execRunId,
      execJobRunId,
    ]
  );

  const listQ = useQuery({
    queryKey: queryKeys.observability.executions(execFilters),
    queryFn: () => observabilityService.listExecutions(execFilters),
    enabled: tab === 'executions',
    placeholderData: keepPreviousData,
  });

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQ = useQuery({
    queryKey: queryKeys.observability.executionDetail(detailId ?? ''),
    queryFn: () => observabilityService.getExecution(detailId!),
    enabled: Boolean(detailId),
  });

  const openSandboxM = useMutation({
    mutationFn: (executionId: string) =>
      assistantSandboxService.createSession({ fromExecutionId: executionId }),
    onSuccess: (session) => {
      navigate(`${ROUTES.admin.assistantSandbox}?session=${encodeURIComponent(session.sessionId)}`);
    },
  });

  const [sinceDays, setSinceDays] = useState(14);
  const healthSummaryQ = useQuery({
    queryKey: queryKeys.observability.healthSummary(sinceDays),
    queryFn: () => observabilityService.getHealthSummary(sinceDays),
    enabled: tab === 'health',
  });
  const healthMatrixQ = useQuery({
    queryKey: queryKeys.observability.healthMatrix(sinceDays),
    queryFn: () => observabilityService.getHealthMatrix(sinceDays),
    enabled: tab === 'health',
    placeholderData: keepPreviousData,
  });

  const [expandedHealth, setExpandedHealth] = useState<string | null>(null);

  const investigateHealthRow = (h: ObservabilityHealthRow) => {
    setTab('executions');
    setExecPage(1);
    setExecThreadId(h.threadId ?? '');
    setExecRunId(h.runId ?? '');
    setExecJobRunId(h.rowId);
  };

  const replayMut = useMutation({
    mutationFn: (jobRunId: string) => observabilityService.replayJob(jobRunId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.observability.all });
    },
  });

  const execRows = listQ.data?.data ?? [];

  const invalidateBurn = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.observability.all });
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <PageContainer className="py-8 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="h-7 w-7 text-violet-500" aria-hidden />
              Usage &amp; observability
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              API capital burn, execution ledger, and automation health backed by Postgres (
              <code className="text-xs">/observability</code>
              ).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => invalidateBurn()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </header>

        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-1 flex-wrap">
          {TAB_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors',
                tab === t
                  ? 'border-violet-600 text-violet-700 dark:text-violet-300 bg-white dark:bg-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              )}
              onClick={() => setTab(t)}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {tab === 'burn' && (
          <section className="space-y-6" aria-labelledby="burn-heading">
            <h2 id="burn-heading" className="sr-only">
              Burn dashboard
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  label: 'Today (USD)',
                  value: formatObservabilityUsd(summaryQ.data?.todayCostUsd ?? 0),
                },
                {
                  label: 'Last 7d (USD)',
                  value: formatObservabilityUsd(summaryQ.data?.last7dCostUsd ?? 0),
                },
                { label: 'Tokens', value: summaryQ.data?.totalTokens?.toLocaleString() ?? '—' },
                {
                  label: 'Avg latency (ms)',
                  value: formatLatencyMs(summaryQ.data?.avgLatencyMs),
                },
                {
                  label: 'Failures',
                  value: `${summaryQ.data?.failedExecutions ?? 0} / ${summaryQ.data?.totalCalls ?? 0}`,
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
                >
                  <div className="text-xs uppercase tracking-wide text-gray-500">{k.label}</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1 tabular-nums">
                    {summaryQ.isFetching && !summaryQ.data ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : (
                      k.value
                    )}
                  </div>
                </div>
              ))}
            </div>

            {anomalies.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <ul className="text-sm text-amber-900 dark:text-amber-100 list-disc pl-4 space-y-1">
                  {anomalies.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-sm font-medium text-gray-900 dark:text-white"
                aria-expanded={showFilters}
                onClick={() => setShowFilters((v) => !v)}
              >
                <span className="flex items-center gap-2">
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 text-xs font-normal text-violet-700 dark:text-violet-300">
                      {activeFilterCount} active
                    </span>
                  )}
                </span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
                )}
              </button>
              {showFilters && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <label className="text-xs text-gray-500 flex flex-col gap-1">
                      Start
                      <input
                        type="date"
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </label>
                    <label className="text-xs text-gray-500 flex flex-col gap-1">
                      End
                      <input
                        type="date"
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </label>
                    <label className="text-xs text-gray-500 flex flex-col gap-1">
                      Module
                      <input
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        placeholder="e.g. assistant_ws"
                      />
                    </label>
                    <label className="text-xs text-gray-500 flex flex-col gap-1">
                      Model
                      <input
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                      />
                    </label>
                    <label className="text-xs text-gray-500 flex flex-col gap-1">
                      Provider
                      <input
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave dates empty to use the server default window (~last 30 days).
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Burn (daily)
              </h3>
              {seriesQ.isFetching && !seriesQ.data ? (
                <div className="flex h-44 items-center justify-center">
                  <Loader2
                    className="h-6 w-6 animate-spin text-gray-400"
                    aria-label="Loading chart"
                  />
                </div>
              ) : seriesQ.isError ? (
                <p className="text-sm text-red-600">Failed to load timeseries.</p>
              ) : points.length === 0 ? (
                <p className="text-sm text-gray-500">No execution data in this window yet.</p>
              ) : (
                <div className="flex items-end gap-0.5 h-44 border-b border-gray-200 dark:border-gray-600 pb-1">
                  {points.map((p) => (
                    <div
                      key={p.bucketStart}
                      className="flex-1 min-w-0 flex flex-col justify-end group relative"
                      title={`${p.bucketStart}: ${p.totalTokens.toLocaleString()} tokens · ${formatObservabilityUsd(p.totalCostUsd)}`}
                    >
                      <div
                        className="w-full mx-auto max-w-[12px] rounded-t bg-violet-500/90 dark:bg-violet-400/90"
                        style={{ height: `${(p.totalTokens / maxTokens) * 100}%`, minHeight: 2 }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={cn(
                'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-x-auto',
                breakdownQ.isFetching && 'opacity-70'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Breakdown</h3>
                <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  Group by
                  <Select
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                  >
                    <option value="module">Module</option>
                    <option value="model">Model</option>
                    <option value="provider">Provider</option>
                  </Select>
                  {breakdownQ.isFetching && (
                    <Loader2
                      className="h-4 w-4 animate-spin text-gray-400"
                      aria-label="Loading breakdown"
                    />
                  )}
                </label>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">{groupBy}</th>
                    <th className="py-2 pr-4">Cost</th>
                    <th className="py-2 pr-4">Tokens</th>
                    <th className="py-2">Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownQ.isLoading && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin inline" /> Loading…
                      </td>
                    </tr>
                  )}
                  {breakdownQ.isError && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-red-600 text-sm">
                        Failed to load breakdown.
                      </td>
                    </tr>
                  )}
                  {!breakdownQ.isLoading &&
                    !breakdownQ.isError &&
                    (breakdownQ.data?.rows ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                          No breakdown data in this window.
                        </td>
                      </tr>
                    )}
                  {!breakdownQ.isLoading &&
                    !breakdownQ.isError &&
                    (breakdownQ.data?.rows ?? []).map((r) => (
                      <tr
                        key={r.key + r.callCount}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-2 pr-4 font-mono text-xs">{r.key || '—'}</td>
                        <td className="py-2 pr-4 tabular-nums">
                          {formatObservabilityUsd(r.totalCostUsd)}
                        </td>
                        <td className="py-2 pr-4 tabular-nums">{r.totalTokens.toLocaleString()}</td>
                        <td className="py-2 tabular-nums">{r.callCount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'executions' && (
          <section className="space-y-4" aria-labelledby="exec-heading">
            <h2 id="exec-heading" className="sr-only">
              Execution log
            </h2>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  ['module', execModule, setExecModule],
                  ['model', execModel, setExecModel],
                  ['provider', execProvider, setExecProvider],
                  ['status', execStatus, setExecStatus],
                  ['requestId', execRequestId, setExecRequestId],
                  ['providerRequestId', execProviderRequestId, setExecProviderRequestId],
                  ['threadId', execThreadId, setExecThreadId],
                  ['runId', execRunId, setExecRunId],
                  ['jobRunId', execJobRunId, setExecJobRunId],
                ] as const
              ).map(([k, v, setV]) => (
                <label key={k} className="text-xs text-gray-500 flex flex-col gap-1">
                  {k}
                  <input
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm font-mono"
                    value={v}
                    onChange={(e) => {
                      setExecPage(1);
                      setV(e.target.value);
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-auto max-h-[min(70vh,560px)]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Time</th>
                    <th className="p-2">Module</th>
                    <th className="p-2">Model</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Cost</th>
                    <th className="p-2">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {listQ.isLoading && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin inline" /> Loading…
                      </td>
                    </tr>
                  )}
                  {listQ.isError && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-red-600 text-sm">
                        Failed to load executions.
                      </td>
                    </tr>
                  )}
                  {!listQ.isLoading &&
                    !listQ.isError &&
                    execRows.map((row: ObservabilityExecutionRow) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer"
                        onClick={() => setDetailId(row.id)}
                      >
                        <td className="p-2 whitespace-nowrap text-xs text-gray-600">
                          {new Date(row.occurredAt).toLocaleString()}
                        </td>
                        <td className="p-2 font-mono text-xs">{row.module}</td>
                        <td className="p-2 font-mono text-xs">{row.model}</td>
                        <td className="p-2 text-xs">{row.status}</td>
                        <td className="p-2 text-xs tabular-nums">
                          {formatObservabilityUsd(row.totalCostUsd)}
                        </td>
                        <td className="p-2 text-xs text-gray-600 max-w-xs truncate">
                          {row.responsePreview ?? '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!listQ.isLoading && !listQ.isError && execRows.length === 0 && (
                <p className="p-8 text-center text-gray-500 text-sm">
                  No executions in this filter.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-500">
                Page {listQ.data?.page ?? execPage} — {listQ.data?.total ?? 0} rows
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={execPage <= 1 || listQ.isFetching}
                  onClick={() => setExecPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!listQ.data?.hasMore || listQ.isFetching}
                  onClick={() => setExecPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Dialog
              isOpen={Boolean(detailId)}
              onClose={() => setDetailId(null)}
              title="Execution detail"
              size="full"
            >
              {detailQ.isLoading && (
                <div className="flex justify-center py-12 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {detailQ.data && (
                <div className="space-y-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={detailQ.data.module !== 'assistant' || openSandboxM.isPending}
                      title={
                        detailQ.data.module !== 'assistant'
                          ? 'Only assistant module executions can open in sandbox'
                          : 'Open captured prompt in interactive sandbox'
                      }
                      onClick={() => {
                        if (detailId) openSandboxM.mutate(detailId);
                      }}
                    >
                      {openSandboxM.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-1" />
                      )}
                      Open in Sandbox
                    </Button>
                    {openSandboxM.isError && (
                      <span className="text-xs text-red-600">
                        {(openSandboxM.error as Error).message}
                      </span>
                    )}
                  </div>
                  <ExecutionDetailMetadata detail={detailQ.data} />
                  {detailQ.data.promptText != null && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Prompt</div>
                      <div className={cn(EXECUTION_TEXT_PANEL_CLASS, 'max-h-48')}>
                        {renderPromptText(detailQ.data.promptText)}
                      </div>
                    </div>
                  )}
                  {detailQ.data.responseRawText != null && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Response</div>
                      <div className={cn(EXECUTION_TEXT_PANEL_CLASS, 'max-h-64')}>
                        <MarkdownRenderer content={detailQ.data.responseRawText} variant="chat" />
                      </div>
                    </div>
                  )}
                  {detailQ.data.stackTrace != null && (
                    <div>
                      <div className="text-xs font-semibold text-red-600 mb-1">Stack trace</div>
                      <LinkedStackTrace
                        text={detailQ.data.stackTrace}
                        settings={editorLinkSettings}
                        className="bg-red-50 dark:bg-red-950/30 p-3 rounded border border-red-200 dark:border-red-900"
                      />
                    </div>
                  )}
                </div>
              )}
            </Dialog>
          </section>
        )}

        {tab === 'health' && (
          <section className="space-y-4" aria-labelledby="health-heading">
            <h2 id="health-heading" className="sr-only">
              Automation health
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                Since
                <Select
                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                  value={sinceDays}
                  onChange={(e) => setSinceDays(Number(e.target.value))}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </Select>
              </label>
              {healthSummaryQ.data && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Runs: {healthSummaryQ.data.totalRuns} · Failures:{' '}
                  {healthSummaryQ.data.failureCount}
                  {healthSummaryQ.data.lastFailureAt && (
                    <>
                      {' '}
                      · Last failure: {new Date(healthSummaryQ.data.lastFailureAt).toLocaleString()}
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Job</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Started</th>
                    <th className="p-2 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(healthMatrixQ.data?.rows ?? []).map((h) => (
                    <Fragment key={h.rowId}>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-2 font-mono text-xs">{h.jobName}</td>
                        <td className="p-2 text-xs">{h.jobType}</td>
                        <td className="p-2 text-xs">{h.lastStatus}</td>
                        <td className="p-2 text-xs whitespace-nowrap">
                          {new Date(h.lastStartedAt).toLocaleString()}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setExpandedHealth((x) => (x === h.rowId ? null : h.rowId))
                              }
                            >
                              {expandedHealth === h.rowId ? 'Hide' : 'Details'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="gap-1"
                              onClick={() => investigateHealthRow(h)}
                            >
                              <Search className="h-3 w-3" />
                              Investigate
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1"
                              disabled={replayMut.isPending}
                              onClick={() => replayMut.mutate(h.rowId)}
                            >
                              <Play className="h-3 w-3" />
                              Replay
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedHealth === h.rowId && (
                        <tr className="bg-gray-50 dark:bg-gray-950/50">
                          <td colSpan={5} className="p-3 text-xs space-y-2">
                            {h.errorMessage && (
                              <div>
                                <span className="font-semibold text-red-600">Error: </span>
                                {h.errorMessage}
                              </div>
                            )}
                            {h.stackTrace && (
                              <LinkedStackTrace
                                text={h.stackTrace}
                                settings={editorLinkSettings}
                                className="font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-auto"
                              />
                            )}
                            {!h.errorMessage && !h.stackTrace && (
                              <span className="text-gray-500">No error payload for this run.</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              {healthMatrixQ.isLoading && (
                <p className="p-6 text-center text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin inline" />
                </p>
              )}
              {!healthMatrixQ.isLoading && (healthMatrixQ.data?.rows?.length ?? 0) === 0 && (
                <p className="p-6 text-center text-gray-500">
                  No system health rows in this window.
                </p>
              )}
            </div>
            {replayMut.isError && (
              <p className="text-sm text-red-600">
                {(replayMut.error as Error)?.message ||
                  'Replay failed (job may not support replay).'}
              </p>
            )}
            {replayMut.isSuccess && (
              <p className="text-sm text-green-600">{replayMut.data?.message}</p>
            )}
          </section>
        )}
      </PageContainer>
    </div>
  );
}
