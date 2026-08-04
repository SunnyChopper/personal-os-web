import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { contentIdeaApproveJobPollInterval } from '@/hooks/useContentIdeaApproveJob';
import { personalBrandingService } from '@/services/personal-branding.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

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
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: {
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
      },
    });
    const job = await personalBrandingService.getContentIdeaApproveJob('idea-1', 'job-1');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/personal-branding/content-ideas/idea-1/approve-jobs/job-1'
    );
    expect(job.status).toBe('succeeded');
    expect(job.result?.draft.id).toBe('draft-1');
  });
});
