import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Select', () => {
  it('renders options and forwards aria attributes', () => {
    render(
      <Select aria-label="Area">
        <option value="health">Health</option>
        <option value="work">Work</option>
      </Select>
    );
    const select = screen.getByRole('combobox', { name: 'Area' });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Health' })).toBeInTheDocument();
  });
});
import { Select } from '@/components/atoms/Select';
