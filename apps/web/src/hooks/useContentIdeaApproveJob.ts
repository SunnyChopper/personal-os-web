import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { reportTerminalJobClientTimeout } from '@/hooks/useTerminalJobFailureAlert';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentIdeaApproveJob,
  ContentIdeaApproveJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: ContentIdeaApproveJobStatus[] = ['queued', 'running', 'cancelling'];
const DEFAULT_POLL_MS = 2500;
export const CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS = 5 * 60 * 1000;

export function isContentIdeaApproveJobPollable(
  status: ContentIdeaApproveJobStatus | undefined
): boolean {
  return status != null && POLL_STATUSES.includes(status);
}

export function contentIdeaApproveJobPollInterval(
  job?: Pick<ContentIdeaApproveJob, 'status' | 'pollAfterMs'> | null
): number | false {
  if (!job || !POLL_STATUSES.includes(job.status)) return false;
  return Math.min(job.pollAfterMs ?? DEFAULT_POLL_MS, CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS);
}

export function useContentIdeaApproveJob(
  ideaId: string | null,
  jobId: string | null,
  onTerminal?: (job: ContentIdeaApproveJob) => void,
  onTimeout?: () => void
) {
  const queryClient = useQueryClient();
  const startedAtRef = useRef<number | null>(null);
  const notifiedRef = useRef<string | null>(null);
  const timeoutReconcileRef = useRef<string | null>(null);

  const queryKey = queryKeys.personalBranding.contentIdeaApproveJobs.detail(
    ideaId ?? '',
    jobId ?? ''
  );

  useEffect(() => {
    if (ideaId && jobId) {
      startedAtRef.current = Date.now();
      notifiedRef.current = null;
      timeoutReconcileRef.current = null;
      return;
    }
    startedAtRef.current = null;
    notifiedRef.current = null;
    timeoutReconcileRef.current = null;
  }, [ideaId, jobId]);

  const query = useQuery({
    queryKey,
    queryFn: () => personalBrandingService.getContentIdeaApproveJob(ideaId!, jobId!),
    enabled: Boolean(ideaId && jobId),
    refetchIntervalInBackground: true,
    refetchInterval: (ctx) => {
      const job = ctx.state.data;
      if (!ideaId || !jobId || !startedAtRef.current) return false;
      if (Date.now() - startedAtRef.current > CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS) {
        return false;
      }
      return contentIdeaApproveJobPollInterval(job);
    },
  });

  useEffect(() => {
    if (!ideaId || !jobId || !startedAtRef.current) return;
    if (Date.now() - startedAtRef.current <= CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS) return;
    if (!query.data || !POLL_STATUSES.includes(query.data.status)) return;

    const reconcileKey = `${ideaId}:${jobId}`;
    if (timeoutReconcileRef.current === reconcileKey) return;
    timeoutReconcileRef.current = reconcileKey;

    let cancelled = false;
    void (async () => {
      try {
        const reconciled = await personalBrandingService.getContentIdeaApproveJob(ideaId, jobId);
        if (cancelled) return;
        queryClient.setQueryData(queryKey, reconciled);
        if (!POLL_STATUSES.includes(reconciled.status)) return;
        reportTerminalJobClientTimeout(
          'contentIdeaApprove',
          jobId,
          CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS
        );
        onTimeout?.();
      } catch {
        if (cancelled) return;
        reportTerminalJobClientTimeout(
          'contentIdeaApprove',
          jobId,
          CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS
        );
        onTimeout?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ideaId, jobId, query.dataUpdatedAt, query.data, onTimeout, queryClient, queryKey]);

  useEffect(() => {
    const job = query.data;
    if (!job || !jobId) return;
    if (POLL_STATUSES.includes(job.status)) return;
    const key = `${jobId}:${job.status}`;
    if (notifiedRef.current === key) return;
    notifiedRef.current = key;
    onTerminal?.(job);
  }, [query.data, jobId, onTerminal]);

  return query;
}
