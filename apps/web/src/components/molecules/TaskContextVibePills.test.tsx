import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TaskContextVibePills } from '@/components/molecules/TaskContextVibePills';
import type { TaskEnergyLevel, TaskExecutionWindow } from '@/types/growth-system';

function Harness() {
  const [energyLevel, setEnergyLevel] = useState<TaskEnergyLevel | undefined>('Low Kinetic');
  const [executionWindow, setExecutionWindow] = useState<TaskExecutionWindow | undefined>(
    'Morning Peak'
  );

  return (
    <TaskContextVibePills
      energyLevel={energyLevel}
      executionWindow={executionWindow}
      onEnergyChange={(v) => setEnergyLevel(v === null ? undefined : v)}
      onExecutionWindowChange={(v) => setExecutionWindow(v === null ? undefined : v)}
    />
  );
}

describe('TaskContextVibePills', () => {
  it('toggles energy and clears on second click', async () => {
    render(<Harness />);
    const lowBtn = screen.getByRole('button', { name: 'Low Kinetic' });
    expect(lowBtn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(lowBtn);
    expect(lowBtn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Admin' }));
    expect(screen.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('read-only hides when untagged', () => {
    const { container } = render(
      <TaskContextVibePills readOnly energyLevel={null} executionWindow={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
