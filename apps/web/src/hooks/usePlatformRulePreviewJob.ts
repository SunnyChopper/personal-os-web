import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { reportTerminalJobClientTimeout } from '@/hooks/useTerminalJobFailureAlert';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  PlatformRulePreviewJob,
  PlatformRulePreviewJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: PlatformRulePreviewJobStatus[] = [
  'queued',
  'drafting',
  'critiquing',
  'polishing',
  'validating',
  'cancelling',
];
const DEFAULT_POLL_MS = 2500;
export const PLATFORM_RULE_PREVIEW_CLIENT_WAIT_BUDGET_MS = 5 * 60 * 1000;

export function isPlatformRulePreviewJobPollable(
  status: PlatformRulePreviewJobStatus | undefined
): boolean {
  return status != null && POLL_STATUSES.includes(status);
}

export function platformRulePreviewJobPollInterval(
  job?: Pick<PlatformRulePreviewJob, 'status' | 'pollAfterMs'> | null
): number | false {
  if (!job || !isPlatformRulePreviewJobPollable(job.status)) return false;
  return Math.min(job.pollAfterMs ?? DEFAULT_POLL_MS, PLATFORM_RULE_PREVIEW_CLIENT_WAIT_BUDGET_MS);
}

export function usePlatformRulePreviewJob(
  jobId: string | null,
  onTerminal?: (job: PlatformRulePreviewJob) => void,
  onTimeout?: () => void
) {
  const queryClient = useQueryClient();
  const startedAtRef = useRef<number | null>(null);
  const notifiedRef = useRef<string | null>(null);
  const timeoutReconcileRef = useRef<string | null>(null);
  const queryKey = queryKeys.personalBranding.platformRulePreviewJobs.detail(jobId ?? '');

  useEffect(() => {
    if (jobId) {
      startedAtRef.current = Date.now();
      notifiedRef.current = null;
      timeoutReconcileRef.current = null;
      return;
    }
    startedAtRef.current = null;
    notifiedRef.current = null;
    timeoutReconcileRef.current = null;
  }, [jobId]);

  const query = useQuery({
    queryKey,
    queryFn: () => personalBrandingService.getPlatformRulePreviewJob(jobId!),
    enabled: Boolean(jobId),
    refetchIntervalInBackground: true,
    refetchInterval: (ctx) => {
      const job = ctx.state.data;
      if (!jobId || !startedAtRef.current) return false;
      if (Date.now() - startedAtRef.current > PLATFORM_RULE_PREVIEW_CLIENT_WAIT_BUDGET_MS) {
        return false;
      }
      return platformRulePreviewJobPollInterval(job);
    },
  });

  useEffect(() => {
    if (!jobId || !startedAtRef.current) return;
    if (Date.now() - startedAtRef.current <= PLATFORM_RULE_PREVIEW_CLIENT_WAIT_BUDGET_MS) return;
    if (!query.data || !isPlatformRulePreviewJobPollable(query.data.status)) return;

    const reconcileKey = jobId;
    if (timeoutReconcileRef.current === reconcileKey) return;
    timeoutReconcileRef.current = reconcileKey;

    let cancelled = false;
    void (async () => {
      try {
        const reconciled = await personalBrandingService.getPlatformRulePreviewJob(jobId);
        if (cancelled) return;
        queryClient.setQueryData(queryKey, reconciled);
        if (!isPlatformRulePreviewJobPollable(reconciled.status)) return;
        reportTerminalJobClientTimeout(
          'platformRuleSetPreview',
          jobId,
          PLATFORM_RULE_PREVIEW_CLIENT_WAIT_BUDGET_MS
        );
        onTimeout?.();
      } catch {
        if (cancelled) return;
        reportTerminalJobClientTimeout(
          'platformRuleSetPreview',
          jobId,
          PLATFORM_RULE_PREVIEW_CLIENT_WAIT_BUDGET_MS
        );
        onTimeout?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, onTimeout, query.data, query.dataUpdatedAt, queryClient, queryKey]);

  useEffect(() => {
    const job = query.data;
    if (!job || !jobId || isPlatformRulePreviewJobPollable(job.status)) return;
    const key = `${jobId}:${job.status}`;
    if (notifiedRef.current === key) return;
    notifiedRef.current = key;
    onTerminal?.(job);
  }, [jobId, onTerminal, query.data]);

  return query;
}
