import { describe, expect, it, vi, beforeEach } from 'vitest';
import { dashboardInsightsService } from '@/services/growth-system/dashboard-insights.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('dashboardInsightsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLatest returns data on success', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: {
        insights: [],
        generatedAt: '2026-05-27T12:00:00Z',
        focusAreas: ['Wealth'],
        provider: 'groq',
        model: '',
        cached: false,
        status: 'fresh',
      },
    });

    const result = await dashboardInsightsService.getLatest();
    expect(apiClient.get).toHaveBeenCalledWith('/ai/dashboard/insights');
    expect(result.data?.status).toBe('fresh');
  });

  it('regenerate posts force flag', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        insights: [
          {
            id: '1',
            title: 't',
            description: 'd',
            type: 'warning',
            severity: 'high',
            detectorType: 'x',
          },
        ],
        generatedAt: '2026-05-27T12:00:00Z',
        focusAreas: [],
        provider: '',
        model: '',
        cached: true,
        status: 'fresh',
      },
    });

    await dashboardInsightsService.regenerate({ force: true });
    expect(apiClient.post).toHaveBeenCalledWith('/ai/dashboard/insights/regenerate', {
      force: true,
      useCache: true,
    });
  });
});
