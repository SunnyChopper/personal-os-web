import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { personalBrandingService } from '@/services/personal-branding.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

describe('personalBrandingService.patchBrandProjectBuildKit', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset();
  });

  it('patches camelCase operations and returns the idea', async () => {
    const idea = { id: 'idea-1', title: 'Ship' };
    vi.mocked(apiClient.patch).mockResolvedValue({ success: true, data: idea });

    const result = await personalBrandingService.patchBrandProjectBuildKit('idea-1', [
      { op: 'updateSkill', name: 'My Skill', skillMarkdown: 'body' },
    ]);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/personal-branding/projects/ideas/idea-1/build-kit',
      {
        operations: [{ op: 'updateSkill', name: 'My Skill', skillMarkdown: 'body' }],
      }
    );
    expect(result).toEqual(idea);
  });
});
