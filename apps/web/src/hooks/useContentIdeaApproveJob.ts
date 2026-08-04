import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentIdeaApproveJob,
  ContentIdeaApproveJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: ContentIdeaApproveJobStatus[] = ['queued', 'running'];
const DEFAULT_POLL_MS = 2500;
const MAX_POLL_MS = 5 * 60 * 1000;

export function contentIdeaApproveJobPollInterval(
  job?: Pick<ContentIdeaApproveJob, 'status' | 'pollAfterMs'> | null
): number | false {
  if (!job || !POLL_STATUSES.includes(job.status)) return false;
  return Math.min(job.pollAfterMs ?? DEFAULT_POLL_MS, MAX_POLL_MS);
}

export function useContentIdeaApproveJob(
  ideaId: string | null,
  jobId: string | null,
  onTerminal?: (job: ContentIdeaApproveJob) => void,
  onTimeout?: () => void
) {
  const startedAtRef = useRef<number | null>(null);
  const terminalHandledRef = useRef(false);

  const query = useQuery({
    queryKey: queryKeys.personalBranding.contentIdeaApproveJobs.detail(
      ideaId ?? '',
      jobId ?? ''
    ),
    queryFn: () => personalBrandingService.getContentIdeaApproveJob(ideaId!, jobId!),
    enabled: Boolean(ideaId && jobId),
    refetchInterval: (ctx) => {
      const job = ctx.state.data;
      if (!job) return DEFAULT_POLL_MS;
      if (!POLL_STATUSES.includes(job.status)) return false;
      if (startedAtRef.current == null) startedAtRef.current = Date.now();
      if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
        onTimeout?.();
        return false;
      }
      return contentIdeaApproveJobPollInterval(job);
    },
  });

  useEffect(() => {
    if (!jobId) {
      startedAtRef.current = null;
      terminalHandledRef.current = false;
    }
  }, [jobId]);

  useEffect(() => {
    const job = query.data;
    if (!job || terminalHandledRef.current) return;
    if (!POLL_STATUSES.includes(job.status)) {
      terminalHandledRef.current = true;
      onTerminal?.(job);
    }
  }, [query.data, onTerminal]);

  return query;
}
