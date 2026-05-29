import { describe, expect, it, vi, beforeEach } from 'vitest';
import { goalsService } from '../goals.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('goalsService.getAll', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('serializes health query param', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });

    await goalsService.getAll({ health: 'atRisk' });

    expect(apiClient.get).toHaveBeenCalledWith('/goals?health=atRisk');
  });
});
