import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS,
  contentIdeaApproveJobPollInterval,
  isContentIdeaApproveJobPollable,
  useContentIdeaApproveJob,
} from '@/hooks/useContentIdeaApproveJob';
import { queryKeys } from '@/lib/react-query/query-keys';
import type {
  ContentIdeaApproveJob,
  ContentNode,
  ContentIdea,
  ApproveContentIdeaResult,
} from '@/types/api/personal-branding.dto';

const { getContentIdeaApproveJob } = vi.hoisted(() => ({
  getContentIdeaApproveJob: vi.fn(),
}));

vi.mock('@/services/personal-branding.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/personal-branding.service')>();
  return {
    personalBrandingService: {
      ...actual.personalBrandingService,
      getContentIdeaApproveJob: (...args: unknown[]) => getContentIdeaApproveJob(...args),
    },
  };
});

vi.mock('@/lib/personal-branding/report-job-failure', () => ({
  reportPersonalBrandingJobFailure: vi.fn(),
}));

import { reportPersonalBrandingJobFailure } from '@/lib/personal-branding/report-job-failure';
import { apiClient } from '@/lib/api-client';
import { personalBrandingService } from '@/services/personal-branding.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function baseJob(overrides: Partial<ContentIdeaApproveJob> = {}): ContentIdeaApproveJob {
  return {
    jobId: 'job-1',
    ideaId: 'idea-1',
    status: 'running',
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

describe('contentIdeaApproveJobPollInterval', () => {
  it('polls while queued or running', () => {
    expect(contentIdeaApproveJobPollInterval({ status: 'queued', pollAfterMs: 2000 })).toBe(2000);
    expect(contentIdeaApproveJobPollInterval({ status: 'running', pollAfterMs: 2500 })).toBe(2500);
  });

  it('stops on terminal status', () => {
    expect(contentIdeaApproveJobPollInterval({ status: 'succeeded' })).toBe(false);
    expect(contentIdeaApproveJobPollInterval({ status: 'failed' })).toBe(false);
  });
});

describe('isContentIdeaApproveJobPollable', () => {
  it('returns true only for queued and running', () => {
    expect(isContentIdeaApproveJobPollable('queued')).toBe(true);
    expect(isContentIdeaApproveJobPollable('running')).toBe(true);
    expect(isContentIdeaApproveJobPollable('succeeded')).toBe(false);
    expect(isContentIdeaApproveJobPollable('failed')).toBe(false);
  });
});

describe('useContentIdeaApproveJob client timeout reconcile (7f6a49675b0f)', () => {
  let now: number;

  beforeEach(() => {
    vi.clearAllMocks();
    now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    getContentIdeaApproveJob.mockReset();
  });

  it('reconciles succeeded after budget exceeded without client_timeout telemetry', async () => {
    const runningJob = baseJob({ status: 'running' });
    const succeededJob = baseJob({
      status: 'succeeded',
      result: {
        idea: { id: 'idea-1' } as ContentIdea,
        draft: { id: 'draft-1' } as ContentNode,
      } as ApproveContentIdeaResult,
    });

    getContentIdeaApproveJob
      .mockResolvedValueOnce(runningJob)
      .mockResolvedValueOnce(runningJob)
      .mockResolvedValueOnce(succeededJob);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const onTerminal = vi.fn();
    const onTimeout = vi.fn();
    const queryKey = queryKeys.personalBranding.contentIdeaApproveJobs.detail('idea-1', 'job-1');

    renderHook(() => useContentIdeaApproveJob('idea-1', 'job-1', onTerminal, onTimeout), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(getContentIdeaApproveJob).toHaveBeenCalled());

    now += CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS + 1;

    await act(async () => {
      await client.refetchQueries({ queryKey });
    });

    await waitFor(() => expect(onTerminal).toHaveBeenCalledWith(succeededJob));
    expect(onTimeout).not.toHaveBeenCalled();
    expect(reportPersonalBrandingJobFailure).not.toHaveBeenCalled();
  });

  it('reports client_timeout when reconcile still non-terminal', async () => {
    const runningJob = baseJob({ status: 'running' });

    getContentIdeaApproveJob.mockResolvedValue(runningJob);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const onTerminal = vi.fn();
    const onTimeout = vi.fn();
    const queryKey = queryKeys.personalBranding.contentIdeaApproveJobs.detail('idea-1', 'job-1');

    renderHook(() => useContentIdeaApproveJob('idea-1', 'job-1', onTerminal, onTimeout), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(getContentIdeaApproveJob).toHaveBeenCalled());

    now += CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS + 1;

    await act(async () => {
      await client.refetchQueries({ queryKey });
    });

    await waitFor(() => expect(onTimeout).toHaveBeenCalled());
    expect(onTerminal).not.toHaveBeenCalled();
    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'contentIdeaApprove',
        jobId: 'job-1',
        stage: 'client_timeout',
        error: `Client poll stopped after ${CONTENT_IDEA_APPROVE_CLIENT_WAIT_BUDGET_MS}ms without terminal status`,
      })
    );
  });
});

describe('approveContentIdea async job', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.get).mockReset();
  });

  it('posts approve and returns 202 job start', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { jobId: 'job-1', status: 'queued', pollAfterMs: 2000 },
    });
    const start = await personalBrandingService.approveContentIdea('idea-1', {
      brandProfileId: 'profile-1',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/content-ideas/idea-1/approve', {
      brandProfileId: 'profile-1',
    });
    expect(start).toEqual({ jobId: 'job-1', status: 'queued', pollAfterMs: 2000 });
  });

  it('polls approve job by idea and job id', async () => {
    getContentIdeaApproveJob.mockResolvedValue({
      jobId: 'job-1',
      ideaId: 'idea-1',
      status: 'succeeded',
      userId: 'u1',
      createdAt: 't',
      updatedAt: 't',
      result: {
        idea: { id: 'idea-1' },
        draft: { id: 'draft-1' },
      },
    });
    const job = await personalBrandingService.getContentIdeaApproveJob('idea-1', 'job-1');
    expect(getContentIdeaApproveJob).toHaveBeenCalledWith('idea-1', 'job-1');
    expect(job.status).toBe('succeeded');
    expect(job.result?.draft.id).toBe('draft-1');
  });
});
