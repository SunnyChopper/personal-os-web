import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MorningLaunchpad } from '@/components/organisms/MorningLaunchpad';

const mutateAsyncMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/hooks/useGrowthSystem', () => ({
  useTasks: () => ({
    tasks: [],
    updateTask: vi.fn(),
    completeTask: vi.fn(),
  }),
  useHabits: () => ({ habits: [] }),
  useGoals: () => ({ goals: [] }),
}));

vi.mock('@/hooks/useFitness', () => ({
  useFitnessRecoveryRange: () => ({ data: undefined }),
  useUpsertRecoveryMutation: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

describe('MorningLaunchpad recovery save', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    showToastMock.mockReset();
  });

  it('disables save until at least one recovery field has a value', () => {
    render(
      <MemoryRouter>
        <MorningLaunchpad isOpen topTasks={[]} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Save recovery' })).toBeDisabled();
    expect(screen.getByText('Add at least one field to save.')).toBeInTheDocument();
  });

  it('shows error toast with retry when save fails', async () => {
    mutateAsyncMock.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <MorningLaunchpad isOpen topTasks={[]} onClose={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Sleep (h)'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save recovery' }));

    await vi.waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Could not save recovery',
          message: 'Network error',
          action: expect.objectContaining({ label: 'Retry' }),
        })
      );
    });
  });
});
