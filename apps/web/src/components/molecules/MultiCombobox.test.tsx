import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MultiCombobox from '@/components/molecules/MultiCombobox';

describe('MultiCombobox', () => {
  it('adds a selected option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiCombobox value={[]} onChange={onChange} options={['One', 'Two']} placeholder="Add" />
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'One' }));
    expect(onChange).toHaveBeenCalledWith(['One']);
  });
});
