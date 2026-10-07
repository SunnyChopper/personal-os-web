import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlatformPreviewChrome from './PlatformPreviewChrome';

describe('PlatformPreviewChrome', () => {
  it('renders platform header and character meter from catalog defaults', () => {
    render(
      <PlatformPreviewChrome platform="x" content={'a'.repeat(100)}>
        <p>Preview body</p>
      </PlatformPreviewChrome>
    );

    const chrome = screen.getByTestId('platform-preview-chrome');
    expect(chrome).toHaveAttribute('data-platform', 'x');
    expect(screen.getByText(/X \(Twitter\) preview/)).toBeInTheDocument();
    expect(screen.getByText('100/280 chars')).toBeInTheDocument();
    expect(screen.getByText('Preview body')).toBeInTheDocument();
  });

  it('highlights meter when over platform character limit', () => {
    render(
      <PlatformPreviewChrome platform="x" content={'a'.repeat(300)}>
        <p>Long post</p>
      </PlatformPreviewChrome>
    );

    const meter = screen.getByText('300/280 chars');
    expect(meter).toHaveClass('text-amber-700');
  });

  it('shows configured character and read-time target ranges', () => {
    render(
      <PlatformPreviewChrome
        platform="x"
        content={'a'.repeat(100)}
        characterMinimum={200}
        characterLimit={300}
        readTimeMinimumMinutes={1}
        readTimeLimitMinutes={2}
      >
        <p>Targeted preview</p>
      </PlatformPreviewChrome>
    );

    expect(screen.getByText(/100\/200–\s*300 chars/)).toBeInTheDocument();
    expect(screen.getByText(/Target: 200–300 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Read time target: 1–2 minutes/)).toBeInTheDocument();
  });
});
