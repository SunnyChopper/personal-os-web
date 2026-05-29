import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaskFieldMarkdown } from '@/components/molecules/TaskFieldMarkdown';

const updateTask = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useGrowthSystem', () => ({
  useTasks: () => ({
    updateTask,
  }),
}));

describe('TaskFieldMarkdown', () => {
  it('patches the task field when a checklist item is toggled', async () => {
    updateTask.mockClear();
    const value = '- [ ] step 1\n- [ ] step 2';

    render(<TaskFieldMarkdown taskId="task-1" field="description" value={value} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    await userEvent.click(checkboxes[1]);

    expect(updateTask).toHaveBeenCalledTimes(1);
    expect(updateTask).toHaveBeenCalledWith({
      id: 'task-1',
      input: {
        description: '- [ ] step 1\n- [x] step 2',
      },
    });
  });

  it('does not call updateTask when readOnly', async () => {
    updateTask.mockClear();
    const value = '- [ ] step 1';

    render(<TaskFieldMarkdown taskId="task-1" field="notes" value={value} readOnly />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('readonly');

    await userEvent.click(checkbox);
    expect(updateTask).not.toHaveBeenCalled();
  });
});
