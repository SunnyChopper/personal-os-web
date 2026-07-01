import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Combobox from '@/components/molecules/Combobox';

describe('Combobox', () => {
  it('selects an option from the list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Combobox value="" onChange={onChange} options={['Alpha', 'Beta']} placeholder="Pick" />
    );
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('Beta');
  });
});
