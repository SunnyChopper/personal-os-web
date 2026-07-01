import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerService } from '@/services/career.service';
import { queryKeys } from '@/lib/react-query/query-keys';

export type JobPostingsListFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  provider?: string;
  company?: string;
  sourceId?: string;
  fitStatus?: string;
  search?: string;
};

export function useCareerJobSources(filters: JobPostingsListFilters = {}) {
  const qc = useQueryClient();
  const listKey = queryKeys.careerResume.jobPostingsList(filters);

  const postings = useQuery({
    queryKey: listKey,
    queryFn: () => careerService.listJobPostings(filters),
  });

  const preview = useMutation({
    mutationFn: careerService.previewJobPosting,
  });

  const ingest = useMutation({
    mutationFn: careerService.ingestJobPosting,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobPostingsPrefix() });
    },
  });

  return { postings, preview, ingest, listKey };
}
