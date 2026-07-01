import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IconSelect from '@/components/molecules/IconSelect';

describe('IconSelect', () => {
  it('selects an option with icon and label from the list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <IconSelect
        value="linkedin"
        onChange={onChange}
        aria-label="Platform"
        options={[
          {
            value: 'linkedin',
            label: 'LinkedIn',
            icon: <span data-testid="linkedin-icon">LI</span>,
          },
          {
            value: 'x',
            label: 'X (Twitter)',
            icon: <span data-testid="x-icon">X</span>,
          },
        ]}
      />
    );

    expect(screen.getByTestId('linkedin-icon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Platform' }));
    await user.click(screen.getByRole('option', { name: 'X (Twitter)' }));
    expect(onChange).toHaveBeenCalledWith('x');
  });
});
