import { describe, expect, it, vi, beforeEach } from 'vitest';
import { observabilityService } from '../observability.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('observabilityService.listExecutions', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('serializes providerRequestId query param', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });

    await observabilityService.listExecutions({ providerRequestId: 'req_01abc' });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/observability/executions?providerRequestId=req_01abc'
    );
  });
});
