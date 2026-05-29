import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AIInsightsWidget } from '@/components/organisms/AIInsightsWidget';

const regenerate = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useDashboardInsights', () => ({
  useDashboardInsights: vi.fn(),
}));

import { useDashboardInsights } from '@/hooks/useDashboardInsights';

function renderWidget() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AIInsightsWidget />
    </QueryClientProvider>
  );
}

describe('AIInsightsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders server insights', () => {
    vi.mocked(useDashboardInsights).mockReturnValue({
      insights: [
        {
          id: 'onHoldOutsideFocus',
          type: 'bottleneck',
          severity: 'high',
          title: '3 on hold in Operations',
          description: "Today's focus is Wealth.",
          detectorType: 'onHoldOutsideFocus',
        },
      ],
      summary: 'Align work with focus',
      generatedAt: '2026-05-27T12:00:00Z',
      focusAreas: ['Wealth'],
      status: 'fresh',
      cached: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      regenerate,
      isRegenerating: false,
    });

    renderWidget();
    expect(screen.getByText('3 on hold in Operations')).toBeInTheDocument();
    expect(screen.getByText(/Focus: Wealth/)).toBeInTheDocument();
  });

  it('refresh triggers regenerate', async () => {
    vi.mocked(useDashboardInsights).mockReturnValue({
      insights: [],
      summary: undefined,
      generatedAt: undefined,
      focusAreas: [],
      status: 'pending',
      cached: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      regenerate,
      isRegenerating: false,
    });

    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Insights' }));
    await waitFor(() => expect(regenerate).toHaveBeenCalledWith({ force: true }));
  });

  it('shows pending empty state', () => {
    vi.mocked(useDashboardInsights).mockReturnValue({
      insights: [],
      summary: undefined,
      generatedAt: undefined,
      focusAreas: [],
      status: 'pending',
      cached: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      regenerate,
      isRegenerating: false,
    });

    renderWidget();
    expect(screen.getByText(/Insights are generated daily/)).toBeInTheDocument();
  });
});
