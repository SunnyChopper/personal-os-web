import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { PLATFORM_RULE_CATALOG } from '@/lib/personal-branding/platform-rule-catalog';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { LOCAL_DRAFT_PROFILE_ID } from '@/pages/admin/personal-branding/brand-identity/brand-identity.constants';
import type {
  CreateBrandProfileInput,
  CreatePlatformRuleInput,
  StartProfileExtractionInput,
  StartProfileExtractionRerunInput,
  ExtractionJobStatus,
  ProfileExtractionClientProgress,
  ProfileExtractionSourceRun,
  UpdateBrandProfileInput,
  UpdatePlatformRuleInput,
} from '@/types/api/personal-branding.dto';

const TERMINAL_EXTRACTION: ExtractionJobStatus[] = [
  'succeeded',
  'succeeded_with_warnings',
  'failed',
  'cancelled',
];

/**
 * React Query bundle for Brand Identity (profiles, extraction jobs, platform rules).
 * Platform rules list is opt-in (`enablePlatformRules`) so Core Profile mounts do not
 * fan out rules GETs during API cold-start storms.
 */
export function usePersonalBrandingBrandIdentity(options?: {
  selectedProfileId?: string | null;
  pollExtractionJobId?: string | null;
  enablePlatformRules?: boolean;
}) {
  const qc = useQueryClient();
  const enablePlatformRules = options?.enablePlatformRules ?? false;
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    options?.selectedProfileId ?? null
  );
  const [pollExtractionJobId, setPollExtractionJobId] = useState<string | null>(
    options?.pollExtractionJobId ?? null
  );
  const [clientExtractionProgress, setClientExtractionProgress] =
    useState<ProfileExtractionClientProgress | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);

  const invalidateProfiles = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.profiles.all() }),
    [qc]
  );

  const invalidatePlatformRules = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.platformRules.all() }),
    [qc]
  );

  const invalidateProfileDetail = useCallback(
    (profileId: string) =>
      qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.profiles.detail(profileId),
      }),
    [qc]
  );

  const invalidateProfileVersions = useCallback(
    (profileId: string) =>
      qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.profiles.versions(profileId),
      }),
    [qc]
  );

  const invalidateProfileOutputTests = useCallback(
    (profileId: string) =>
      qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.profiles.outputTests(profileId),
      }),
    [qc]
  );

  const profiles = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(),
    queryFn: async ({ signal }) => {
      const res = await personalBrandingService.listProfiles(1, 50, signal);
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message ?? 'Failed to load profiles') as Error & {
          code?: string;
        };
        if (res.error?.code) err.code = res.error.code;
        throw err;
      }
      return res.data;
    },
  });

  const profileDetail = useQuery({
    queryKey: queryKeys.personalBranding.profiles.detail(selectedProfileId ?? ''),
    queryFn: ({ signal }) => personalBrandingService.getProfile(selectedProfileId!, signal),
    enabled: Boolean(selectedProfileId) && selectedProfileId !== LOCAL_DRAFT_PROFILE_ID,
    refetchOnWindowFocus: false,
  });

  const profileVersions = useQuery({
    queryKey: queryKeys.personalBranding.profiles.versions(selectedProfileId ?? ''),
    queryFn: ({ signal }) =>
      personalBrandingService.listProfileVersions(selectedProfileId!, signal),
    enabled: Boolean(selectedProfileId) && selectedProfileId !== LOCAL_DRAFT_PROFILE_ID,
    refetchOnWindowFocus: false,
  });

  const profileOutputTests = useQuery({
    queryKey: queryKeys.personalBranding.profiles.outputTests(selectedProfileId ?? ''),
    queryFn: ({ signal }) =>
      personalBrandingService.listProfileOutputTests(selectedProfileId!, signal),
    enabled: Boolean(selectedProfileId) && selectedProfileId !== LOCAL_DRAFT_PROFILE_ID,
    refetchOnWindowFocus: false,
  });

  const clearExtractionJob = useCallback(() => {
    setPollExtractionJobId(null);
    setClientExtractionProgress(null);
    pollStartedAtRef.current = null;
  }, []);

  const extractionJob = useQuery({
    queryKey: queryKeys.personalBranding.extractions.detail(pollExtractionJobId ?? ''),
    queryFn: () => personalBrandingService.getProfileExtraction(pollExtractionJobId!),
    enabled: Boolean(pollExtractionJobId),
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const data = query.state.data;
      const status = data?.status;
      if (!status || TERMINAL_EXTRACTION.includes(status)) return false;
      return data?.pollAfterMs ?? 2000;
    },
  });

  const extractionJobStatus = extractionJob.data?.status;
  const extractionJobActive =
    Boolean(pollExtractionJobId) &&
    Boolean(extractionJobStatus) &&
    !TERMINAL_EXTRACTION.includes(extractionJobStatus!);

  const extractionSourceRunsPageSize = Math.min(
    Math.max(extractionJob.data?.sourceCount ?? 50, 50),
    100
  );

  const extractionSourceRunsQuery = useQuery({
    queryKey: queryKeys.personalBranding.extractions.sources(pollExtractionJobId ?? ''),
    queryFn: () =>
      personalBrandingService.listProfileExtractionSources(
        pollExtractionJobId!,
        1,
        extractionSourceRunsPageSize
      ),
    enabled: extractionJobActive,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: () => {
      if (!extractionJobActive) return false;
      return extractionJob.data?.pollAfterMs ?? 2000;
    },
  });

  const extractionSourceRuns = useMemo(() => {
    const map = new Map<string, ProfileExtractionSourceRun>();
    for (const run of extractionSourceRunsQuery.data?.data ?? []) {
      map.set(run.sourceId, run);
    }
    return map;
  }, [extractionSourceRunsQuery.data?.data]);

  const platformRules = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.list(),
    queryFn: async ({ signal }) => {
      const res = await personalBrandingService.listPlatformRules(1, 50, signal);
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message ?? 'Failed to load rules') as Error & {
          code?: string;
        };
        if (res.error?.code) err.code = res.error.code;
        throw err;
      }
      return res.data;
    },
    enabled: enablePlatformRules,
    refetchOnWindowFocus: false,
  });

  const platformRuleCatalog = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.catalog(),
    queryFn: () => personalBrandingService.getPlatformRuleCatalog(),
    staleTime: Infinity,
    initialData: PLATFORM_RULE_CATALOG,
  });

  const createProfile = useMutation({
    mutationFn: (body: CreateBrandProfileInput) => personalBrandingService.createProfile(body),
    onSuccess: (profile) => {
      void invalidateProfiles();
      setSelectedProfileId(profile.id);
    },
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBrandProfileInput }) =>
      personalBrandingService.updateProfile(id, body),
    onSuccess: (_data, { id }) => {
      void invalidateProfiles();
      void invalidateProfileDetail(id);
    },
  });

  const deleteProfile = useMutation({
    mutationFn: (id: string) => personalBrandingService.deleteProfile(id),
    onSuccess: (_data, id) => {
      void invalidateProfiles();
      void invalidatePlatformRules();
      setSelectedProfileId((prev) => (prev === id ? null : prev));
    },
  });

  const startExtraction = useMutation({
    mutationFn: (body: StartProfileExtractionInput) =>
      personalBrandingService.startProfileExtractionFromDialog(body, {
        onProgress: (progress) => {
          if (progress.phase === 'done') {
            setClientExtractionProgress(null);
          } else {
            setClientExtractionProgress(progress);
          }
          if (progress.jobId) {
            setPollExtractionJobId(progress.jobId);
            pollStartedAtRef.current = Date.now();
          }
          if (progress.profileId) {
            setSelectedProfileId(progress.profileId);
          }
        },
      }),
    onSuccess: (accepted) => {
      void invalidateProfiles();
      setSelectedProfileId(accepted.profileId);
      setPollExtractionJobId(accepted.jobId);
      pollStartedAtRef.current = Date.now();
      setClientExtractionProgress(null);
    },
    onError: () => {
      setClientExtractionProgress(null);
    },
  });

  const rerunExtraction = useMutation({
    mutationFn: ({
      profileId,
      body,
    }: {
      profileId: string;
      body?: StartProfileExtractionRerunInput;
    }) => personalBrandingService.rerunProfileExtraction(profileId, body ?? {}),
    onSuccess: (accepted) => {
      void invalidateProfiles();
      void invalidateProfileDetail(accepted.profileId);
      setPollExtractionJobId(accepted.jobId);
      pollStartedAtRef.current = Date.now();
    },
  });

  const cancelExtraction = useMutation({
    mutationFn: (jobId: string) => personalBrandingService.cancelProfileExtraction(jobId),
    onSuccess: (job) => {
      void invalidateProfiles();
      if (job.profileId) {
        void invalidateProfileDetail(job.profileId);
        void invalidateProfileVersions(job.profileId);
      }
      qc.setQueryData(queryKeys.personalBranding.extractions.detail(job.jobId), job);
    },
  });

  const activateVersion = useMutation({
    mutationFn: ({ profileId, versionId }: { profileId: string; versionId: string }) =>
      personalBrandingService.activateProfileVersion(profileId, versionId),
    onSuccess: (_detail, { profileId }) => {
      void invalidateProfiles();
      void invalidateProfileDetail(profileId);
      void invalidateProfileVersions(profileId);
    },
  });

  const generateOutputTest = useMutation({
    mutationFn: ({
      profileId,
      body,
    }: {
      profileId: string;
      body: Parameters<typeof personalBrandingService.generateProfileOutputTest>[1];
    }) => personalBrandingService.generateProfileOutputTest(profileId, body),
    onSuccess: (_saved, { profileId }) => {
      void invalidateProfileOutputTests(profileId);
    },
  });

  const createPlatformRule = useMutation({
    mutationFn: (body: CreatePlatformRuleInput) => personalBrandingService.createPlatformRule(body),
    onSuccess: () => void invalidatePlatformRules(),
  });

  const updatePlatformRule = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlatformRuleInput }) =>
      personalBrandingService.updatePlatformRule(id, body),
    onSuccess: () => void invalidatePlatformRules(),
  });

  const deletePlatformRule = useMutation({
    mutationFn: (id: string) => personalBrandingService.deletePlatformRule(id),
    onSuccess: () => void invalidatePlatformRules(),
  });

  useEffect(() => {
    if (!selectedProfileId && profiles.data?.data?.length) {
      setSelectedProfileId(profiles.data.data[0].id);
    }
  }, [profiles.data, selectedProfileId]);

  // Abort in-flight Brand Identity GETs on leave so Axios 30s timeouts do not
  // surface as React Query alerts on the next route (prod c6bd8a4286da cluster).
  useEffect(() => {
    return () => {
      void qc.cancelQueries({ queryKey: queryKeys.personalBranding.profiles.all() });
      void qc.cancelQueries({ queryKey: queryKeys.personalBranding.platformRules.all() });
      void qc.cancelQueries({ queryKey: queryKeys.personalBranding.extractions.all() });
    };
  }, [qc]);

  useEffect(() => {
    if (pollExtractionJobId) {
      pollStartedAtRef.current = Date.now();
    }
  }, [pollExtractionJobId]);

  useEffect(() => {
    const list = profiles.data?.data;
    if (!list?.length || pollExtractionJobId) return;

    const extractingProfile = list.find((p) => p.status === 'extracting' && p.extractionJobId);
    if (!extractingProfile?.extractionJobId) return;

    setPollExtractionJobId(extractingProfile.extractionJobId);

    const selectedHasActiveJob =
      selectedProfileId &&
      list.some(
        (p) => p.id === selectedProfileId && p.status === 'extracting' && p.extractionJobId
      );
    if (!selectedProfileId || !selectedHasActiveJob) {
      setSelectedProfileId(extractingProfile.id);
    }
  }, [profiles.data, pollExtractionJobId, selectedProfileId]);

  useEffect(() => {
    const detail = profileDetail.data;
    if (detail?.extractionJobId && !pollExtractionJobId && detail.status === 'extracting') {
      setPollExtractionJobId(detail.extractionJobId);
    }
  }, [profileDetail.data, pollExtractionJobId]);

  useTerminalJobFailureAlert({
    feature: 'brandProfileExtraction',
    jobId: pollExtractionJobId,
    status: extractionJob.data?.status,
    error: extractionJob.data?.error,
    message: extractionJob.data?.message,
    partial: extractionJob.data?.status === 'succeeded_with_warnings',
  });

  useEffect(() => {
    const status = extractionJob.data?.status;
    const profileId = extractionJob.data?.profileId ?? selectedProfileId;
    if (status && TERMINAL_EXTRACTION.includes(status)) {
      void invalidateProfiles();
      if (profileId) {
        void invalidateProfileDetail(profileId);
        void invalidateProfileVersions(profileId);
      }
    }
  }, [
    extractionJob.data?.status,
    extractionJob.data?.profileId,
    invalidateProfiles,
    invalidateProfileDetail,
    invalidateProfileVersions,
    selectedProfileId,
  ]);

  return {
    profiles,
    profileDetail,
    profileVersions,
    profileOutputTests,
    extractionJob,
    extractionSourceRuns,
    clientExtractionProgress,
    platformRules,
    platformRuleCatalog,
    selectedProfileId,
    setSelectedProfileId,
    pollExtractionJobId,
    setPollExtractionJobId,
    clearExtractionJob,
    createProfile,
    updateProfile,
    deleteProfile,
    startExtraction,
    rerunExtraction,
    cancelExtraction,
    activateVersion,
    generateOutputTest,
    createPlatformRule,
    updatePlatformRule,
    deletePlatformRule,
    invalidateProfiles,
    invalidatePlatformRules,
    invalidateProfileVersions,
    invalidateProfileOutputTests,
  };
}
