import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import OrderedStringListEditor from './OrderedStringListEditor';

function ControlledAnglesEditor({ initial = ['Agents', 'Infra'] }: { initial?: string[] }) {
  const [values, setValues] = useState(initial);
  return (
    <OrderedStringListEditor label="Conversation angles" values={values} onChange={setValues} />
  );
}

describe('OrderedStringListEditor', () => {
  it('adds a trimmed item on Add click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OrderedStringListEditor
        label="Conversation angles"
        values={[]}
        onChange={onChange}
        placeholder="One topic per row"
      />
    );

    await user.type(screen.getByPlaceholderText('One topic per row'), '  Shared infra  ');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onChange).toHaveBeenCalledWith(['Shared infra']);
  });

  it('adds on Enter and rejects duplicates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OrderedStringListEditor
        label="Conversation angles"
        values={['Agents']}
        onChange={onChange}
      />
    );

    const draft = screen.getByPlaceholderText('Add item');
    await user.type(draft, 'Agents{Enter}');
    expect(onChange).not.toHaveBeenCalled();

    await user.clear(draft);
    await user.type(draft, 'Infra{Enter}');
    expect(onChange).toHaveBeenCalledWith(['Agents', 'Infra']);
  });

  it('edits an existing row inline', () => {
    render(<ControlledAnglesEditor />);

    const rowInput = screen.getByLabelText('Conversation angles item 1');
    fireEvent.change(rowInput, { target: { value: 'LLM agents' } });

    expect(rowInput).toHaveValue('LLM agents');
    expect(screen.getByLabelText('Conversation angles item 2')).toHaveValue('Infra');
  });

  it('reorders items with up and down controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OrderedStringListEditor
        label="Conversation angles"
        values={['First', 'Second', 'Third']}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Move Second down' }));
    expect(onChange).toHaveBeenCalledWith(['First', 'Third', 'Second']);

    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Move Second up' }));
    expect(onChange).toHaveBeenCalledWith(['Second', 'First', 'Third']);
  });

  it('removes an item', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OrderedStringListEditor
        label="Conversation angles"
        values={['Keep', 'Remove me']}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Remove Remove me' }));
    expect(onChange).toHaveBeenCalledWith(['Keep']);
  });

  it('disables add at maxItems', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OrderedStringListEditor
        label="Conversation angles"
        values={['One', 'Two']}
        onChange={onChange}
        maxItems={2}
      />
    );

    expect(screen.getByText('Maximum 2 items.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    const draft = screen.getByPlaceholderText('Add item');
    expect(draft).toBeDisabled();
    await user.type(draft, 'Three');
    expect(onChange).not.toHaveBeenCalled();
  });
});
