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
    await user.click(screen.getByRole('option', { name: /X \(Twitter\)/ }));
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('renders description as a secondary line and selects by value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <IconSelect
        value="a"
        onChange={onChange}
        aria-label="Source content"
        options={[
          {
            value: 'a',
            label: 'How Transformer Architecture Works',
            description: 'Medium · 2026-07-15 · how-transformer-architecture',
          },
          {
            value: 'b',
            label: 'Another Post',
            description: 'LinkedIn · 2026-07-10 · another-post',
          },
        ]}
      />
    );

    expect(screen.getByText('How Transformer Architecture Works')).toBeInTheDocument();
    expect(
      screen.getByText('Medium · 2026-07-15 · how-transformer-architecture')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Source content' }));
    await user.click(screen.getByRole('option', { name: /Another Post/ }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
