import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportTerminalJobClientTimeout } from '@/hooks/useTerminalJobFailureAlert';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentKeywordOptimizationJob,
  ContentKeywordOptimizationJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: ContentKeywordOptimizationJobStatus[] = ['queued', 'running'];
const DEFAULT_POLL_MS = 2500;
const MAX_POLL_INTERVAL_MS = 5000;
const DEFAULT_CLIENT_WAIT_BUDGET_MS = 5 * 60 * 1000;
const KEYWORD_RESEARCH_CLIENT_WAIT_BUDGET_MS = 28 * 60 * 1000;

export function keywordOptimizationJobPollInterval(
  job?: Pick<ContentKeywordOptimizationJob, 'status' | 'pollAfterMs'> | null
): number | false {
  if (!job || !POLL_STATUSES.includes(job.status)) return false;
  return Math.max(1500, Math.min(job.pollAfterMs ?? DEFAULT_POLL_MS, MAX_POLL_INTERVAL_MS));
}

function jobObservedKeywordWait(
  job: Pick<ContentKeywordOptimizationJob, 'stage'> | null | undefined
): boolean {
  return job?.stage === 'waiting_keyword_research';
}

export function keywordOptimizationClientWaitBudgetMs(
  job: Pick<ContentKeywordOptimizationJob, 'stage'> | null | undefined,
  keywordWaitObserved: boolean
): number {
  if (keywordWaitObserved || jobObservedKeywordWait(job)) {
    return KEYWORD_RESEARCH_CLIENT_WAIT_BUDGET_MS;
  }
  return DEFAULT_CLIENT_WAIT_BUDGET_MS;
}

export function useKeywordOptimizationJob(
  contentId: string | null,
  jobId: string | null,
  onTerminal?: (job: ContentKeywordOptimizationJob) => void,
  onTimeout?: () => void
) {
  const startedAtRef = useRef<number | null>(null);
  const terminalHandledRef = useRef(false);
  const notifiedRef = useRef<string | null>(null);
  const keywordWaitObservedRef = useRef(false);

  useEffect(() => {
    if (jobId) {
      startedAtRef.current = Date.now();
      terminalHandledRef.current = false;
      notifiedRef.current = null;
      keywordWaitObservedRef.current = false;
      return;
    }
    startedAtRef.current = null;
    terminalHandledRef.current = false;
    notifiedRef.current = null;
    keywordWaitObservedRef.current = false;
  }, [jobId]);

  const query = useQuery({
    queryKey: queryKeys.personalBranding.keywordOptimizationJobs.detail(
      contentId ?? '',
      jobId ?? ''
    ),
    queryFn: () => personalBrandingService.getKeywordOptimizationJob(contentId!, jobId!),
    enabled: Boolean(contentId && jobId),
    refetchInterval: (ctx) => {
      const job = ctx.state.data;
      if (!jobId || !startedAtRef.current) return false;
      if (jobObservedKeywordWait(job)) {
        keywordWaitObservedRef.current = true;
      }
      const budgetMs = keywordOptimizationClientWaitBudgetMs(job, keywordWaitObservedRef.current);
      if (Date.now() - startedAtRef.current > budgetMs) {
        return false;
      }
      if (!job) return DEFAULT_POLL_MS;
      if (!POLL_STATUSES.includes(job.status)) return false;
      return keywordOptimizationJobPollInterval(job);
    },
  });

  useEffect(() => {
    if (jobObservedKeywordWait(query.data)) {
      keywordWaitObservedRef.current = true;
    }
  }, [query.data]);

  useEffect(() => {
    if (!jobId || !startedAtRef.current) return;
    const budgetMs = keywordOptimizationClientWaitBudgetMs(
      query.data,
      keywordWaitObservedRef.current
    );
    if (Date.now() - startedAtRef.current <= budgetMs) return;
    if (query.data && POLL_STATUSES.includes(query.data.status)) {
      if (notifiedRef.current !== `${jobId}:timeout`) {
        notifiedRef.current = `${jobId}:timeout`;
        reportTerminalJobClientTimeout('contentKeywordOptimize', jobId, budgetMs);
      }
      onTimeout?.();
    }
  }, [jobId, query.dataUpdatedAt, query.data, onTimeout]);

  useEffect(() => {
    const job = query.data;
    if (!job || !jobId || terminalHandledRef.current) return;
    if (!POLL_STATUSES.includes(job.status)) {
      terminalHandledRef.current = true;
      onTerminal?.(job);
    }
  }, [query.data, jobId, onTerminal]);

  return query;
}
