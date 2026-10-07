import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClampedShowMoreText } from './ClampedShowMoreText';

const SHORT_TEXT = 'Short post body.';
const LONG_TEXT =
  'Line one of a long recon post body.\n' +
  'Line two continues with more context.\n' +
  'Line three adds detail about the topic.\n' +
  'Line four should push past the default clamp.\n' +
  'Line five is only visible after expand.';
const QUOTED_TEXT =
  'Primary tweet body here.\n\nQuoted:\nThis is the quoted tweet text that must stay on its own lines.';
const QUOTED_BODY = 'This is the quoted tweet text that must stay on its own lines.';

function mockTextOverflow(overflow: boolean, marker = 'Line one') {
  const scrollHeight = overflow ? 120 : 40;
  const clientHeight = 40;

  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
    this: HTMLElement
  ) {
    if (this.tagName === 'DIV' && this.textContent?.includes(marker)) {
      return scrollHeight;
    }
    return 0;
  });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement
  ) {
    if (this.tagName === 'DIV' && this.textContent?.includes(marker)) {
      return clientHeight;
    }
    return 0;
  });
}

describe('ClampedShowMoreText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders short text without a toggle', () => {
    mockTextOverflow(false, SHORT_TEXT);
    render(<ClampedShowMoreText text={SHORT_TEXT} />);

    const node = screen.getByText(SHORT_TEXT);
    expect(node).toHaveClass('whitespace-pre-wrap');
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('shows Show more for overflowing text and toggles expand/collapse', async () => {
    const user = userEvent.setup();
    mockTextOverflow(true);
    const { container } = render(<ClampedShowMoreText text={LONG_TEXT} lines={4} />);

    const contentWrapper = container.querySelector('.line-clamp-4');
    expect(contentWrapper).toBeTruthy();
    expect(screen.getByText(/Line one of a long recon post body/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(container.querySelector('.line-clamp-4')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show less' }));

    expect(container.querySelector('.line-clamp-4')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });

  it('renders quoted body in a dense inset panel separate from primary text', () => {
    mockTextOverflow(false, 'Primary tweet');
    const { container } = render(<ClampedShowMoreText text={QUOTED_TEXT} />);

    expect(screen.getByText('Primary tweet body here.')).toHaveClass('whitespace-pre-wrap');
    expect(screen.queryByText(QUOTED_TEXT)).not.toBeInTheDocument();

    const srOnlyLabel = container.querySelector('.sr-only');
    expect(srOnlyLabel).toHaveTextContent('Quoted');
    expect(screen.queryByText('Quoted', { selector: 'p' })).not.toBeInTheDocument();

    const inset = srOnlyLabel?.closest('.rounded-lg.border');
    expect(inset).toBeTruthy();
    expect(inset).toHaveClass('p-2');

    expect(within(inset as HTMLElement).getByText(QUOTED_BODY)).toHaveClass('whitespace-pre-wrap');
  });

  it('keeps quoted inset inside the shared line-clamp wrapper when overflowing', () => {
    mockTextOverflow(true, 'Primary tweet');
    const longQuotedText =
      'Primary tweet body here.\n\nQuoted:\n' +
      'Quoted line one with extra context.\n' +
      'Quoted line two continues.\n' +
      'Quoted line three adds detail.\n' +
      'Quoted line four should overflow the clamp.';
    const { container } = render(<ClampedShowMoreText text={longQuotedText} lines={4} />);

    const contentWrapper = container.querySelector('.line-clamp-4');
    expect(contentWrapper).toBeTruthy();
    expect(contentWrapper?.querySelector('.rounded-lg.border')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });

  it('does not split text without the exact Quoted marker', () => {
    const text = 'Primary says Quoted: inline but not a block.';
    mockTextOverflow(false, text);
    render(<ClampedShowMoreText text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText('Quoted')).not.toBeInTheDocument();
  });

  it('resets expanded state when text changes', async () => {
    const user = userEvent.setup();
    mockTextOverflow(true);
    const { container, rerender } = render(<ClampedShowMoreText text={LONG_TEXT} />);

    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();

    rerender(<ClampedShowMoreText text="Different post body for a new card." />);

    expect(screen.queryByRole('button', { name: 'Show less' })).not.toBeInTheDocument();
    expect(container.querySelector('.line-clamp-4')).toBeTruthy();
    expect(screen.getByText('Different post body for a new card.')).toBeInTheDocument();
  });

  it('renders nothing for empty text', () => {
    const { container } = render(<ClampedShowMoreText text="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
