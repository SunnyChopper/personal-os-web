import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskFieldMarkdown } from '@/components/molecules/TaskFieldMarkdown';

const { updateTask, pushToastNotification } = vi.hoisted(() => ({
  updateTask: vi.fn(),
  pushToastNotification: vi.fn(),
}));

vi.mock('@/hooks/useGrowthSystem', () => ({
  useTasks: () => ({
    updateTask,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  pushToastNotification,
}));

describe('TaskFieldMarkdown errors', () => {
  beforeEach(() => {
    updateTask.mockReset();
    updateTask.mockRejectedValue(new Error('network'));
    pushToastNotification.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows an error toast when updateTask fails', async () => {
    const user = userEvent.setup();
    const value = '- [ ] step 1\n- [ ] step 2';

    render(<TaskFieldMarkdown taskId="task-1" field="description" value={value} />);

    await user.click(screen.getAllByRole('checkbox')[1]);

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(pushToastNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to update task description',
      });
    });
  });
});
