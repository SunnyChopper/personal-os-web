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

  it('posts to content-ideas generate endpoint and unwraps nested result', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        data: {
          result: {
            ideas: [{ id: 'idea-1', title: 'Test' }],
            contextStats: {
              rejectedFeedbackCount: 1,
              existingGeneratedCount: 2,
              targetPlatform: 'linkedin',
            },
          },
        },
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
    expect(result.ideas).toHaveLength(1);
    expect(result.contextStats.rejectedFeedbackCount).toBe(1);
  });
});
