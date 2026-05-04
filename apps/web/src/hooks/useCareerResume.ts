import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sortJobsByRecency } from '@/lib/career-job-sort';
import { careerService } from '@/services/career.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { CareerJob } from '@/types/api/career.types';

/**
 * React Query bundle for Career / Resume Builder MVP (Postgres-backed `/career/resume/*`).
 */
export function useCareerResume() {
  const qc = useQueryClient();

  const invalidateJobs = () => qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobs() });
  const invalidateEducation = () =>
    qc.invalidateQueries({ queryKey: queryKeys.careerResume.education() });
  const invalidateSuggestions = () =>
    qc.invalidateQueries({ queryKey: queryKeys.careerResume.suggestionsPrefix() });
  const invalidateGenerated = () =>
    qc.invalidateQueries({ queryKey: queryKeys.careerResume.generatedPrefix() });

  const profile = useQuery({
    queryKey: queryKeys.careerResume.profile(),
    queryFn: () => careerService.getProfile(),
  });

  const education = useQuery({
    queryKey: queryKeys.careerResume.education(),
    queryFn: () => careerService.listEducation(),
  });

  const jobs = useQuery({
    queryKey: queryKeys.careerResume.jobs(),
    queryFn: () => careerService.listJobs(),
  });

  const suggestions = useQuery({
    queryKey: queryKeys.careerResume.suggestions({}),
    queryFn: () => careerService.listSuggestions({}),
  });

  const generated = useQuery({
    queryKey: queryKeys.careerResume.generated(50),
    queryFn: () => careerService.listGenerated(50),
  });

  const patchProfile = useMutation({
    mutationFn: careerService.patchProfile,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.careerResume.profile() }),
  });

  const createEducation = useMutation({
    mutationFn: careerService.createEducation,
    onSuccess: invalidateEducation,
  });

  const patchEducation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Record<string, unknown>;
    }) => careerService.patchEducation(id, body),
    onSuccess: invalidateEducation,
  });

  const deleteEducation = useMutation({
    mutationFn: careerService.deleteEducation,
    onSuccess: invalidateEducation,
  });

  const createJob = useMutation({
    mutationFn: careerService.createJob,
    onSuccess: invalidateJobs,
  });

  const patchJob = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      careerService.patchJob(id, body),
    onSuccess: invalidateJobs,
  });

  const deleteJob = useMutation({
    mutationFn: careerService.deleteJob,
    onSuccess: invalidateJobs,
  });

  const createAchievement = useMutation({
    mutationFn: ({ jobId, body }: { jobId: string; body: Record<string, unknown> }) =>
      careerService.createAchievement(jobId, body),
    onSuccess: () => {
      void invalidateJobs();
      void invalidateSuggestions();
    },
  });

  const patchAchievement = useMutation({
    mutationFn: ({
      jobId,
      achievementId,
      body,
    }: {
      jobId: string;
      achievementId: string;
      body: Record<string, unknown>;
    }) => careerService.patchAchievement(jobId, achievementId, body),
    onSuccess: invalidateJobs,
  });

  const deleteAchievement = useMutation({
    mutationFn: ({ jobId, achievementId }: { jobId: string; achievementId: string }) =>
      careerService.deleteAchievement(jobId, achievementId),
    onSuccess: invalidateJobs,
  });

  const aiTags = useMutation({
    mutationFn: ({
      jobId,
      provider,
      model,
    }: {
      jobId: string;
      provider?: string | null;
      model?: string | null;
    }) => careerService.aiTagsForJob(jobId, { provider, model }),
    onSuccess: invalidateSuggestions,
  });

  const aiBrainstorm = useMutation({
    mutationFn: ({
      jobId,
      feedback,
      provider,
      model,
    }: {
      jobId: string;
      feedback?: string | null;
      provider?: string | null;
      model?: string | null;
    }) => careerService.aiBrainstormAchievements(jobId, { feedback, provider, model }),
    onSuccess: invalidateSuggestions,
  });

  const acceptSuggestion = useMutation({
    mutationFn: careerService.acceptSuggestion,
    onSuccess: () => {
      void invalidateJobs();
      void invalidateSuggestions();
    },
  });

  const rejectSuggestion = useMutation({
    mutationFn: ({
      id,
      feedback,
    }: {
      id: string;
      feedback?: string | null;
    }) => careerService.rejectSuggestion(id, feedback),
    onSuccess: invalidateSuggestions,
  });

  const patchSuggestion = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        suggestedText?: string | null;
        suggestedTags?: string[] | null;
        rationale?: string | null;
      };
    }) => careerService.patchSuggestion(id, body),
    onSuccess: invalidateSuggestions,
  });

  const reviseSuggestion = useMutation({
    mutationFn: ({
      id,
      feedback,
      provider,
      model,
    }: {
      id: string;
      feedback?: string | null;
      provider?: string | null;
      model?: string | null;
    }) => careerService.reviseSuggestion(id, { feedback, provider, model }),
    onSuccess: invalidateSuggestions,
  });

  const analyzePosting = useMutation({
    mutationFn: careerService.analyzeJobPosting,
  });

  const generateResume = useMutation({
    mutationFn: careerService.generateResume,
    onSuccess: invalidateGenerated,
  });

  /** Flat achievements for tailoring checkboxes — excludes archived; jobs newest-first. */
  const achievementOptions =
    jobs.data?.items
      ? sortJobsByRecency(jobs.data.items).flatMap((j: CareerJob) =>
          j.achievements.filter((a) => !a.archived).map((a) => ({ job: j, achievement: a }))
        )
      : [];

  return {
    profile,
    education,
    jobs,
    suggestions,
    generated,
    achievementOptions,
    patchProfile,
    createEducation,
    patchEducation,
    deleteEducation,
    createJob,
    patchJob,
    deleteJob,
    createAchievement,
    patchAchievement,
    deleteAchievement,
    aiTags,
    aiBrainstorm,
    acceptSuggestion,
    rejectSuggestion,
    patchSuggestion,
    reviseSuggestion,
    analyzePosting,
    generateResume,
  };
}
