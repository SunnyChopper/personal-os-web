import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useDashboardInsights } from '@/hooks/useDashboardInsights';
import { dashboardInsightsService } from '@/services/growth-system/dashboard-insights.service';

vi.mock('@/services/growth-system/dashboard-insights.service', () => ({
  dashboardInsightsService: {
    getLatest: vi.fn(),
    regenerate: vi.fn(),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useDashboardInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads insights from the service', async () => {
    vi.mocked(dashboardInsightsService.getLatest).mockResolvedValue({
      success: true,
      data: {
        insights: [
          {
            id: 'a',
            type: 'warning',
            severity: 'high',
            title: 'Test',
            description: 'Desc',
            detectorType: 'blockedInFocus',
          },
        ],
        generatedAt: '2026-05-27T12:00:00Z',
        focusAreas: ['Wealth'],
        provider: 'groq',
        model: '',
        cached: false,
        status: 'fresh',
      },
    });

    const { result } = renderHook(() => useDashboardInsights(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.insights).toHaveLength(1);
    expect(result.current.status).toBe('fresh');
  });
});
