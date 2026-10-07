import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  keepPreviousData,
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AlertTriangle, BarChart2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import Button from '@/components/atoms/Button';
import HealthJobsTable from '@/components/molecules/observability/HealthJobsTable';
import HealthSummaryStrip from '@/components/molecules/observability/HealthSummaryStrip';
import { useEditorLinkSettings } from '@/hooks/useEditorLinkSettings';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { assistantSandboxService } from '@/services/assistant-sandbox.service';
import { observabilityService } from '@/services/observability.service';
import { cn } from '@/lib/utils';
import type { ObservabilityHealthRow } from '@/types/observability';
import BurnBreakdownTable from '@/components/molecules/observability/BurnBreakdownTable';
import BurnDailyChart from '@/components/molecules/observability/BurnDailyChart';
import BurnKpiStrip from '@/components/molecules/observability/BurnKpiStrip';
import { analyzeBurnSpikes } from '@/lib/observability/burn-chart';
import CostGuardrailsPanel from '@/components/organisms/observability/CostGuardrailsPanel';
import ExecutionDetailModal from '@/components/organisms/observability/ExecutionDetailModal';
import ExecutionLogFilters from '@/components/molecules/observability/ExecutionLogFilters';
import ExecutionLogPagination from '@/components/molecules/observability/ExecutionLogPagination';
import ExecutionLogTable from '@/components/molecules/observability/ExecutionLogTable';
import {
  EMPTY_EXECUTION_LOG_FILTERS,
  type ExecutionLogFilterFields,
} from '@/lib/observability/execution-log-filters';
import { COACH_RELIABILITY_EXECUTION_FILTERS } from '@/lib/observability/coach-reliability';
import {
  OBS_TAB_BUTTON_ID,
  OBS_TAB_ORDER,
  OBS_TAB_PANEL_ID,
  TAB_FADE_DURATION_S,
  obsAnomalyBannerClassName,
  obsPanelPaddedClassName,
  obsSectionTitleClassName,
  obsTabClassName,
  obsTabListClassName,
  obsTabPanelClassName,
  type ObsMainTab,
} from '@/lib/observability/observability-surfaces';

const TAB_ORDER = OBS_TAB_ORDER;
type MainTab = ObsMainTab;

function tabLabel(t: MainTab): string {
  switch (t) {
    case 'burn':
      return 'Burn dashboard';
    case 'cost':
      return 'Cost';
    case 'executions':
      return 'Execution log';
    case 'health':
      return 'Automation health';
    case 'initiative':
      return 'Assistant initiative';
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
  const [groupBy, setGroupBy] = useState<'module' | 'model' | 'provider' | 'feature'>('feature');

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

  const costGuardrailsQ = useQuery({
    queryKey: queryKeys.observability.costGuardrails(),
    queryFn: () => observabilityService.getCostGuardrails(),
    enabled: tab === 'burn' || tab === 'cost',
    staleTime: 30_000,
  });

  const points = seriesQ.data?.points ?? [];
  const burnSpikeAnalysis = useMemo(() => analyzeBurnSpikes(points), [points]);

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
    if (burnSpikeAnalysis.latestSpikeMessage) {
      msgs.push(burnSpikeAnalysis.latestSpikeMessage);
    }
    return msgs;
  }, [summaryQ.data, burnSpikeAnalysis.latestSpikeMessage]);

  const [execPage, setExecPage] = useState(1);
  const [execModule, setExecModule] = useState(() => searchParams.get('module') ?? '');
  const [execFeature, setExecFeature] = useState(() => searchParams.get('feature') ?? '');
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
    const moduleParam = searchParams.get('module');
    if (moduleParam != null) setExecModule(moduleParam);
    const featureParam = searchParams.get('feature');
    if (featureParam != null) setExecFeature(featureParam);
  }, [searchParams]);

  useEffect(() => {
    if (!urlHydratedRef.current) return;
    const next = new URLSearchParams();
    if (tab !== 'burn') next.set('tab', tab);
    if (tab === 'executions') {
      const threadId = execThreadId.trim();
      const runId = execRunId.trim();
      const jobRunId = execJobRunId.trim();
      const module = execModule.trim();
      const feature = execFeature.trim();
      if (threadId) next.set('threadId', threadId);
      if (runId) next.set('runId', runId);
      if (jobRunId) next.set('jobRunId', jobRunId);
      if (module) next.set('module', module);
      if (feature) next.set('feature', feature);
    }
    const nextStr = next.toString();
    if (nextStr !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    tab,
    execThreadId,
    execRunId,
    execJobRunId,
    execModule,
    execFeature,
    searchParams,
    setSearchParams,
  ]);

  const execFilters = useMemo(
    () => ({
      page: execPage,
      pageSize: 50,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      module: execModule.trim() || undefined,
      feature: execFeature.trim() || undefined,
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
      execFeature,
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

  const executionLogFilters = useMemo<ExecutionLogFilterFields>(
    () => ({
      module: execModule,
      feature: execFeature,
      model: execModel,
      provider: execProvider,
      status: execStatus,
      requestId: execRequestId,
      providerRequestId: execProviderRequestId,
      threadId: execThreadId,
      runId: execRunId,
      jobRunId: execJobRunId,
    }),
    [
      execModule,
      execFeature,
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

  const handleExecutionLogFilterChange = useCallback(
    (key: keyof ExecutionLogFilterFields, value: string) => {
      setExecPage(1);
      switch (key) {
        case 'module':
          setExecModule(value);
          break;
        case 'feature':
          setExecFeature(value);
          break;
        case 'model':
          setExecModel(value);
          break;
        case 'provider':
          setExecProvider(value);
          break;
        case 'status':
          setExecStatus(value);
          break;
        case 'requestId':
          setExecRequestId(value);
          break;
        case 'providerRequestId':
          setExecProviderRequestId(value);
          break;
        case 'threadId':
          setExecThreadId(value);
          break;
        case 'runId':
          setExecRunId(value);
          break;
        case 'jobRunId':
          setExecJobRunId(value);
          break;
        default:
          break;
      }
    },
    []
  );

  const clearExecutionLogFilters = useCallback(() => {
    setExecPage(1);
    setExecModule(EMPTY_EXECUTION_LOG_FILTERS.module);
    setExecFeature(EMPTY_EXECUTION_LOG_FILTERS.feature);
    setExecModel(EMPTY_EXECUTION_LOG_FILTERS.model);
    setExecProvider(EMPTY_EXECUTION_LOG_FILTERS.provider);
    setExecStatus(EMPTY_EXECUTION_LOG_FILTERS.status);
    setExecRequestId(EMPTY_EXECUTION_LOG_FILTERS.requestId);
    setExecProviderRequestId(EMPTY_EXECUTION_LOG_FILTERS.providerRequestId);
    setExecThreadId(EMPTY_EXECUTION_LOG_FILTERS.threadId);
    setExecRunId(EMPTY_EXECUTION_LOG_FILTERS.runId);
    setExecJobRunId(EMPTY_EXECUTION_LOG_FILTERS.jobRunId);
  }, []);

  const applyCoachReliabilityPreset = useCallback(() => {
    setTab('executions');
    setExecPage(1);
    setExecModule(COACH_RELIABILITY_EXECUTION_FILTERS.module);
    setExecFeature(COACH_RELIABILITY_EXECUTION_FILTERS.feature);
  }, []);

  const invalidateBurn = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.observability.all });
  };

  const shouldReduceMotion = useReducedMotion();
  const globalFetching = useIsFetching({ queryKey: queryKeys.observability.all }) > 0;

  const tabFetching = useMemo(() => {
    if (tab === 'burn') {
      return summaryQ.isFetching || seriesQ.isFetching || breakdownQ.isFetching;
    }
    if (tab === 'cost') {
      return costGuardrailsQ.isFetching;
    }
    if (tab === 'executions') {
      return listQ.isFetching;
    }
    if (tab === 'health') {
      return healthSummaryQ.isFetching || healthMatrixQ.isFetching;
    }
    return false;
  }, [
    tab,
    summaryQ.isFetching,
    seriesQ.isFetching,
    breakdownQ.isFetching,
    costGuardrailsQ.isFetching,
    listQ.isFetching,
    healthSummaryQ.isFetching,
    healthMatrixQ.isFetching,
  ]);

  const isRefreshing = globalFetching || tabFetching;

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
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            onClick={() => invalidateBurn()}
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && !shouldReduceMotion && 'animate-spin')}
              aria-hidden
            />
            {isRefreshing && shouldReduceMotion ? 'Refreshing…' : 'Refresh'}
          </Button>
        </header>

        <div role="tablist" aria-label="Observability sections" className={obsTabListClassName}>
          {TAB_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={OBS_TAB_BUTTON_ID[t]}
              aria-selected={tab === t}
              aria-controls={OBS_TAB_PANEL_ID[t]}
              className={obsTabClassName(tab === t)}
              onClick={() => setTab(t)}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key={tab}
            id={OBS_TAB_PANEL_ID[tab]}
            role="tabpanel"
            aria-labelledby={OBS_TAB_BUTTON_ID[tab]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : TAB_FADE_DURATION_S }}
            className={obsTabPanelClassName}
          >
            {tab === 'burn' && (
              <section className="space-y-6" aria-labelledby="burn-heading">
                <h2 id="burn-heading" className="sr-only">
                  Burn dashboard
                </h2>

                <BurnKpiStrip
                  summary={summaryQ.data}
                  points={points}
                  isLoading={summaryQ.isFetching && !summaryQ.data}
                />

                {anomalies.length > 0 && (
                  <div className={cn(obsAnomalyBannerClassName, 'flex gap-2')}>
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <ul className="text-sm text-amber-900 dark:text-amber-100 list-disc pl-4 space-y-1">
                      {anomalies.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={cn(obsPanelPaddedClassName, 'space-y-3')}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-2',
                      obsSectionTitleClassName
                    )}
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
                            className="rounded border border-gray-300/80 dark:border-gray-600/70 bg-white dark:bg-gray-900/80 px-2 py-1 text-sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-gray-500 flex flex-col gap-1">
                          End
                          <input
                            type="date"
                            className="rounded border border-gray-300/80 dark:border-gray-600/70 bg-white dark:bg-gray-900/80 px-2 py-1 text-sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-gray-500 flex flex-col gap-1">
                          Module
                          <input
                            className="rounded border border-gray-300/80 dark:border-gray-600/70 bg-white dark:bg-gray-900/80 px-2 py-1 text-sm"
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            placeholder="e.g. assistant_ws"
                          />
                        </label>
                        <label className="text-xs text-gray-500 flex flex-col gap-1">
                          Model
                          <input
                            className="rounded border border-gray-300/80 dark:border-gray-600/70 bg-white dark:bg-gray-900/80 px-2 py-1 text-sm"
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-gray-500 flex flex-col gap-1">
                          Provider
                          <input
                            className="rounded border border-gray-300/80 dark:border-gray-600/70 bg-white dark:bg-gray-900/80 px-2 py-1 text-sm"
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

                <BurnDailyChart
                  points={points}
                  isLoading={seriesQ.isFetching && !seriesQ.data}
                  isError={seriesQ.isError}
                />

                <BurnBreakdownTable
                  groupBy={groupBy}
                  onGroupByChange={setGroupBy}
                  rows={breakdownQ.data?.rows ?? []}
                  isLoading={breakdownQ.isLoading}
                  isFetching={breakdownQ.isFetching}
                  isError={breakdownQ.isError}
                  guardrails={costGuardrailsQ.data}
                />
              </section>
            )}

            {tab === 'cost' && <CostGuardrailsPanel />}

            {tab === 'executions' && (
              <section className="space-y-4" aria-labelledby="exec-heading">
                <h2 id="exec-heading" className="sr-only">
                  Execution log
                </h2>

                <ExecutionLogFilters
                  filters={executionLogFilters}
                  onFilterChange={handleExecutionLogFilterChange}
                  onClearFilters={clearExecutionLogFilters}
                  onApplyCoachReliabilityPreset={applyCoachReliabilityPreset}
                />

                <ExecutionLogTable
                  rows={execRows}
                  isLoading={listQ.isLoading}
                  isError={listQ.isError}
                  selectedRowId={detailId}
                  onRowSelect={setDetailId}
                />

                <ExecutionLogPagination
                  page={listQ.data?.page ?? execPage}
                  total={listQ.data?.total ?? 0}
                  pageSize={listQ.data?.pageSize ?? 50}
                  hasMore={listQ.data?.hasMore ?? false}
                  isFetching={listQ.isFetching}
                  onPageChange={setExecPage}
                />

                <ExecutionDetailModal
                  isOpen={Boolean(detailId)}
                  detailId={detailId}
                  detail={detailQ.data}
                  isLoading={detailQ.isLoading}
                  onClose={() => setDetailId(null)}
                  onOpenSandbox={() => {
                    if (detailId) openSandboxM.mutate(detailId);
                  }}
                  onOpenThread={(threadId) => {
                    navigate(`${ROUTES.admin.assistant}/${threadId}`);
                  }}
                  sandboxPending={openSandboxM.isPending}
                  sandboxError={openSandboxM.isError ? (openSandboxM.error as Error).message : null}
                  editorLinkSettings={editorLinkSettings}
                />
              </section>
            )}

            {tab === 'health' && (
              <section className="space-y-4" aria-labelledby="health-heading">
                <h2 id="health-heading" className="sr-only">
                  Automation health
                </h2>

                <HealthSummaryStrip
                  sinceDays={sinceDays}
                  onSinceDaysChange={setSinceDays}
                  summary={healthSummaryQ.data}
                  isLoading={healthSummaryQ.isLoading}
                />

                <HealthJobsTable
                  rows={healthMatrixQ.data?.rows ?? []}
                  expandedRowId={expandedHealth}
                  onToggleDetails={(rowId) =>
                    setExpandedHealth((current) => (current === rowId ? null : rowId))
                  }
                  onInvestigate={investigateHealthRow}
                  onReplay={(jobRunId) => replayMut.mutate(jobRunId)}
                  isReplayPending={replayMut.isPending}
                  isLoading={healthMatrixQ.isLoading}
                  editorLinkSettings={editorLinkSettings}
                />

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

            {tab === 'initiative' && (
              <section className="space-y-4" aria-labelledby="initiative-heading">
                <h2 id="initiative-heading" className="sr-only">
                  Assistant initiative
                </h2>
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Proactive outreach
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    The initiative engine runs every 15 minutes, evaluates signals (coach avoidance,
                    recovery tone, overdue tasks, health actions, meta proposals), and may send
                    multi-bubble messages to your Coach thread when the outreach governor allows.
                  </p>
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                    <li>Governor: daily cap, min gap, quiet hours, per-topic cooldown</li>
                    <li>Delivery: chat thread messages + optional push (mobile)</li>
                    <li>Digest email: batched at local 07:30 when unread outreach exists</li>
                    <li>Outcome scoring: nightly correlation of replies and domain deltas</li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                    Tune caps and quiet hours under Preferences → Assistant initiative. Pending
                    meta-improvement proposals surface in the Coach thread decision cards.
                  </p>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </PageContainer>
    </div>
  );
}
