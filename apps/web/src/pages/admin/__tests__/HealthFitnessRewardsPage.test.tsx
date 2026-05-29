import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HealthFitnessRewardsPage from '../HealthFitnessRewardsPage';

vi.mock('@/hooks/useFitness', () => ({
  useFitnessRewardRules: vi.fn(() => ({
    data: {
      success: true,
      data: {
        data: [
          {
            id: 'r1',
            userId: 'u1',
            name: 'Water',
            description: null,
            category: 'hydration',
            points: 5,
            target: '12oz',
            triggerType: 'manual',
            autoMetric: null,
            exerciseId: null,
            cooldownHours: null,
            maxClaimsPerDay: null,
            isActive: true,
            createdAt: '2026-05-28T00:00:00Z',
            updatedAt: '2026-05-28T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
        hasMore: false,
      },
    },
    isLoading: false,
  })),
  useFitnessRewardClaims: vi.fn(() => ({
    data: { success: true, data: { data: [], total: 0, page: 1, pageSize: 30, hasMore: false } },
  })),
  useFitnessExercises: vi.fn(() => ({
    data: { success: true, data: { data: [], total: 0, page: 1, pageSize: 100, hasMore: false } },
  })),
  useCreateRewardRuleMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateRewardRuleMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteRewardRuleMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useClaimRewardRuleMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HealthFitnessRewardsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HealthFitnessRewardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reward points heading and manual quick claim', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reward points/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /water \(\+5\)/i })).toBeInTheDocument();
  });
});
