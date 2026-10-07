import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { reportTerminalJobClientTimeout } from '@/hooks/useTerminalJobFailureAlert';
import type { PersonalBrandingJobFeature } from '@/lib/personal-branding/report-job-failure';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentIdeationJob,
  ContentIdeationJobStatus,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: ContentIdeationJobStatus[] = ['queued', 'running', 'cancelling'];
const DEFAULT_CLIENT_WAIT_BUDGET_MS = 5 * 60 * 1000;
const KEYWORD_RESEARCH_CLIENT_WAIT_BUDGET_MS = 28 * 60 * 1000;

export function contentIdeationJobPollInterval(
  job?: Pick<ContentIdeationJob, 'status' | 'pollAfterMs'> | null
) {
  if (!job || !POLL_STATUSES.includes(job.status)) return false;
  return Math.max(1500, Math.min(job.pollAfterMs ?? 2000, 5000));
}

function jobObservedKeywordWait(
  job: Pick<ContentIdeationJob, 'stage' | 'keywordResearchStage'> | null | undefined
): boolean {
  if (!job) return false;
  return (
    job.stage === 'waiting_keyword_research' ||
    job.keywordResearchStage === 'accumulating' ||
    job.keywordResearchStage === 'waiting'
  );
}

export function contentIdeationClientWaitBudgetMs(
  job: Pick<ContentIdeationJob, 'stage' | 'keywordResearchStage'> | null | undefined,
  keywordWaitObserved: boolean
): number {
  if (keywordWaitObserved || jobObservedKeywordWait(job)) {
    return KEYWORD_RESEARCH_CLIENT_WAIT_BUDGET_MS;
  }
  return DEFAULT_CLIENT_WAIT_BUDGET_MS;
}

export function useContentIdeationJob(
  jobId: string | null,
  onTerminal?: (job: ContentIdeationJob) => void,
  onClientTimeout?: (job: ContentIdeationJob | null) => void,
  telemetryFeature?: PersonalBrandingJobFeature
) {
  const startedAtRef = useRef<number | null>(null);
  const notifiedRef = useRef<string | null>(null);
  const keywordWaitObservedRef = useRef(false);

  useEffect(() => {
    if (jobId) {
      startedAtRef.current = Date.now();
      notifiedRef.current = null;
      keywordWaitObservedRef.current = false;
      return;
    }
    startedAtRef.current = null;
    notifiedRef.current = null;
    keywordWaitObservedRef.current = false;
  }, [jobId]);

  const query = useQuery({
    queryKey: queryKeys.personalBranding.ideationJobs.detail(jobId ?? ''),
    queryFn: () => personalBrandingService.getContentIdeationJob(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (q) => {
      const job = q.state.data;
      if (!jobId || !startedAtRef.current) return false;
      if (jobObservedKeywordWait(job)) {
        keywordWaitObservedRef.current = true;
      }
      const budgetMs = contentIdeationClientWaitBudgetMs(job, keywordWaitObservedRef.current);
      if (Date.now() - startedAtRef.current > budgetMs) {
        return false;
      }
      return contentIdeationJobPollInterval(job);
    },
  });

  useEffect(() => {
    if (jobObservedKeywordWait(query.data)) {
      keywordWaitObservedRef.current = true;
    }
  }, [query.data]);

  useEffect(() => {
    if (!jobId || !startedAtRef.current) return;
    const budgetMs = contentIdeationClientWaitBudgetMs(query.data, keywordWaitObservedRef.current);
    if (Date.now() - startedAtRef.current <= budgetMs) return;
    if (query.data && POLL_STATUSES.includes(query.data.status)) {
      if (telemetryFeature && jobId) {
        reportTerminalJobClientTimeout(telemetryFeature, jobId, budgetMs);
      }
      onClientTimeout?.(query.data ?? null);
    }
  }, [jobId, query.dataUpdatedAt, query.data, onClientTimeout, telemetryFeature]);

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
