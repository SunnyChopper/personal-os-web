import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import RadarDiscoveryCandidateReview from '@/components/organisms/personal-branding/RadarDiscoveryCandidateReview';
import RadarDiscoveryHistory from '@/components/organisms/personal-branding/RadarDiscoveryHistory';
import RadarDiscoveryRunMonitor from '@/components/organisms/personal-branding/RadarDiscoveryRunMonitor';
import RadarDiscoverySetupDialog from '@/components/organisms/personal-branding/RadarDiscoverySetupDialog';
import { useToast } from '@/hooks/use-toast';
import {
  selectDefaultRadarDiscoveryRun,
  useSignalRadarDiscoveryCandidates,
  useSignalRadarDiscoveryRun,
  useSignalRadarDiscoveryRuns,
  type useSignalRadar,
} from '@/hooks/useSignalRadar';
import {
  filterDiscoveryCandidates,
  radarDiscoveryCandidateFilterParams,
  type RadarDiscoveryCandidateFilter,
} from '@/lib/personal-branding/radar-discovery';
import type { StartRadarDiscoveryRunInput } from '@/types/api/personal-branding.dto';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

interface RadarDiscoveryPanelProps {
  signalRadar: SignalRadarHook;
}

export default function RadarDiscoveryPanel({ signalRadar }: RadarDiscoveryPanelProps) {
  const { showToast } = useToast();
  const [setupOpen, setSetupOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateFilter, setCandidateFilter] = useState<RadarDiscoveryCandidateFilter>('all');
  const [pendingAction, setPendingAction] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);

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
            onFilterChange={(filter) => {
              setCandidateFilter(filter);
              setCandidatePage(1);
            }}
            onPageChange={setCandidatePage}
            onSave={(candidateId) => void handleSave(candidateId)}
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
