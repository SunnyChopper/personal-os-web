import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import PresetMultiSelectChips from './PresetMultiSelectChips';

const PRESETS = ['AI', 'Tech', 'SaaS'] as const;

function ControlledTagsEditor({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <PresetMultiSelectChips
      label="Tags"
      value={value}
      onChange={setValue}
      presets={PRESETS}
      maxItems={3}
    />
  );
}

describe('PresetMultiSelectChips', () => {
  it('toggles preset chips on and off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <PresetMultiSelectChips label="Tags" value={[]} onChange={onChange} presets={PRESETS} />
    );

    await user.click(screen.getByRole('button', { name: 'AI' }));
    expect(onChange).toHaveBeenCalledWith(['AI']);

    onChange.mockClear();
    rerender(
      <PresetMultiSelectChips
        label="Tags"
        value={['AI', 'Tech']}
        onChange={onChange}
        presets={PRESETS}
      />
    );

    await user.click(screen.getByRole('button', { name: 'AI' }));
    expect(onChange).toHaveBeenCalledWith(['Tech']);
  });

  it('adds a custom tag via Add custom and Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <PresetMultiSelectChips label="Tags" value={[]} onChange={onChange} presets={PRESETS} />
    );

    const draft = screen.getByLabelText('Tags custom draft');
    await user.type(draft, '  creator economy  ');
    await user.click(screen.getByRole('button', { name: 'Add custom' }));
    expect(onChange).toHaveBeenCalledWith(['creator economy']);

    onChange.mockClear();
    await user.type(draft, 'Infra{Enter}');
    expect(onChange).toHaveBeenCalledWith(['Infra']);
  });

  it('dedupes custom tags and maps preset-matching text to the preset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <PresetMultiSelectChips label="Tags" value={['AI']} onChange={onChange} presets={PRESETS} />
    );

    const draft = screen.getByLabelText('Tags custom draft');
    await user.type(draft, 'AI{Enter}');
    expect(onChange).not.toHaveBeenCalled();

    onChange.mockClear();
    await user.clear(draft);
    await user.type(draft, 'Tech{Enter}');
    expect(onChange).toHaveBeenCalledWith(['AI', 'Tech']);
  });

  it('removes custom tags with the remove control', async () => {
    const user = userEvent.setup();

    render(<ControlledTagsEditor initial={['AI', 'creator economy']} />);

    expect(screen.getByText('creator economy')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove creator economy' }));
    expect(screen.queryByText('creator economy')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('blocks adds at maxItems', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <PresetMultiSelectChips
        label="Tags"
        value={['AI', 'Tech', 'SaaS']}
        onChange={onChange}
        presets={PRESETS}
        maxItems={3}
      />
    );

    expect(screen.getByText('Maximum 3 tags.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add custom' })).toBeDisabled();
    expect(screen.getByLabelText('Tags custom draft')).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'AI' }));
    expect(onChange).toHaveBeenCalledWith(['Tech', 'SaaS']);
  });
});
