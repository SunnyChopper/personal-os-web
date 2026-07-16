import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  UpdateBrandProfileInput,
  UpdatePlatformRuleInput,
} from '@/types/api/personal-branding.dto';

const TERMINAL_EXTRACTION: ExtractionJobStatus[] = [
  'succeeded',
  'succeeded_with_warnings',
  'failed',
];

/**
 * React Query bundle for Brand Identity (profiles, extraction jobs, platform rules).
 */
export function usePersonalBrandingBrandIdentity(options?: {
  selectedProfileId?: string | null;
  pollExtractionJobId?: string | null;
}) {
  const qc = useQueryClient();
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
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load profiles');
      return res.data;
    },
  });

  const profileDetail = useQuery({
    queryKey: queryKeys.personalBranding.profiles.detail(selectedProfileId ?? ''),
    queryFn: () => personalBrandingService.getProfile(selectedProfileId!),
    enabled: Boolean(selectedProfileId) && selectedProfileId !== LOCAL_DRAFT_PROFILE_ID,
    refetchOnWindowFocus: false,
  });

  const profileVersions = useQuery({
    queryKey: queryKeys.personalBranding.profiles.versions(selectedProfileId ?? ''),
    queryFn: () => personalBrandingService.listProfileVersions(selectedProfileId!),
    enabled: Boolean(selectedProfileId) && selectedProfileId !== LOCAL_DRAFT_PROFILE_ID,
    refetchOnWindowFocus: false,
  });

  const profileOutputTests = useQuery({
    queryKey: queryKeys.personalBranding.profiles.outputTests(selectedProfileId ?? ''),
    queryFn: () => personalBrandingService.listProfileOutputTests(selectedProfileId!),
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

  const platformRules = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.list(),
    queryFn: async () => {
      const res = await personalBrandingService.listPlatformRules();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load rules');
      return res.data;
    },
  });

  const platformRuleCatalog = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.catalog(),
    queryFn: () => personalBrandingService.getPlatformRuleCatalog(),
    staleTime: 1000 * 60 * 60,
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

  useEffect(() => {
    if (pollExtractionJobId) {
      pollStartedAtRef.current = Date.now();
    }
  }, [pollExtractionJobId]);

  useEffect(() => {
    const detail = profileDetail.data;
    if (detail?.extractionJobId && !pollExtractionJobId && detail.status === 'extracting') {
      setPollExtractionJobId(detail.extractionJobId);
    }
  }, [profileDetail.data, pollExtractionJobId]);

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
