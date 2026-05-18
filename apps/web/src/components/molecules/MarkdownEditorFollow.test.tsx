import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

const FOLLOW_KEY = 'markdown-editor-follow-mode';

describe('MarkdownEditor follow mode', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1100);
  });

  it('defaults follow mode on and persists toggle', async () => {
    const user = userEvent.setup();
    expect(localStorage.getItem(FOLLOW_KEY)).toBeNull();
    render(
      <MarkdownEditor
        value={'# Hello\n\nWorld'}
        onChange={() => {
          /* noop */
        }}
      />
    );
    const followBtn = screen.getByRole('button', { name: /Follow scroll/i });
    expect(followBtn).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(FOLLOW_KEY)).toBe('1');

    await user.click(followBtn);
    expect(followBtn).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem(FOLLOW_KEY)).toBe('0');
  });

  it('hides follow control outside split view', async () => {
    const user = userEvent.setup();
    render(
      <MarkdownEditor
        value="# X"
        onChange={() => {
          /* noop */
        }}
      />
    );
    expect(screen.getByRole('button', { name: /Follow scroll/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit Mode' }));
    expect(screen.queryByRole('button', { name: /Follow scroll/i })).toBeNull();
  });

  it('hides split and follow on narrow viewports', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(400);
    render(
      <MarkdownEditor
        value="# X"
        onChange={() => {
          /* noop */
        }}
      />
    );
    expect(screen.queryByRole('button', { name: 'Split View' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Follow scroll/i })).toBeNull();
  });
});
