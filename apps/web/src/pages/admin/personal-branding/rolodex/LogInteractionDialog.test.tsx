import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LogInteractionDialog from './LogInteractionDialog';

function renderDialog(overrides: Partial<Parameters<typeof LogInteractionDialog>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  render(
    <LogInteractionDialog
      isOpen
      onClose={onClose}
      connectionName="Example Creator"
      followUpCadenceDays={14}
      onSubmit={onSubmit}
      {...overrides}
    />
  );

  return { onSubmit, onClose };
}

function fieldOrder(): string[] {
  const dialog = screen.getByRole('dialog', { name: /Log check-in/i });
  const labels = within(dialog).getAllByText(
    /^(Evidence URL|Description|Channel|Creator text|Next follow-up)$/i
  );
  return labels.map((node) => node.textContent?.trim() ?? '');
}

describe('LogInteractionDialog', () => {
  it('disables Save when both evidence URL and description are empty', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: 'Save interaction' })).toBeDisabled();
  });

  it('enables Save when evidence URL has non-whitespace', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Evidence URL'), 'https://x.com/example/status/1');

    expect(screen.getByRole('button', { name: 'Save interaction' })).toBeEnabled();
  });

  it('enables Save when description has non-whitespace', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Description'), 'Replied with a thoughtful comment.');

    expect(screen.getByRole('button', { name: 'Save interaction' })).toBeEnabled();
  });

  it('orders fields Evidence → Optional → cadence strip', () => {
    renderDialog();

    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(fieldOrder()).toEqual([
      'Evidence URL',
      'Description',
      'Channel',
      'Creator text',
      'Next follow-up',
    ]);
  });

  it('uses compact textarea heights and tighter fieldset spacing', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: /Log check-in/i });
    const fieldset = within(dialog).getByRole('group', { name: /Evidence/i }).closest('fieldset');
    expect(fieldset).toHaveClass('space-y-3');

    expect(screen.getByLabelText('Description')).toHaveClass('min-h-[64px]');
    expect(screen.getByLabelText('Creator text')).toHaveClass('min-h-[64px]');
  });

  it('uses muted labels for optional and cadence fields', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: /Log check-in/i });
    expect(within(dialog).getByText('Channel', { selector: 'label' })).toHaveClass(
      'text-xs',
      'font-normal',
      'text-gray-500'
    );
    expect(within(dialog).getByText('Creator text', { selector: 'label' })).toHaveClass(
      'text-xs',
      'font-normal',
      'text-gray-500'
    );
    expect(within(dialog).getByText('Next follow-up', { selector: 'label' })).toHaveClass(
      'text-xs',
      'font-normal',
      'text-gray-500'
    );
  });

  it('submits unchanged payload shape when Save is clicked', async () => {
    const user = userEvent.setup();
    const { onSubmit, onClose } = renderDialog({
      initialChannel: 'x',
      initialCreatorText: 'Great thread on observability.',
      initialPlatform: 'x',
      initialPlatformPostId: 'post-1',
    });

    await user.type(screen.getByLabelText('Evidence URL'), 'https://x.com/example/status/1');
    await user.click(screen.getByRole('button', { name: 'Save interaction' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        interactionType: 'check_in',
        channel: 'x',
        evidenceUrl: 'https://x.com/example/status/1',
        description: null,
        creatorText: 'Great thread on observability.',
        platform: 'x',
        platformPostId: 'post-1',
        nextFollowUpAt: expect.any(String),
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
