import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentKeywordOptimizationJob,
  ContentKeywordOptimizationJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: ContentKeywordOptimizationJobStatus[] = ['queued', 'running'];
const DEFAULT_POLL_MS = 2500;
const MAX_POLL_MS = 120_000;

export function keywordOptimizationJobPollInterval(
  job?: Pick<ContentKeywordOptimizationJob, 'status' | 'pollAfterMs'> | null
): number | false {
  if (!job || !POLL_STATUSES.includes(job.status)) return false;
  return Math.min(job.pollAfterMs ?? DEFAULT_POLL_MS, MAX_POLL_MS);
}

export function useKeywordOptimizationJob(
  contentId: string | null,
  jobId: string | null,
  onTerminal?: (job: ContentKeywordOptimizationJob) => void,
  onTimeout?: () => void
) {
  const startedAtRef = useRef<number | null>(null);
  const terminalHandledRef = useRef(false);

  const query = useQuery({
    queryKey: queryKeys.personalBranding.keywordOptimizationJobs.detail(
      contentId ?? '',
      jobId ?? ''
    ),
    queryFn: () => personalBrandingService.getKeywordOptimizationJob(contentId!, jobId!),
    enabled: Boolean(contentId && jobId),
    refetchInterval: (ctx) => {
      const job = ctx.state.data;
      if (!job) return DEFAULT_POLL_MS;
      if (!POLL_STATUSES.includes(job.status)) return false;
      if (startedAtRef.current == null) startedAtRef.current = Date.now();
      if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
        onTimeout?.();
        return false;
      }
      return keywordOptimizationJobPollInterval(job);
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
