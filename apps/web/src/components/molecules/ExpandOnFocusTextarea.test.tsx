import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ExpandOnFocusTextarea from '@/components/molecules/ExpandOnFocusTextarea';

describe('ExpandOnFocusTextarea', () => {
  it('renders collapsed (rows=1) when empty and unfocused', () => {
    render(<ExpandOnFocusTextarea aria-label="Seed ideas" value="" onChange={() => {}} />);
    const field = screen.getByRole('textbox', { name: 'Seed ideas' });
    expect(field).toHaveAttribute('rows', '1');
    expect(field.className).toContain('min-h-0');
    expect(field.className).toContain('resize-none');
  });

  it('expands on focus', async () => {
    const user = userEvent.setup();
    render(<ExpandOnFocusTextarea aria-label="Seed ideas" value="" onChange={() => {}} />);
    const field = screen.getByRole('textbox', { name: 'Seed ideas' });
    await user.click(field);
    expect(field).toHaveAttribute('rows', '3');
    expect(field.className).toContain('min-h-[4rem]');
    expect(field.className).toContain('resize-y');
  });

  it('stays expanded after blur when value is non-empty', async () => {
    const user = userEvent.setup();
    render(
      <ExpandOnFocusTextarea
        aria-label="Seed ideas"
        value="observability angles"
        onChange={() => {}}
      />
    );
    const field = screen.getByRole('textbox', { name: 'Seed ideas' });
    await user.click(field);
    await user.tab();
    expect(field).toHaveAttribute('rows', '3');
    expect(field.className).toContain('min-h-[4rem]');
  });

  it('collapses after blur when value is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ExpandOnFocusTextarea aria-label="Seed ideas" value="" onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Seed ideas' });
    await user.click(field);
    await user.type(field, 'x');
    await user.clear(field);
    await user.tab();
    expect(field).toHaveAttribute('rows', '1');
    expect(field.className).toContain('min-h-0');
  });

  it('expands when value is provided without focus', () => {
    render(
      <ExpandOnFocusTextarea
        aria-label="Seed ideas"
        value="platform strategy"
        onChange={() => {}}
      />
    );
    const field = screen.getByRole('textbox', { name: 'Seed ideas' });
    expect(field).toHaveAttribute('rows', '3');
    expect(field.className).toContain('min-h-[4rem]');
  });

  it('forwards onFocus and onBlur to caller', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <ExpandOnFocusTextarea
        aria-label="Seed ideas"
        value=""
        onChange={() => {}}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
    const field = screen.getByRole('textbox', { name: 'Seed ideas' });
    await user.click(field);
    expect(onFocus).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
