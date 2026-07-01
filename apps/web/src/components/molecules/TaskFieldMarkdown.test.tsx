import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskFieldMarkdown } from '@/components/molecules/TaskFieldMarkdown';

const { updateTask } = vi.hoisted(() => ({
  updateTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useGrowthSystem', () => ({
  useTasks: () => ({
    updateTask,
  }),
}));

describe('TaskFieldMarkdown', () => {
  beforeEach(() => {
    updateTask.mockReset();
    updateTask.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('patches the task field when a checklist item is toggled', async () => {
    const user = userEvent.setup();
    const value = '- [ ] step 1\n- [ ] step 2';

    render(<TaskFieldMarkdown taskId="task-1" field="description" value={value} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);

    await user.click(checkboxes[1]);

    expect(updateTask).toHaveBeenCalledTimes(1);
    expect(updateTask).toHaveBeenCalledWith({
      id: 'task-1',
      input: {
        description: '- [ ] step 1\n- [x] step 2',
      },
    });
  });

  it('does not call updateTask when readOnly', async () => {
    const value = '- [ ] step 1';

    render(<TaskFieldMarkdown taskId="task-1" field="notes" value={value} readOnly />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('readonly');

    const user = userEvent.setup();
    await user.click(checkbox);
    expect(updateTask).not.toHaveBeenCalled();
  });
});
