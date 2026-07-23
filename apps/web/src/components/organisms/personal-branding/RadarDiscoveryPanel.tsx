import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import RadarDiscoveryHistory from '@/components/organisms/personal-branding/RadarDiscoveryHistory';
import RadarDiscoveryRunDetailDialog from '@/components/organisms/personal-branding/RadarDiscoveryRunDetailDialog';
import RadarDiscoverySetupDialog from '@/components/organisms/personal-branding/RadarDiscoverySetupDialog';
import { useRadarDiscoveryParseJob } from '@/hooks/useRadarDiscoveryParseJob';
import { useToast } from '@/hooks/use-toast';
import {
  LIVE_RADAR_DISCOVERY_STATUSES,
  useSignalRadarDiscoveryCandidates,
  useSignalRadarDiscoveryRun,
  useSignalRadarDiscoveryRuns,
  type useSignalRadar,
} from '@/hooks/useSignalRadar';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  canAddDiscoveryCandidateAsItem,
  filterDiscoveryCandidates,
  MAX_DISCOVERY_CANDIDATE_SELECTION,
  radarDiscoveryCandidateFilterParams,
  radarDiscoveryDisplayCounts,
  type RadarDiscoveryCandidateFilter,
} from '@/lib/personal-branding/radar-discovery';
import type {
  RadarDiscoveryRun,
  StartRadarDiscoveryRunInput,
} from '@/types/api/personal-branding.dto';
import { useQueryClient } from '@tanstack/react-query';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

interface RadarDiscoveryPanelProps {
  signalRadar: SignalRadarHook;
}

function formatRunDetailTitle(run?: RadarDiscoveryRun): string {
  if (!run) return 'Discovery run';
  const started = run.startedAt ?? run.createdAt;
  const startedLabel = started ? new Date(started).toLocaleString() : 'Unknown start time';
  return `Discovery run · ${run.status} · ${startedLabel}`;
}

function LiveDiscoveryProgressBanner({
  run,
  onShowProgress,
}: {
  run: RadarDiscoveryRun;
  onShowProgress: () => void;
}) {
  const counts = radarDiscoveryDisplayCounts(run.progress);
  const queryPercent =
    counts.queriesTotal > 0 ? Math.round((counts.queriesCompleted / counts.queriesTotal) * 100) : 0;

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Discovery in progress: <strong>{run.currentActivity ?? run.phase}</strong>
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={onShowProgress}>
          Show progress
        </Button>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/40"
        role="progressbar"
        aria-valuenow={queryPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Discovery query progress"
      >
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${queryPercent}%` }}
        />
      </div>
      <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
        Queries: {counts.queriesCompleted}/{counts.queriesTotal} · Candidates evaluated:{' '}
        {counts.candidatesEvaluated}/{counts.candidatesTotal}
      </p>
    </div>
  );
}

export default function RadarDiscoveryPanel({ signalRadar }: RadarDiscoveryPanelProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateFilter, setCandidateFilter] = useState<RadarDiscoveryCandidateFilter>('all');
  const [pendingAction, setPendingAction] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);
  const [addingCandidateId, setAddingCandidateId] = useState<string | null>(null);
  const [markingCandidateId, setMarkingCandidateId] = useState<string | null>(null);
  const [dismissingCandidateId, setDismissingCandidateId] = useState<string | null>(null);
  const [parsingCandidateId, setParsingCandidateId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'add' | 'dismiss' | 'not-a-source' | null>(null);
  const [activeParseJobId, setActiveParseJobId] = useState<string | null>(null);
  const [activeParseRunId, setActiveParseRunId] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  const { runs } = useSignalRadarDiscoveryRuns({ page: historyPage, pageSize: 10 });
  const runRows = useMemo(() => runs.data?.data ?? [], [runs.data?.data]);
  const liveRun = useMemo(
    () => runRows.find((run) => LIVE_RADAR_DISCOVERY_STATUSES.has(run.status)) ?? null,
    [runRows]
  );

  const activeQueryRunId = detailOpen && selectedRunId ? selectedRunId : null;
  const { detail } = useSignalRadarDiscoveryRun(activeQueryRunId);
  const selectedListRun = runRows.find((run) => run.runId === selectedRunId);
  const selectedRun = detail.data ?? selectedListRun;
  const candidateParams = useMemo(
    () => radarDiscoveryCandidateFilterParams(candidateFilter),
    [candidateFilter]
  );
  const { candidates } = useSignalRadarDiscoveryCandidates(
    activeQueryRunId,
    { page: candidatePage, pageSize: 20, ...candidateParams },
    selectedRun
  );
  const candidatePageData = useMemo(() => {
    if (!candidates.data) return undefined;
    if (candidateFilter !== 'duplicate') return candidates.data;
    const rows = filterDiscoveryCandidates(candidates.data.data, candidateFilter);
    return {
      ...candidates.data,
      data: rows,
      total: rows.length,
      hasMore: false,
    };
  }, [candidateFilter, candidates.data]);

  const candidateRows = candidatePageData?.data ?? [];

  useEffect(() => {
    setSelectedCandidateIds([]);
  }, [candidateFilter, candidatePage, selectedRunId]);

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((current) => {
      if (current.includes(candidateId)) {
        return current.filter((id) => id !== candidateId);
      }
      if (current.length >= MAX_DISCOVERY_CANDIDATE_SELECTION) return current;
      return [...current, candidateId];
    });
  };

  const selectAllVisibleCandidates = () => {
    const visibleIds = candidateRows
      .slice(0, MAX_DISCOVERY_CANDIDATE_SELECTION)
      .map((candidate) => candidate.id);
    setSelectedCandidateIds(visibleIds);
  };

  const clearCandidateSelection = () => {
    setSelectedCandidateIds([]);
  };

  useRadarDiscoveryParseJob(
    activeParseJobId,
    async (job) => {
      const runId = activeParseRunId ?? job.runId;
      if (runId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.personalBranding.radarDiscovery.candidates(runId),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.personalBranding.radarDiscovery.detail(runId),
        });
      }
      setActiveParseJobId(null);
      setActiveParseRunId(null);
      setParsingCandidateId(null);
      if (job.status === 'succeeded') {
        showToast({
          type: 'success',
          title:
            job.verifiedCount > 0
              ? `Found ${job.verifiedCount} verified source${job.verifiedCount === 1 ? '' : 's'}`
              : 'Parse complete',
          message:
            job.verifiedCount > 0
              ? 'New candidates were added to the review list.'
              : (job.currentActivity ??
                'No verified RSS or API endpoints were found on this page.'),
        });
        return;
      }
      if (job.status === 'failed') {
        showToast({
          type: 'error',
          title: 'Parse failed',
          message: job.error ?? job.currentActivity ?? 'Could not parse sources from this page.',
        });
      }
    },
    () => {
      setActiveParseJobId(null);
      setActiveParseRunId(null);
      setParsingCandidateId(null);
      showToast({
        type: 'info',
        title: 'Parse still running',
        message: 'The job is taking longer than expected. Refresh candidate review shortly.',
      });
    }
  );

  const openRunDetail = (runId: string) => {
    setSelectedRunId(runId);
    setCandidatePage(1);
    setCandidateFilter('all');
    setSelectedCandidateIds([]);
    setDetailOpen(true);
  };

  const handleStart = async (input: StartRadarDiscoveryRunInput) => {
    try {
      const run = await signalRadar.startDiscovery.mutateAsync(input);
      setHistoryPage(1);
      openRunDetail(run.runId);
      setSetupOpen(false);
      showToast({
        type: 'success',
        title: 'Discovery queued',
        message: 'The request succeeded; progress will continue in the background.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not queue discovery',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const handleDelete = async (run: RadarDiscoveryRun) => {
    const startedLabel = new Date(run.startedAt ?? run.createdAt).toLocaleString();
    if (!window.confirm(`Remove this discovery run from ${startedLabel}?`)) return;
    setDeletingRunId(run.runId);
    try {
      await signalRadar.deleteDiscovery.mutateAsync(run.runId);
      if (selectedRunId === run.runId) {
        setSelectedRunId(null);
        setDetailOpen(false);
      }
      showToast({ type: 'success', title: 'Discovery run removed' });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not remove discovery run',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setDeletingRunId(null);
    }
  };

  const handleControl = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!selectedRunId) return;
    setPendingAction(action);
    try {
      const updated = await signalRadar.controlDiscovery.mutateAsync({
        runId: selectedRunId,
        action,
      });
      showToast({
        type: 'info',
        title:
          action === 'pause'
            ? 'Pause requested'
            : action === 'resume'
              ? 'Continue requested'
              : 'Cancel requested',
        message: `The request succeeded. Current job status: ${updated.status}.`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Discovery control failed',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleSave = async (candidateId: string) => {
    if (!selectedRunId) return;
    setSavingCandidateId(candidateId);
    try {
      await signalRadar.saveDiscoveryCandidate.mutateAsync({ runId: selectedRunId, candidateId });
      showToast({
        type: 'success',
        title: 'Source saved',
        message: 'The candidate is now available in the source list.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not save source',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingCandidateId(null);
    }
  };

  const handleAddAsItem = async (candidateId: string) => {
    if (!selectedRunId) return;
    setAddingCandidateId(candidateId);
    try {
      await signalRadar.addDiscoveryCandidateAsItem.mutateAsync({
        runId: selectedRunId,
        candidateId,
      });
      showToast({
        type: 'success',
        title: 'Added to Trend Stream',
        message: 'The article is now available as a Trend Stream card.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not add Trend Stream card',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setAddingCandidateId(null);
    }
  };

  const handleMarkNotASource = async (candidateId: string) => {
    if (!selectedRunId) return;
    setMarkingCandidateId(candidateId);
    try {
      await signalRadar.markDiscoveryCandidateNotASource.mutateAsync({
        runId: selectedRunId,
        candidateId,
      });
      showToast({
        type: 'success',
        title: 'Marked not a source',
        message: 'Future discovery runs will skip this and similar results.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not mark candidate',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setMarkingCandidateId(null);
    }
  };

  const handleDismiss = async (candidateId: string) => {
    if (!selectedRunId) return;
    setDismissingCandidateId(candidateId);
    try {
      await signalRadar.dismissDiscoveryCandidate.mutateAsync({
        runId: selectedRunId,
        candidateId,
      });
      setSelectedCandidateIds((current) => current.filter((id) => id !== candidateId));
      showToast({
        type: 'success',
        title: 'Candidate discarded',
        message: 'Removed from this review list.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not discard candidate',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setDismissingCandidateId(null);
    }
  };

  const runBulkCandidateAction = async (
    action: 'add' | 'dismiss' | 'not-a-source',
    candidateIds: string[],
    mutate: (candidateId: string) => Promise<unknown>
  ) => {
    if (!selectedRunId || candidateIds.length === 0) return;
    setBulkAction(action);
    const results = await Promise.allSettled(
      candidateIds.map((candidateId) => mutate(candidateId))
    );
    const succeeded = results.filter((result) => result.status === 'fulfilled').length;
    const failed = results.length - succeeded;
    setBulkAction(null);
    setSelectedCandidateIds((current) => current.filter((id) => !candidateIds.includes(id)));

    if (failed === 0) {
      showToast({
        type: 'success',
        title:
          action === 'add'
            ? `Added ${succeeded} Trend Stream card${succeeded === 1 ? '' : 's'}`
            : action === 'dismiss'
              ? `Discarded ${succeeded} candidate${succeeded === 1 ? '' : 's'}`
              : `Marked ${succeeded} not a source`,
      });
      return;
    }

    showToast({
      type: failed === results.length ? 'error' : 'info',
      title: 'Bulk action completed with issues',
      message: `${succeeded} succeeded, ${failed} failed.`,
    });
  };

  const handleBulkAddAsItem = async () => {
    const eligibleIds = candidateRows
      .filter(
        (candidate) =>
          selectedCandidateIds.includes(candidate.id) && canAddDiscoveryCandidateAsItem(candidate)
      )
      .map((candidate) => candidate.id);
    const skipped = selectedCandidateIds.length - eligibleIds.length;
    if (eligibleIds.length === 0) {
      showToast({
        type: 'info',
        title: 'No eligible candidates',
        message: 'Selected candidates cannot be added as Trend Stream cards.',
      });
      return;
    }
    await runBulkCandidateAction('add', eligibleIds, (candidateId) =>
      signalRadar.addDiscoveryCandidateAsItem.mutateAsync({
        runId: selectedRunId!,
        candidateId,
      })
    );
    if (skipped > 0) {
      showToast({
        type: 'info',
        title: 'Some candidates skipped',
        message: `${skipped} selected candidate${skipped === 1 ? '' : 's'} could not be added.`,
      });
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedCandidateIds.length === 0) return;
    const count = selectedCandidateIds.length;
    if (
      !window.confirm(
        `Remove ${count} candidate${count === 1 ? '' : 's'} from this review? They will not teach future runs.`
      )
    ) {
      return;
    }
    await runBulkCandidateAction('dismiss', selectedCandidateIds, (candidateId) =>
      signalRadar.dismissDiscoveryCandidate.mutateAsync({
        runId: selectedRunId!,
        candidateId,
      })
    );
  };

  const handleBulkNotASource = async () => {
    if (selectedCandidateIds.length === 0) return;
    const count = selectedCandidateIds.length;
    if (
      !window.confirm(
        `Mark ${count} candidate${count === 1 ? '' : 's'} as not a source? Future discovery runs will skip matching URLs and use them as negative examples.`
      )
    ) {
      return;
    }
    await runBulkCandidateAction('not-a-source', selectedCandidateIds, (candidateId) =>
      signalRadar.markDiscoveryCandidateNotASource.mutateAsync({
        runId: selectedRunId!,
        candidateId,
      })
    );
  };

  const handleParseSources = async (candidateId: string) => {
    if (!selectedRunId) return;
    setParsingCandidateId(candidateId);
    try {
      const job = await signalRadar.parseDiscoveryCandidateSources.mutateAsync({
        runId: selectedRunId,
        candidateId,
      });
      setActiveParseJobId(job.jobId);
      setActiveParseRunId(selectedRunId);
      showToast({
        type: 'success',
        title: 'Parse queued',
        message: 'Reading page content and searching for RSS feeds and APIs.',
      });
    } catch (error) {
      setParsingCandidateId(null);
      showToast({
        type: 'error',
        title: 'Could not start parse',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const profiles = signalRadar.discoveryProfiles.data?.data ?? [];
  const canConfigureDiscovery = signalRadar.settings.data?.hasTavilyKey === true;

  return (
    <section className="space-y-5" aria-labelledby="discovery-history-heading">
      {liveRun && !detailOpen ? (
        <LiveDiscoveryProgressBanner
          run={liveRun}
          onShowProgress={() => openRunDetail(liveRun.runId)}
        />
      ) : null}

      <RadarDiscoveryHistory
        history={runs.data}
        selectedRunId={selectedRunId}
        isLoading={runs.isLoading || runs.isFetching}
        deletingRunId={deletingRunId}
        page={historyPage}
        onPageChange={setHistoryPage}
        onSelect={openRunDetail}
        onDelete={(run) => void handleDelete(run)}
        canRunDiscovery={canConfigureDiscovery}
        onRunDiscovery={() => setSetupOpen(true)}
      />

      <RadarDiscoverySetupDialog
        isOpen={setupOpen}
        profiles={profiles}
        isLoadingProfiles={signalRadar.discoveryProfiles.isLoading}
        isSubmitting={signalRadar.startDiscovery.isPending}
        onClose={() => setSetupOpen(false)}
        onStart={handleStart}
      />

      <RadarDiscoveryRunDetailDialog
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={formatRunDetailTitle(selectedRun)}
        run={selectedRun}
        isRunLoading={detail.isLoading}
        pendingAction={pendingAction}
        onPause={() => void handleControl('pause')}
        onResume={() => void handleControl('resume')}
        onCancel={() => void handleControl('cancel')}
        candidates={candidatePageData}
        candidateFilter={candidateFilter}
        candidatePage={candidatePage}
        isCandidatesLoading={candidates.isLoading || candidates.isFetching}
        candidatesError={candidates.error instanceof Error ? candidates.error : null}
        savingCandidateId={savingCandidateId}
        addingCandidateId={addingCandidateId}
        markingCandidateId={markingCandidateId}
        dismissingCandidateId={dismissingCandidateId}
        parsingCandidateId={parsingCandidateId}
        selectedCandidateIds={selectedCandidateIds}
        bulkAction={bulkAction}
        onCandidateFilterChange={(filter) => {
          setCandidateFilter(filter);
          setCandidatePage(1);
        }}
        onCandidatePageChange={setCandidatePage}
        onToggleCandidateSelected={toggleCandidateSelection}
        onSelectAllVisible={selectAllVisibleCandidates}
        onClearSelection={clearCandidateSelection}
        onBulkAddAsItem={() => void handleBulkAddAsItem()}
        onBulkDismiss={() => void handleBulkDismiss()}
        onBulkNotASource={() => void handleBulkNotASource()}
        onSave={(candidateId) => void handleSave(candidateId)}
        onAddAsItem={(candidateId) => void handleAddAsItem(candidateId)}
        onMarkNotASource={(candidateId) => void handleMarkNotASource(candidateId)}
        onDismiss={(candidateId) => void handleDismiss(candidateId)}
        onParseSources={(candidateId) => void handleParseSources(candidateId)}
      />
    </section>
  );
}
