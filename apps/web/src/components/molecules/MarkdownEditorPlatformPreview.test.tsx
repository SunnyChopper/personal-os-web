import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownEditor from './MarkdownEditor';

const SAMPLE_MD = '# Hello\n\nShort [link](https://example.com)';

describe('MarkdownEditor platform preview chrome', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1100);
  });

  it('wraps preview in platform chrome when previewPlatform is set', () => {
    render(
      <MarkdownEditor value={SAMPLE_MD} onChange={() => undefined} previewPlatform="linkedin" />
    );

    expect(screen.getByTestId('platform-preview-chrome')).toHaveAttribute(
      'data-platform',
      'linkedin'
    );
    expect(screen.getByText(/LinkedIn preview/)).toBeInTheDocument();
  });

  it('renders generic preview when previewPlatform is null', () => {
    render(<MarkdownEditor value={SAMPLE_MD} onChange={() => undefined} previewPlatform={null} />);

    expect(screen.queryByTestId('platform-preview-chrome')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor-preview')).toBeInTheDocument();
  });
});
