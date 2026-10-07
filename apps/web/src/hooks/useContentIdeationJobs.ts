import { useQueries } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { reportPersonalBrandingJobFailure } from '@/lib/personal-branding/report-job-failure';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type { ContentIdeationJob } from '@/types/api/personal-branding.dto';
import { contentIdeationJobPollInterval } from './useContentIdeationJob';

const TERMINAL_STATUSES = new Set<ContentIdeationJob['status']>([
  'succeeded',
  'failed',
  'cancelled',
]);

export function useContentIdeationJobs(jobIds: string[]) {
  const reportedFailedIdsRef = useRef(new Set<string>());
  const queries = useQueries({
    queries: jobIds.map((jobId) => ({
      queryKey: queryKeys.personalBranding.ideationJobs.detail(jobId),
      queryFn: () => personalBrandingService.getContentIdeationJob(jobId),
      refetchInterval: (query: { state: { data: ContentIdeationJob | undefined } }) =>
        contentIdeationJobPollInterval(query.state.data),
    })),
  });
  const jobs = queries
    .map((query) => query.data)
    .filter((job): job is ContentIdeationJob => Boolean(job));
  const terminalJobs = jobs.filter((job) => TERMINAL_STATUSES.has(job.status));

  useEffect(() => {
    const liveIds = new Set(jobIds);
    for (const id of reportedFailedIdsRef.current) {
      if (!liveIds.has(id)) reportedFailedIdsRef.current.delete(id);
    }
    for (const job of jobs) {
      if (job.status !== 'failed') continue;
      if (reportedFailedIdsRef.current.has(job.jobId)) continue;
      reportedFailedIdsRef.current.add(job.jobId);
      reportPersonalBrandingJobFailure({
        feature: job.source === 'radar' ? 'radarIdeation' : 'contentIdeation',
        jobId: job.jobId,
        error: job.error,
        message: job.message,
        stage: job.stage,
        errorCode: job.errorCode,
        retryable: job.retryable,
      });
    }
  }, [jobIds, jobs]);

  return {
    jobs,
    queries,
    isPending: queries.some((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    allTerminal: jobIds.length > 0 && terminalJobs.length === jobIds.length,
    succeededCount: jobs.filter((job) => job.status === 'succeeded').length,
    failedCount: jobs.filter((job) => job.status === 'failed').length,
  };
}
