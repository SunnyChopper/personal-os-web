import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usePersonalBrandingBrandIdentity } from './usePersonalBrandingBrandIdentity';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';

const {
  getProfileExtraction,
  getProfile,
  listProfiles,
  listPlatformRules,
  listProfileOutputTests,
  listProfileVersions,
  getPlatformRuleCatalog,
  cancelProfileExtraction,
} = vi.hoisted(() => ({
  getProfileExtraction: vi.fn(),
  getProfile: vi.fn(),
  listProfiles: vi.fn(),
  listPlatformRules: vi.fn(),
  listProfileOutputTests: vi.fn(),
  listProfileVersions: vi.fn(),
  getPlatformRuleCatalog: vi.fn(),
  cancelProfileExtraction: vi.fn(),
}));

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    listProfiles,
    listPlatformRules,
    listProfileOutputTests,
    listProfileVersions,
    getPlatformRuleCatalog,
    getProfileExtraction,
    cancelProfileExtraction,
    getProfile,
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    startProfileExtractionFromDialog: vi.fn(),
    rerunProfileExtraction: vi.fn(),
    activateProfileVersion: vi.fn(),
    createPlatformRule: vi.fn(),
    updatePlatformRule: vi.fn(),
    deletePlatformRule: vi.fn(),
  },
}));

function makeJob(
  partial: Partial<ProfileExtractionJob> & Pick<ProfileExtractionJob, 'status'>
): ProfileExtractionJob {
  return {
    jobId: 'job-1',
    profileId: 'profile-1',
    userId: 'user-1',
    createdAt: '2026-07-02T23:14:03.623736Z',
    updatedAt: '2026-07-02T23:14:14.196013Z',
    ...partial,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePersonalBrandingBrandIdentity extraction polling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProfiles.mockResolvedValue({ success: true, data: { data: [], total: 0 } });
    listPlatformRules.mockResolvedValue({ success: true, data: { data: [], total: 0 } });
    listProfileOutputTests.mockResolvedValue({ data: [], total: 0 });
    listProfileVersions.mockResolvedValue({ data: [], total: 0 });
    getPlatformRuleCatalog.mockResolvedValue({ platforms: [] });
  });

  it('keeps pollExtractionJobId and failed job data after the job reaches a terminal failed state', async () => {
    const runningJob = makeJob({
      status: 'running',
      stage: 'analyzing',
      message: 'Analyzing with LLM',
      pollAfterMs: 50,
    });
    const failedJob = makeJob({
      status: 'failed',
      stage: 'failed',
      message: 'Extraction failed',
      error: 'OpenAI API error: invalid_api_key',
    });

    getProfileExtraction.mockResolvedValueOnce(runningJob).mockResolvedValueOnce(failedJob);

    const { result } = renderHook(
      () => usePersonalBrandingBrandIdentity({ pollExtractionJobId: 'job-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.extractionJob.data?.status).toBe('running');
    });

    await waitFor(() => {
      expect(result.current.extractionJob.data?.status).toBe('failed');
    });

    expect(result.current.pollExtractionJobId).toBe('job-1');
    expect(result.current.extractionJob.data?.error).toBe('OpenAI API error: invalid_api_key');
  });

  it('clears pollExtractionJobId only when clearExtractionJob is called', async () => {
    getProfileExtraction.mockResolvedValue(
      makeJob({
        status: 'failed',
        stage: 'failed',
        error: 'Extraction failed',
      })
    );

    const { result } = renderHook(
      () => usePersonalBrandingBrandIdentity({ pollExtractionJobId: 'job-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.extractionJob.data?.status).toBe('failed');
    });

    expect(result.current.pollExtractionJobId).toBe('job-1');

    act(() => {
      result.current.clearExtractionJob();
    });

    expect(result.current.pollExtractionJobId).toBeNull();
  });

  it('resumes extraction polling when profiles list includes an extracting profile after reload', async () => {
    listProfiles.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 'profile-other',
            name: 'Other',
            status: 'active',
            pillars: [],
            toneMetrics: {},
            bannedPhrases: [],
            createdAt: '2026-07-01T00:00:00Z',
            updatedAt: '2026-07-01T00:00:00Z',
          },
          {
            id: 'profile-extracting',
            name: 'Extracted profile',
            status: 'extracting',
            extractionJobId: 'job-resume',
            pillars: [],
            toneMetrics: {},
            bannedPhrases: [],
            createdAt: '2026-07-02T00:00:00Z',
            updatedAt: '2026-07-02T00:00:00Z',
          },
        ],
        total: 2,
      },
    });

    getProfileExtraction.mockResolvedValue(
      makeJob({
        jobId: 'job-resume',
        profileId: 'profile-extracting',
        status: 'running',
        stage: 'analyzing',
        pollAfterMs: 50,
      })
    );

    const { result } = renderHook(() => usePersonalBrandingBrandIdentity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pollExtractionJobId).toBe('job-resume');
    });

    expect(result.current.selectedProfileId).toBe('profile-extracting');
    expect(getProfileExtraction).toHaveBeenCalledWith('job-resume');
  });

  it('cancelExtraction updates cached job data', async () => {
    const cancellingJob = makeJob({ status: 'cancelling', stage: 'cancelling' });
    const cancelledJob = makeJob({
      status: 'cancelled',
      stage: 'cancelled',
      message: 'Extraction cancelled',
    });

    getProfileExtraction.mockResolvedValue(cancellingJob);
    cancelProfileExtraction.mockImplementation(async () => {
      getProfileExtraction.mockResolvedValue(cancelledJob);
      return cancelledJob;
    });

    const { result } = renderHook(
      () => usePersonalBrandingBrandIdentity({ pollExtractionJobId: 'job-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.extractionJob.data?.status).toBe('cancelling');
    });

    await act(async () => {
      await result.current.cancelExtraction.mutateAsync('job-1');
    });

    expect(cancelProfileExtraction).toHaveBeenCalledWith('job-1');
    await waitFor(() => {
      expect(result.current.extractionJob.data?.status).toBe('cancelled');
    });
  });

  it('cancels in-flight brand-identity queries on unmount (c6bd8a4286da)', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');

    const { unmount } = renderHook(() => usePersonalBrandingBrandIdentity(), {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
      },
    });

    unmount();

    expect(cancelSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.profiles.all(),
    });
    expect(cancelSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.platformRules.all(),
    });
    expect(cancelSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.extractions.all(),
    });
  });

  it('skips platform-rules list until enablePlatformRules (d77c3f5ea1c5)', async () => {
    listProfiles.mockResolvedValue({ success: true, data: { data: [], total: 0 } });

    const { result, rerender } = renderHook(
      ({ enablePlatformRules }: { enablePlatformRules?: boolean }) =>
        usePersonalBrandingBrandIdentity({ enablePlatformRules }),
      {
        wrapper: createWrapper(),
        initialProps: { enablePlatformRules: false },
      }
    );

    await waitFor(() => {
      expect(listProfiles).toHaveBeenCalled();
    });
    expect(listPlatformRules).not.toHaveBeenCalled();

    rerender({ enablePlatformRules: true });

    await waitFor(() => {
      expect(listPlatformRules).toHaveBeenCalledTimes(1);
    });
    expect(listPlatformRules.mock.calls[0]?.[0]).toBe(1);
    expect(listPlatformRules.mock.calls[0]?.[1]).toBe(50);
    expect(listPlatformRules.mock.calls[0]?.[2]).toBeInstanceOf(AbortSignal);
    await waitFor(() => {
      expect(result.current.platformRules.isSuccess).toBe(true);
    });
  });

  it('passes AbortSignal to getProfile for detail query (a897a4d7994c)', async () => {
    listProfiles.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 'profile-1',
            name: 'Primary',
            status: 'active',
            pillars: [],
            toneMetrics: {},
            bannedPhrases: [],
            createdAt: '2026-07-01T00:00:00Z',
            updatedAt: '2026-07-01T00:00:00Z',
          },
        ],
        total: 1,
      },
    });
    getProfile.mockResolvedValue({
      id: 'profile-1',
      name: 'Primary',
      status: 'active',
      pillars: [],
      toneMetrics: {},
      bannedPhrases: [],
      sources: [],
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    });

    const { result } = renderHook(
      () => usePersonalBrandingBrandIdentity({ selectedProfileId: 'profile-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.profileDetail.isSuccess).toBe(true);
    });

    expect(getProfile).toHaveBeenCalledWith('profile-1', expect.any(Object));
    expect(getProfile.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
  });

  it('preserves ERR_CANCELED on platform-rules list throw (d77c3f5ea1c5)', async () => {
    listProfiles.mockResolvedValue({ success: true, data: { data: [], total: 0 } });
    listPlatformRules.mockResolvedValue({
      success: false,
      error: { message: 'Request cancelled', code: 'ERR_CANCELED' },
    });

    const { result } = renderHook(
      () => usePersonalBrandingBrandIdentity({ enablePlatformRules: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.platformRules.isError).toBe(true);
    });

    const err = result.current.platformRules.error as Error & { code?: string };
    expect(err.code).toBe('ERR_CANCELED');
  });
});
