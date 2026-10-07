import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor preview copy as markdown', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1100);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'toast-test-id',
    });
  });

  it('hides copy button when preview content is empty', () => {
    render(
      <MarkdownEditor
        value=""
        onChange={() => {
          /* noop */
        }}
      />
    );
    expect(screen.queryByRole('button', { name: 'Copy as Markdown' })).toBeNull();
  });

  it('hides copy button when preview content is whitespace-only', () => {
    render(
      <MarkdownEditor
        value={'   \n  '}
        onChange={() => {
          /* noop */
        }}
      />
    );
    expect(screen.queryByRole('button', { name: 'Copy as Markdown' })).toBeNull();
  });

  it('shows copy button when preview has content in split view', () => {
    render(
      <MarkdownEditor
        value="# Hello\n\nWorld"
        onChange={() => {
          /* noop */
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Copy as Markdown' })).toBeInTheDocument();
  });

  it('copies exact markdown source byte-for-byte and shows Copied toast', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const source = '  # Title\n\nBody with spaces  ';
    render(
      <MarkdownEditor
        value={source}
        onChange={() => {
          /* noop */
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Copy as Markdown' }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(source);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('hides copy button in edit-only mode', async () => {
    const user = userEvent.setup();
    render(
      <MarkdownEditor
        value="# X"
        onChange={() => {
          /* noop */
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Copy as Markdown' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit Mode' }));
    expect(screen.queryByRole('button', { name: 'Copy as Markdown' })).toBeNull();
  });
});
