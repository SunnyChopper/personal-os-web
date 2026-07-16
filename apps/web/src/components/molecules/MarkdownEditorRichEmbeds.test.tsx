import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

const RICH_EMBEDS_KEY = 'markdown-editor-rich-embeds';
const YOUTUBE_MD =
  '[YouTube Link](https://www.youtube.com/watch?v=LPZh90jKq8s)\n\nPlain [example](https://example.com)';

describe('MarkdownEditor rich embeds', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1100);
  });

  it('defaults rich embeds on when toggle is enabled and persists toggle', async () => {
    const user = userEvent.setup();
    render(
      <MarkdownEditor
        value={YOUTUBE_MD}
        onChange={() => {
          /* noop */
        }}
        enableRichEmbedsToggle
      />
    );

    const richBtn = screen.getByRole('button', { name: /Rich embeds/i });
    expect(richBtn).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(RICH_EMBEDS_KEY)).toBe('1');
    expect(screen.getByTestId('youtube-embed')).toBeInTheDocument();
    expect(screen.getByTitle('YouTube Link')).toBeInTheDocument();

    await user.click(richBtn);
    expect(richBtn).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem(RICH_EMBEDS_KEY)).toBe('0');
    expect(screen.queryByTestId('youtube-embed')).toBeNull();
    expect(screen.getByRole('link', { name: 'YouTube Link' })).toBeInTheDocument();
  });

  it('hides rich embeds control when toggle prop is off', () => {
    render(
      <MarkdownEditor
        value={YOUTUBE_MD}
        onChange={() => {
          /* noop */
        }}
      />
    );

    expect(screen.queryByRole('button', { name: /Rich embeds/i })).toBeNull();
    expect(screen.queryByTestId('youtube-embed')).toBeNull();
  });
});
