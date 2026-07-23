import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usePersonalBrandingBrandIdentity } from './usePersonalBrandingBrandIdentity';
import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';

const { getProfileExtraction, listProfiles, listPlatformRules, cancelProfileExtraction } =
  vi.hoisted(() => ({
    getProfileExtraction: vi.fn(),
    listProfiles: vi.fn(),
    listPlatformRules: vi.fn(),
    cancelProfileExtraction: vi.fn(),
  }));

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    listProfiles,
    listPlatformRules,
    getProfileExtraction,
    cancelProfileExtraction,
    getProfile: vi.fn(),
    listProfileVersions: vi.fn(),
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
    cancelProfileExtraction.mockImplementation(async (jobId: string) => {
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
});
