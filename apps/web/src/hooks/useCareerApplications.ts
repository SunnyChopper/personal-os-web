import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { careerService } from '@/services/career.service';
import type {
  CareerApplicationDetail,
  CareerRecommendApplicationsResult,
} from '@/types/api/career.types';

export function useCareerApplications(filters?: {
  status?: string;
  search?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const qc = useQueryClient();

  const listKey = queryKeys.careerResume.applicationsList({
    status: filters?.status ?? 'all',
    search: filters?.search ?? '',
    includeArchived: filters?.includeArchived ?? false,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 50,
  });

  const invalidateApps = () =>
    qc.invalidateQueries({ queryKey: queryKeys.careerResume.applicationsPrefix() });

  const listApps = useQuery({
    queryKey: listKey,
    queryFn: () =>
      careerService.listApplications({
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 50,
        status: filters?.status || null,
        search: filters?.search || null,
        includeArchived: filters?.includeArchived,
      }),
  });

  const recommendApplications = useMutation({
    mutationFn: (body: {
      sourceUrl?: string | null;
      rawText?: string | null;
      jobPostingId?: string | null;
      generatedResumeId?: string | null;
      resumeSnapshotName?: string | null;
      resumeSnapshotText?: string | null;
      provider?: string | null;
      model?: string | null;
    }) => careerService.recommendApplications(body),
  });

  const createApplication = useMutation({
    mutationFn: (body: Record<string, unknown>) => careerService.createApplication(body),
    onSuccess: () => void invalidateApps(),
  });

  const patchApplication = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      careerService.patchApplication(id, body),
    onSuccess: (_, v) => {
      void invalidateApps();
      void qc.invalidateQueries({ queryKey: queryKeys.careerResume.applicationDetail(v.id) });
    },
  });

  const addApplicationEvent = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      careerService.addApplicationEvent(id, body),
    onSuccess: (_, v) => {
      void invalidateApps();
      void qc.invalidateQueries({ queryKey: queryKeys.careerResume.applicationDetail(v.id) });
    },
  });

  const rejectionInsights = useMutation({
    mutationFn: ({
      applicationId,
      body,
    }: {
      applicationId: string;
      body: Parameters<typeof careerService.applicationRejectionInsights>[1];
    }) => careerService.applicationRejectionInsights(applicationId, body),
    onSuccess: (_, v) => {
      void invalidateApps();
      void qc.invalidateQueries({
        queryKey: queryKeys.careerResume.applicationDetail(v.applicationId),
      });
    },
  });

  return {
    listApps,
    recommendApplications,
    createApplication,
    patchApplication,
    addApplicationEvent,
    rejectionInsights,
    invalidateApps,
  };
}

export function useCareerApplicationDetail(applicationId: string | null) {
  return useQuery({
    queryKey: applicationId
      ? queryKeys.careerResume.applicationDetail(applicationId)
      : ['career-resume', 'applications', 'detail', 'none'],
    queryFn: () =>
      applicationId
        ? careerService.getApplication(applicationId)
        : Promise.reject(new Error('no id')),
    enabled: Boolean(applicationId),
  });
}

export type CareerRecommendResult = CareerRecommendApplicationsResult;
export type CareerApplicationDetailOut = CareerApplicationDetail;
