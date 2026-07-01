import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerService } from '@/services/career.service';
import { queryKeys } from '@/lib/react-query/query-keys';

export type JobScrapeRunsListFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
};

const ACTIVE_RUN_STATUSES = new Set(['queued', 'running']);

export function useCareerJobScrapeRuns(filters: JobScrapeRunsListFilters = {}) {
  const qc = useQueryClient();
  const listKey = queryKeys.careerResume.jobScrapeRunsList(filters);

  const runs = useQuery({
    queryKey: listKey,
    queryFn: () => careerService.listJobScrapeRuns(filters),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasActive = items.some((r) => ACTIVE_RUN_STATUSES.has(r.status));
      return hasActive ? 4000 : false;
    },
  });

  const start = useMutation({
    mutationFn: (body?: { sourceIds?: string[] }) => careerService.startJobScrapeRun(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobScrapeRunsPrefix() });
    },
  });

  return { runs, start, listKey };
}

export function useCareerJobScrapeRunDetail(runId: string | null) {
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: queryKeys.careerResume.jobScrapeRunDetail(runId ?? ''),
    queryFn: () => careerService.getJobScrapeRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ACTIVE_RUN_STATUSES.has(status) ? 4000 : false;
    },
  });

  const relevant = useQuery({
    queryKey: queryKeys.careerResume.jobPostingsList({
      scrapeRunId: runId,
      fitStatus: 'relevant',
      pageSize: 50,
    }),
    queryFn: () =>
      careerService.listJobPostings({
        scrapeRunId: runId ?? undefined,
        fitStatus: 'relevant',
        pageSize: 50,
      }),
    enabled: Boolean(runId),
  });

  const irrelevant = useQuery({
    queryKey: queryKeys.careerResume.jobPostingsList({
      scrapeRunId: runId,
      fitStatus: 'irrelevant',
      pageSize: 50,
    }),
    queryFn: () =>
      careerService.listJobPostings({
        scrapeRunId: runId ?? undefined,
        fitStatus: 'irrelevant',
        pageSize: 50,
      }),
    enabled: Boolean(runId),
  });

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobScrapeRunsPrefix() });
    void qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobPostingsPrefix() });
  };

  return { detail, relevant, irrelevant, invalidateAll };
}
