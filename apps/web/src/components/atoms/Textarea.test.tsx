import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('Textarea', () => {
  it('accepts text input', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" />);
    const field = screen.getByRole('textbox', { name: 'Notes' });
    await user.type(field, 'hello');
    expect(field).toHaveValue('hello');
  });
});
import { Textarea } from '@/components/atoms/Textarea';
