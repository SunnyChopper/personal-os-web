import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  BrandProjectIdeaStatus,
  BrandProjectJob,
  BuildKitPatchOperation,
  GenerateBrandProjectsInput,
} from '@/types/api/personal-branding.dto';

const TERMINAL = new Set<BrandProjectJob['status']>(['succeeded', 'failed']);
const KIT_CHANGED_MESSAGE = 'This kit changed and was reloaded. Review it, then try again.';

function isBuildKitConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === 'CONFLICT' || code === 'HTTP_409';
}

function pollMs(job?: BrandProjectJob): number | false {
  if (!job) return 2000;
  if (TERMINAL.has(job.status)) return false;
  return job.pollAfterMs ?? 2500;
}

export function useBrandProjectIdeas(status: BrandProjectIdeaStatus, enabled = true) {
  return useQuery({
    queryKey: queryKeys.personalBranding.projects.ideas(status),
    queryFn: ({ signal }) => personalBrandingService.listBrandProjectIdeas(status, signal),
    enabled,
  });
}

export function useBrandProjectIdea(ideaId: string | undefined) {
  const id = ideaId?.trim() ?? '';
  return useQuery({
    queryKey: queryKeys.personalBranding.projects.idea(id),
    queryFn: ({ signal }) => personalBrandingService.getBrandProjectIdea(id, signal),
    enabled: id.length > 0,
  });
}

export function useReviseBrandProjectIdea(ideaId: string) {
  const qc = useQueryClient();
  const id = ideaId.trim();

  return useMutation({
    mutationFn: (message: string) =>
      personalBrandingService.reviseBrandProjectIdea(id, { message }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.personalBranding.projects.idea(id), data);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.projects.all() });
    },
  });
}

export function useBrandProjectBuildKitPatch(ideaId: string) {
  const qc = useQueryClient();
  const id = ideaId.trim();
  return useMutation({
    mutationFn: async (operations: BuildKitPatchOperation[]) => {
      try {
        return await personalBrandingService.patchBrandProjectBuildKit(id, operations);
      } catch (error) {
        if (!isBuildKitConflict(error)) throw error;
        await qc.refetchQueries({ queryKey: queryKeys.personalBranding.projects.idea(id) });
        throw new Error(KIT_CHANGED_MESSAGE);
      }
    },
    onSuccess: (idea) => {
      qc.setQueryData(queryKeys.personalBranding.projects.idea(id), idea);
    },
  });
}

export function useBrandProjectSettings() {
  return useQuery({
    queryKey: queryKeys.personalBranding.projects.settings(),
    queryFn: ({ signal }) => personalBrandingService.getBrandProjectSettings(signal),
  });
}

export function useBrandProjectJobPoll(
  jobId: string | null,
  _feature: 'projectIdeation' | 'projectBuildKit'
) {
  return useQuery({
    queryKey: queryKeys.personalBranding.projects.jobs.detail(jobId ?? ''),
    queryFn: ({ signal }) => personalBrandingService.getBrandProjectJob(jobId!, signal),
    enabled: Boolean(jobId),
    refetchInterval: (q) => pollMs(q.state.data),
    refetchIntervalInBackground: true,
  });
}

export function usePersonalBrandingProjectsMutations() {
  const qc = useQueryClient();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobReplayed, setActiveJobReplayed] = useState(false);
  const [activeJobFeature, setActiveJobFeature] = useState<'projectIdeation' | 'projectBuildKit'>(
    'projectIdeation'
  );
  const [submittedCardCount, setSubmittedCardCount] = useState<number | null>(null);
  const [lastGenerateInput, setLastGenerateInput] = useState<GenerateBrandProjectsInput | null>(
    null
  );

  const invalidateIdeas = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.projects.all() });
  };

  const generate = useMutation({
    mutationFn: (input: GenerateBrandProjectsInput) =>
      personalBrandingService.generateBrandProjects(input),
    onSuccess: (data, variables) => {
      const cardCount = variables.radarItemIds?.length ?? 0;
      setActiveJobFeature('projectIdeation');
      setActiveJobId(data.jobId);
      setActiveJobReplayed(Boolean(data.replayed));
      setSubmittedCardCount(cardCount > 0 ? cardCount : null);
      setLastGenerateInput(variables);
    },
  });

  const reject = useMutation({
    mutationFn: (args: { ideaId: string; feedbackText: string; feedbackCategory?: string }) =>
      personalBrandingService.rejectBrandProjectIdea(args.ideaId, {
        feedbackText: args.feedbackText,
        feedbackCategory: args.feedbackCategory as never,
      }),
    onSuccess: () => invalidateIdeas(),
  });

  const complete = useMutation({
    mutationFn: (args: {
      ideaId: string;
      postLinks: Array<{ platform: 'x' | 'youtube' | 'linkedin' | 'other'; url: string }>;
    }) =>
      personalBrandingService.completeBrandProjectIdea(args.ideaId, { postLinks: args.postLinks }),
    onSuccess: () => invalidateIdeas(),
  });

  const buildKit = useMutation({
    mutationFn: (ideaId: string) => personalBrandingService.startBrandProjectBuildKit(ideaId),
    onSuccess: (data) => {
      setActiveJobFeature('projectBuildKit');
      setActiveJobId(data.jobId);
      setActiveJobReplayed(false);
    },
  });

  const kitRevise = useMutation({
    mutationFn: (args: { ideaId: string; repo: string }) =>
      personalBrandingService.startBrandProjectKitRevise(args.ideaId, args.repo),
    onSuccess: (data) => {
      setActiveJobFeature('projectBuildKit');
      setActiveJobId(data.jobId);
      setActiveJobReplayed(false);
    },
  });

  const applyKitRevision = useMutation({
    mutationFn: async (args: {
      ideaId: string;
      baseGeneratedAt: string;
      operations: BuildKitPatchOperation[];
    }) => {
      // ponytail: one GET then PATCH. A write in that gap still 409s.
      // Upgrade path: optional expectedGeneratedAt on PATCH .../build-kit.
      const fresh = await personalBrandingService.getBrandProjectIdea(args.ideaId);
      if (!fresh?.buildKit || fresh.buildKit.generatedAt !== args.baseGeneratedAt) {
        throw new Error('Build kit changed since this revision was requested');
      }
      try {
        return await personalBrandingService.patchBrandProjectBuildKit(
          args.ideaId,
          args.operations
        );
      } catch (error) {
        if (!isBuildKitConflict(error)) throw error;
        await qc.refetchQueries({
          queryKey: queryKeys.personalBranding.projects.idea(args.ideaId),
        });
        throw new Error(KIT_CHANGED_MESSAGE);
      }
    },
    onSuccess: () => invalidateIdeas(),
  });

  const updateSettings = useMutation({
    mutationFn: personalBrandingService.updateBrandProjectSettings,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.projects.settings() });
    },
  });

  const jobQuery = useBrandProjectJobPoll(activeJobId, activeJobFeature);

  useEffect(() => {
    const job = jobQuery.data;
    if (!job || !TERMINAL.has(job.status)) return;
    if (job.status === 'succeeded') invalidateIdeas();
  }, [jobQuery.data]);

  return {
    generate,
    reject,
    complete,
    buildKit,
    kitRevise,
    applyKitRevision,
    updateSettings,
    activeJobId,
    activeJobFeature,
    activeJobReplayed,
    submittedCardCount,
    lastGenerateInput,
    setActiveJobId,
    jobQuery,
  };
}
