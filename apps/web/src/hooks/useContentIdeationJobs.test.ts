import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useContentIdeationJobs } from '@/hooks/useContentIdeationJobs';
import type { ContentIdeationJob } from '@/types/api/personal-branding.dto';

const { getContentIdeationJob } = vi.hoisted(() => ({
  getContentIdeationJob: vi.fn(),
}));

vi.mock('@/services/personal-branding.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/personal-branding.service')>();
  return {
    personalBrandingService: {
      ...actual.personalBrandingService,
      getContentIdeationJob: (...args: unknown[]) => getContentIdeationJob(...args),
    },
  };
});

vi.mock('@/lib/personal-branding/report-job-failure', () => ({
  reportPersonalBrandingJobFailure: vi.fn(),
}));

import { reportPersonalBrandingJobFailure } from '@/lib/personal-branding/report-job-failure';

function baseJob(overrides: Partial<ContentIdeationJob> = {}): ContentIdeationJob {
  return {
    jobId: 'job-1',
    status: 'running',
    source: 'radar',
    userId: 'u1',
    createdAt: 't',
    updatedAt: 't',
    ...overrides,
  };
}

function wrap(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useContentIdeationJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContentIdeationJob.mockReset();
  });

  it('reports each failed radar job once and skips succeeded jobs', async () => {
    getContentIdeationJob.mockImplementation(async (jobId: string) => {
      if (jobId === 'job-fail') {
        return baseJob({
          jobId: 'job-fail',
          status: 'failed',
          error: 'boom',
          errorCode: 'LLM_PROVIDER_ERROR',
          retryable: true,
          stage: 'generating',
        });
      }
      return baseJob({ jobId: 'job-ok', status: 'succeeded' });
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = renderHook(() => useContentIdeationJobs(['job-fail', 'job-ok']), {
      wrapper: wrap(client),
    });

    await waitFor(() => {
      expect(reportPersonalBrandingJobFailure).toHaveBeenCalledOnce();
    });
    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'radarIdeation',
        jobId: 'job-fail',
        error: 'boom',
        errorCode: 'LLM_PROVIDER_ERROR',
        retryable: true,
        stage: 'generating',
      })
    );

    rerender();
    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledOnce();
  });

  it('tags non-radar ideation failures as contentIdeation', async () => {
    getContentIdeationJob.mockResolvedValue(
      baseJob({
        jobId: 'job-vault',
        source: 'vault',
        status: 'failed',
        error: 'extract failed',
      })
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    renderHook(() => useContentIdeationJobs(['job-vault']), { wrapper: wrap(client) });

    await waitFor(() => {
      expect(reportPersonalBrandingJobFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'contentIdeation',
          jobId: 'job-vault',
        })
      );
    });
  });
});
