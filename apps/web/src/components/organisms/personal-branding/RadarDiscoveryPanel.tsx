import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import RadarDiscoveryCandidateReview from '@/components/organisms/personal-branding/RadarDiscoveryCandidateReview';
import RadarDiscoveryHistory from '@/components/organisms/personal-branding/RadarDiscoveryHistory';
import RadarDiscoveryRunMonitor from '@/components/organisms/personal-branding/RadarDiscoveryRunMonitor';
import RadarDiscoverySetupDialog from '@/components/organisms/personal-branding/RadarDiscoverySetupDialog';
import { useRadarDiscoveryParseJob } from '@/hooks/useRadarDiscoveryParseJob';
import { useToast } from '@/hooks/use-toast';
import {
  selectDefaultRadarDiscoveryRun,
  useSignalRadarDiscoveryCandidates,
  useSignalRadarDiscoveryRun,
  useSignalRadarDiscoveryRuns,
  type useSignalRadar,
} from '@/hooks/useSignalRadar';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  filterDiscoveryCandidates,
  radarDiscoveryCandidateFilterParams,
  type RadarDiscoveryCandidateFilter,
} from '@/lib/personal-branding/radar-discovery';
import type { StartRadarDiscoveryRunInput } from '@/types/api/personal-branding.dto';
import { useQueryClient } from '@tanstack/react-query';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

interface RadarDiscoveryPanelProps {
  signalRadar: SignalRadarHook;
}

export default function RadarDiscoveryPanel({ signalRadar }: RadarDiscoveryPanelProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateFilter, setCandidateFilter] = useState<RadarDiscoveryCandidateFilter>('all');
  const [pendingAction, setPendingAction] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);
  const [addingCandidateId, setAddingCandidateId] = useState<string | null>(null);
  const [markingCandidateId, setMarkingCandidateId] = useState<string | null>(null);
  const [parsingCandidateId, setParsingCandidateId] = useState<string | null>(null);
  const [activeParseJobId, setActiveParseJobId] = useState<string | null>(null);
  const [activeParseRunId, setActiveParseRunId] = useState<string | null>(null);

  const { runs } = useSignalRadarDiscoveryRuns({ page: historyPage, pageSize: 10 });
  const runRows = useMemo(() => runs.data?.data ?? [], [runs.data?.data]);

  useEffect(() => {
    if (selectedRunId || runRows.length === 0) return;
    setSelectedRunId(selectDefaultRadarDiscoveryRun(runRows)?.runId ?? null);
  }, [runRows, selectedRunId]);

  const { detail } = useSignalRadarDiscoveryRun(selectedRunId);
  const selectedListRun = runRows.find((run) => run.runId === selectedRunId);
  const selectedRun = detail.data ?? selectedListRun;
  const candidateParams = useMemo(
    () => radarDiscoveryCandidateFilterParams(candidateFilter),
    [candidateFilter]
  );
  const { candidates } = useSignalRadarDiscoveryCandidates(
    selectedRunId,
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

  const handleStart = async (input: StartRadarDiscoveryRunInput) => {
    try {
      const run = await signalRadar.startDiscovery.mutateAsync(input);
      setSelectedRunId(run.runId);
      setHistoryPage(1);
      setCandidatePage(1);
      setCandidateFilter('all');
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
    <section className="space-y-5" aria-labelledby="source-discovery-heading">
      <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="source-discovery-heading"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Durable source discovery
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Grounded searches continue across reloads, with progress, controls, and candidate review
            persisted by the backend.
          </p>
          {!canConfigureDiscovery ? (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Add a Tavily API key in Sync settings before starting discovery.
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setSetupOpen(true)}
          disabled={!canConfigureDiscovery}
          className="shrink-0 gap-2"
        >
          <Sparkles className="size-4" aria-hidden />
          Run discovery
        </Button>
      </div>

      {selectedRunId ? (
        <>
          <RadarDiscoveryRunMonitor
            run={selectedRun}
            isLoading={detail.isLoading}
            pendingAction={pendingAction}
            onPause={() => void handleControl('pause')}
            onResume={() => void handleControl('resume')}
            onCancel={() => void handleControl('cancel')}
          />
          <RadarDiscoveryCandidateReview
            candidates={candidatePageData}
            filter={candidateFilter}
            page={candidatePage}
            isLoading={candidates.isLoading || candidates.isFetching}
            error={candidates.error instanceof Error ? candidates.error : null}
            savingCandidateId={savingCandidateId}
            addingCandidateId={addingCandidateId}
            markingCandidateId={markingCandidateId}
            parsingCandidateId={parsingCandidateId}
            onFilterChange={(filter) => {
              setCandidateFilter(filter);
              setCandidatePage(1);
            }}
            onPageChange={setCandidatePage}
            onSave={(candidateId) => void handleSave(candidateId)}
            onAddAsItem={(candidateId) => void handleAddAsItem(candidateId)}
            onMarkNotASource={(candidateId) => void handleMarkNotASource(candidateId)}
            onParseSources={(candidateId) => void handleParseSources(candidateId)}
          />
        </>
      ) : null}

      <RadarDiscoveryHistory
        history={runs.data}
        selectedRunId={selectedRunId}
        isLoading={runs.isLoading || runs.isFetching}
        page={historyPage}
        onPageChange={setHistoryPage}
        onSelect={(runId) => {
          setSelectedRunId(runId);
          setCandidatePage(1);
          setCandidateFilter('all');
        }}
      />

      <RadarDiscoverySetupDialog
        isOpen={setupOpen}
        profiles={profiles}
        isLoadingProfiles={signalRadar.discoveryProfiles.isLoading}
        isSubmitting={signalRadar.startDiscovery.isPending}
        onClose={() => setSetupOpen(false)}
        onStart={handleStart}
      />
    </section>
  );
}
