import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateDetailModal } from '@/components/molecules/DateDetailModal';
import type { Habit, HabitLog } from '@/types/growth-system';

const habit: Habit = {
  id: 'habit-1',
  name: 'Morning run',
  description: null,
  area: 'Health',
  subCategory: null,
  habitType: 'Build',
  frequency: 'Daily',
  dailyTarget: null,
  weeklyTarget: null,
  intent: null,
  trigger: null,
  action: null,
  reward: null,
  frictionUp: null,
  frictionDown: null,
  notes: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const log: HabitLog = {
  id: 'log-1',
  habitId: habit.id,
  completedAt: '2026-05-20T12:00:00.000Z',
  amount: 1,
  notes: 'Old note',
  userId: 'user-1',
  createdAt: '2026-05-20T12:00:00.000Z',
};

describe('DateDetailModal completion note edit', () => {
  it('shows saving overlay while the update is in flight', async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const onUpdateCompletionNote = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );

    render(
      <DateDetailModal
        isOpen
        onClose={() => {}}
        habit={habit}
        date={new Date(2026, 4, 20)}
        logs={[log]}
        onLog={() => {}}
        onUpdateCompletionNote={onUpdateCompletionNote}
      />
    );

    await user.click(screen.getByRole('button', { name: /edit note/i }));
    await user.clear(screen.getByPlaceholderText(/optional note/i));
    await user.type(screen.getByPlaceholderText(/optional note/i), 'Updated note');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(screen.getByText('Saving note…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

    resolveSave();
    await waitFor(() => {
      expect(screen.queryByText('Saving note…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Updated note')).toBeInTheDocument();
  });

  it('keeps the editor open with content when save fails', async () => {
    const user = userEvent.setup();
    const onUpdateCompletionNote = vi.fn(() => Promise.reject(new Error('Network error')));

    render(
      <DateDetailModal
        isOpen
        onClose={() => {}}
        habit={habit}
        date={new Date(2026, 4, 20)}
        logs={[log]}
        onLog={() => {}}
        onUpdateCompletionNote={onUpdateCompletionNote}
      />
    );

    await user.click(screen.getByRole('button', { name: /edit note/i }));
    const textarea = screen.getByPlaceholderText(/optional note/i);
    await user.clear(textarea);
    await user.type(textarea, 'Draft that failed');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
    expect(textarea).toHaveValue('Draft that failed');
    expect(screen.getByRole('button', { name: /^save$/i })).toBeEnabled();
  });
});
