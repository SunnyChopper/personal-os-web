import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { HealthActionWidget } from '@/components/organisms/HealthActionWidget';

vi.mock('@/hooks/useHealthAction', () => ({
  useHealthAction: vi.fn(),
}));

import { useHealthAction } from '@/hooks/useHealthAction';

function renderWidget() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HealthActionWidget />
    </QueryClientProvider>
  );
}

describe('HealthActionWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows recovery warning styling for lowRecoveryRest', () => {
    vi.mocked(useHealthAction).mockReturnValue({
      action: {
        id: 'lowRecoveryRest',
        category: 'rest',
        severity: 'high',
        title: 'Prioritize recovery today',
        description: 'Your recovery signals suggest rest.',
        recommendation: 'Ease training intensity.',
        detectorType: 'lowRecoveryRest',
        action: { label: 'View recovery', link: '/admin/health-fitness' },
      },
      generatedAt: '2026-05-28T06:00:00Z',
      status: 'fresh',
      alternativeCount: 0,
      cached: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      regenerate: vi.fn(),
      isRegenerating: false,
    });

    renderWidget();
    expect(screen.getByText('Recovery warning')).toBeInTheDocument();
    expect(screen.getByText(/Suboptimal recovery — consider easing intensity/)).toBeInTheDocument();
    expect(screen.getByText('Prioritize recovery today')).toBeInTheDocument();
  });

  it('shows default heading for non-recovery actions', () => {
    vi.mocked(useHealthAction).mockReturnValue({
      action: {
        id: 'logRecovery',
        category: 'recovery',
        severity: 'low',
        title: 'Log how you slept',
        description: 'No recovery check-in for today.',
        detectorType: 'logRecovery',
      },
      generatedAt: '2026-05-28T06:00:00Z',
      status: 'fresh',
      alternativeCount: 0,
      cached: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      regenerate: vi.fn(),
      isRegenerating: false,
    });

    renderWidget();
    expect(screen.getByText('One Health Thing')).toBeInTheDocument();
    expect(screen.queryByText('Recovery warning')).not.toBeInTheDocument();
  });
});
