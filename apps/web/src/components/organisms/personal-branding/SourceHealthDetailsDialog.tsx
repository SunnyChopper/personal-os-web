import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getHealthReasonClarification } from '@/components/organisms/personal-branding/radar-source-health-copy';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import RadarSourceHealthIndicator from '@/components/molecules/personal-branding/RadarSourceHealthIndicator';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { useToast } from '@/hooks/use-toast';
import type { useSignalRadar } from '@/hooks/useSignalRadar';
import {
  RADAR_SYNC_CADENCE_LABELS,
  type RadarSource,
  type RadarSourceHealthDetails,
  type RadarSyncCadence,
  type UpdateRadarSourceInput,
} from '@/types/api/personal-branding.dto';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

/** Format a 0–1 ratio as a percent. Uses one decimal when precision warrants it. */
function formatPercent(value: number): string {
  const pct = Math.round(value * 1000) / 10;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

function formatCadenceLabel(cadence: string, intervalHours?: number | null): string {
  if (cadence === 'EVERY_N_HOURS' && intervalHours) {
    return `Every ${intervalHours}h`;
  }
  return RADAR_SYNC_CADENCE_LABELS[cadence as RadarSyncCadence] ?? cadence;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {detail ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{detail}</p> : null}
    </div>
  );
}

export interface SourceHealthDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  source: RadarSource | null;
  signalRadar: SignalRadarHook;
}

export default function SourceHealthDetailsDialog({
  isOpen,
  onClose,
  source,
  signalRadar,
}: SourceHealthDetailsDialogProps) {
  const { showToast } = useToast();
  const sourceId = source?.id ?? '';

  const detailsQuery = useQuery({
    queryKey: queryKeys.personalBranding.radarSources.healthDetails(sourceId),
    queryFn: () => personalBrandingService.getRadarSourceHealthDetails(sourceId),
    enabled: isOpen && Boolean(sourceId),
  });

  const details = detailsQuery.data;
  const healthReasonClarification = details
    ? getHealthReasonClarification(details.healthReason, details.yield)
    : null;
  const isActionPending = signalRadar.updateSource.isPending;

  const runAction = async (label: string, body: UpdateRadarSourceInput, onSuccess?: () => void) => {
    if (!source) return;
    try {
      await signalRadar.updateSource.mutateAsync({ id: source.id, body });
      await detailsQuery.refetch();
      showToast({ type: 'success', title: label });
      onSuccess?.();
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

  const renderActions = (data: RadarSourceHealthDetails) => {
    const bump = data.proposedCadenceBump;
    const bumpLabel = formatCadenceLabel(bump.cadence, bump.cadenceIntervalHours);

    if (!data.enabled || data.health === 'paused') {
      return (
        <Button
          type="button"
          disabled={isActionPending}
          onClick={() => void runAction('Source resumed', { enabled: true })}
        >
          Resume source
        </Button>
      );
    }

    if (data.yield === 'low') {
      return (
        <Button
          type="button"
          variant="secondary"
          disabled={isActionPending}
          onClick={() => void runAction('Source paused', { enabled: false }, onClose)}
        >
          Pause low-yield source
        </Button>
      );
    }

    if (data.yield === 'high') {
      return (
        <Button
          type="button"
          disabled={isActionPending}
          onClick={() =>
            void runAction('Cadence increased', {
              cadence: bump.cadence as RadarSyncCadence,
              cadenceIntervalHours: bump.cadenceIntervalHours ?? undefined,
            })
          }
        >
          Increase cadence on high-yield source ({bumpLabel})
        </Button>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isActionPending}
          onClick={() => void runAction('Source paused', { enabled: false }, onClose)}
        >
          Pause source
        </Button>
        <Button
          type="button"
          disabled={isActionPending}
          onClick={() =>
            void runAction('Cadence increased', {
              cadence: bump.cadence as RadarSyncCadence,
              cadenceIntervalHours: bump.cadenceIntervalHours ?? undefined,
            })
          }
        >
          Increase cadence ({bumpLabel})
        </Button>
      </div>
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={source ? `${source.name} — health` : 'Source health'}
      size="lg"
    >
      {detailsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
          <Loader2 className="size-5 animate-spin" />
          Loading health metrics…
        </div>
      ) : null}

      {detailsQuery.isError ? (
        <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
          {detailsQuery.error instanceof Error
            ? detailsQuery.error.message
            : 'Failed to load health details'}
        </p>
      ) : null}

      {details ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start gap-3">
            <RadarSourceHealthIndicator
              health={details.health}
              healthReason={details.healthReason}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {details.healthReason || 'No health reason available.'}
              </p>
              {healthReasonClarification ? (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {healthReasonClarification}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Last 7 days"
              value={`${details.windows.last7Days.itemsRelevant} relevant`}
              detail={`${details.windows.last7Days.itemsIngested} ingested`}
            />
            <MetricCard
              label="Last 30 days"
              value={`${details.windows.last30Days.itemsRelevant} relevant`}
              detail={`${details.windows.last30Days.itemsIngested} ingested`}
            />
            <MetricCard
              label="User irrelevant"
              value={`${details.userFeedback.last7Days} this week`}
              detail={`${details.userFeedback.last30Days} in last 30 days`}
            />
            <MetricCard
              label="Average AI relevance (30d)"
              value={
                details.averageAiRelevance.score != null
                  ? formatPercent(details.averageAiRelevance.score)
                  : '—'
              }
              detail={
                details.averageAiRelevance.sampleSize > 0
                  ? `${details.averageAiRelevance.sampleSize} assessed items`
                  : 'No assessed items in window'
              }
            />
            <MetricCard
              label="Failure rate (30d)"
              value={formatPercent(details.failureRate.rate)}
              detail={`${details.failureRate.failed} failed of ${details.failureRate.attempted} scrapes`}
            />
            <MetricCard
              label="Brainstorm contribution"
              value={`${details.brainstormContribution.sessionsContributed} of ${details.brainstormContribution.sessionsConsidered}`}
              detail={`${details.brainstormContribution.ideasFromSource} ideas from this source (last ${details.brainstormContribution.windowSize} sessions)`}
            />
            <MetricCard
              label="Yield band"
              value={details.yield}
              detail={details.suggestedCadence.message}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            {renderActions(details)}
          </DialogFooter>
        </div>
      ) : null}
    </Dialog>
  );
}
