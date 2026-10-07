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
        countEffective: 6,
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
    expect(result.countEffective).toBe(6);
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
            topics: [
              {
                topic: 'How agentic AI changes delivery',
                why: 'Connects to Agentic AI Development pillar.',
                matchedPillars: ['Agentic AI Development'],
              },
              {
                topic: 'Graph workflows for content',
                why: 'Maps to Graph-Based Workflows.',
                matchedPillars: ['Graph-Based Workflows'],
              },
            ],
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
    expect(result.topics[0].topic).toBe('How agentic AI changes delivery');
    expect(result.topics[0].why).toContain('Agentic AI Development');
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
      count: 5,
      imageIdeaCount: 2,
      idempotencyKey: 'intent-1:profile-1',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/ai/personal-branding/content-ideas/generate-from-radar',
      {
        brandProfileId: 'profile-1',
        radarItemIds: ['radar-1'],
        targetPlatform: 'linkedin',
        count: 5,
        imageIdeaCount: 2,
        idempotencyKey: 'intent-1:profile-1',
      }
    );
    expect(result.jobId).toBe('job-1');
    expect(result.status).toBe('queued');
    expect(result.pollAfterMs).toBe(2000);
  });
});

describe('personalBrandingService.generateVaultExtractedIdeas', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('sends the Vault image-search flag', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        jobId: 'job-vault-1',
        status: 'queued',
        pollAfterMs: 2000,
        countEffective: 4,
      },
    });

    await personalBrandingService.generateVaultExtractedIdeas({
      brandProfileId: 'profile-1',
      vaultItemIds: ['note-1'],
      targetPlatform: 'medium',
      count: 4,
      enableImageSearch: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/ai/personal-branding/content-ideas/generate-from-vault',
      {
        brandProfileId: 'profile-1',
        vaultItemIds: ['note-1'],
        targetPlatform: 'medium',
        count: 4,
        enableImageSearch: true,
      }
    );
  });
});

describe('personalBrandingService.generateBrandProjects', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('posts count and radarItemIds in camelCase', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { jobId: 'job-projects-1', replayed: false },
    });

    const result = await personalBrandingService.generateBrandProjects({
      count: 5,
      radarItemIds: [' radar-1 ', 'radar-2'],
    });

    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/projects/generate', {
      count: 5,
      radarItemIds: ['radar-1', 'radar-2'],
    });
    expect(result.jobId).toBe('job-projects-1');
    expect(result.replayed).toBe(false);
  });

  it('omits radarItemIds when every id is blank', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { jobId: 'job-projects-2' },
    });

    await personalBrandingService.generateBrandProjects({
      count: 5,
      radarItemIds: [' ', ''],
    });

    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/projects/generate', {
      count: 5,
    });
  });
});
