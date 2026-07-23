import { beforeEach, describe, expect, it, vi } from 'vitest';
import { personalBrandingService } from '@/services/personal-branding.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('personalBrandingService.generateContentIdeas', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('starts async ideation job and returns job ack', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        jobId: 'job-manual-1',
        status: 'queued',
        pollAfterMs: 2000,
      },
    });

    const result = await personalBrandingService.generateContentIdeas({
      brandProfileId: 'profile-1',
      targetPlatform: 'linkedin',
      seedIdeas: 'observability',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/ai/personal-branding/content-ideas/generate', {
      brandProfileId: 'profile-1',
      targetPlatform: 'linkedin',
      seedIdeas: 'observability',
    });
    expect(result.jobId).toBe('job-manual-1');
    expect(result.status).toBe('queued');
    expect(result.pollAfterMs).toBe(2000);
  });
});

describe('personalBrandingService.generateTopicSuggestions', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('posts to topic-suggestions endpoint and unwraps nested result', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        data: {
          result: {
            topics: ['How agentic AI changes delivery', 'Graph workflows for content'],
          },
        },
      },
    });

    const result = await personalBrandingService.generateTopicSuggestions({
      pillars: ['Agentic AI Development'],
      targetAudience: 'Engineering leaders',
      platform: 'medium',
      count: 5,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/ai/personal-branding/topic-suggestions', {
      pillars: ['Agentic AI Development'],
      targetAudience: 'Engineering leaders',
      platform: 'medium',
      count: 5,
    });
    expect(result.topics).toHaveLength(2);
  });
});

describe('personalBrandingService.suggestPlatformFit', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('posts to platform-fit-suggestions endpoint and unwraps nested result', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        data: {
          result: {
            contentAnalysis: {
              characterCount: 120,
              wordCount: 20,
              contentType: 'SOCIAL_THREAD',
              structureSignals: {
                headingCount: 0,
                paragraphCount: 2,
                listItemCount: 0,
                threadable: true,
              },
              matchedPillars: ['Leadership'],
            },
            recommendations: [
              {
                platform: 'x',
                score: 0.88,
                fitTier: 'high',
                rationale: 'Short thread-friendly copy.',
                factors: {
                  lengthFit: { score: 0.9, detail: 'fits' },
                  structureFit: { score: 0.85, detail: 'threadable' },
                  pillarFit: { score: 0.5, matchedPillars: ['Leadership'], detail: 'ok' },
                  rulesFit: {
                    score: 0.6,
                    appliedRuleIds: [],
                    characterLimit: 280,
                    wordLimit: null,
                    detail: 'rules',
                  },
                },
              },
            ],
            excludedSourcePlatform: 'linkedin',
          },
        },
      },
    });

    const result = await personalBrandingService.suggestPlatformFit({
      contentId: 'content-1',
      brandProfileId: 'profile-1',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/ai/personal-branding/platform-fit-suggestions', {
      contentId: 'content-1',
      brandProfileId: 'profile-1',
    });
    expect(result.recommendations[0]?.platform).toBe('x');
  });
});

describe('personalBrandingService.generateRadarExtractedIdeas', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('starts async radar ideation job and returns job ack', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        jobId: 'job-1',
        status: 'queued',
        pollAfterMs: 2000,
      },
    });

    const result = await personalBrandingService.generateRadarExtractedIdeas({
      brandProfileId: 'profile-1',
      radarItemIds: ['radar-1'],
      targetPlatform: 'linkedin',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/ai/personal-branding/content-ideas/generate-from-radar',
      {
        brandProfileId: 'profile-1',
        radarItemIds: ['radar-1'],
        targetPlatform: 'linkedin',
      }
    );
    expect(result.jobId).toBe('job-1');
    expect(result.status).toBe('queued');
    expect(result.pollAfterMs).toBe(2000);
  });
});
