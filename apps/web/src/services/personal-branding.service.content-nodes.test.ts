import { beforeEach, describe, expect, it, vi } from 'vitest';
import { personalBrandingService } from '@/services/personal-branding.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('personalBrandingService.listContentNodes', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('unwraps envelope and returns paginated page with items at .data', async () => {
    const node = {
      id: 'content-1',
      title: 'Draft post',
      status: 'DRAFT',
      contentType: 'DEEP_DIVE_BLOG',
      body: '',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: {
        data: [node],
        total: 1,
        page: 1,
        pageSize: 100,
        hasMore: false,
      },
    });

    const page = await personalBrandingService.listContentNodes(1, 100);

    expect(apiClient.get).toHaveBeenCalledWith('/personal-branding/content?page=1&pageSize=100');
    expect(page.data).toEqual([node]);
    expect(page.total).toBe(1);
    expect(page.data.length).toBe(1);
  });

  it('appends sortBy and sortOrder when provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 100,
        hasMore: false,
      },
    });

    await personalBrandingService.listContentNodes(1, 100, undefined, {
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/personal-branding/content?page=1&pageSize=100&sortBy=updatedAt&sortOrder=desc'
    );
  });

  it('passes includeSkipped when requested', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 100,
        hasMore: false,
      },
    });

    await personalBrandingService.listContentNodes(1, 100, undefined, { includeSkipped: true });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/personal-branding/content?page=1&pageSize=100&includeSkipped=true'
    );
  });
});
