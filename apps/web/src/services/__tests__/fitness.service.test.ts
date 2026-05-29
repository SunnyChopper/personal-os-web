import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fitnessService } from '@/services/fitness.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

describe('fitnessService reward rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists reward rules with pagination query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    await fitnessService.listRewardRules(2, 25, true);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/fitness/reward-rules?page=2&pageSize=25&activeOnly=true'
    );
  });

  it('claims a reward rule', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { claim: { points: 5 }, walletBalance: 100 },
    });
    await fitnessService.claimRewardRule('rule-1');
    expect(apiClient.post).toHaveBeenCalledWith('/fitness/reward-rules/rule-1/claim', {});
  });

  it('lists reward claims with optional filters', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 30, hasMore: false },
    });
    await fitnessService.listRewardClaims({
      ruleId: 'r1',
      startDate: '2026-05-01',
      endDate: '2026-05-28',
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/fitness/reward-claims?page=1&pageSize=30&ruleId=r1&startDate=2026-05-01&endDate=2026-05-28'
    );
  });
});
