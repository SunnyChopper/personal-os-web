import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExpandablePlainTextPreview } from './ExpandablePlainTextPreview';

describe('ExpandablePlainTextPreview', () => {
  it('renders nothing for blank text', () => {
    const { container } = render(<ExpandablePlainTextPreview text="   " />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders short text without a toggle', () => {
    render(<ExpandablePlainTextPreview text="Short preview copy." />);

    expect(screen.getByText('Short preview copy.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('truncates long text and toggles full content', async () => {
    const user = userEvent.setup();
    const firstSentence =
      'This opening sentence is long enough to land inside the truncation search window before the break. ';
    const secondSentence =
      'This second sentence continues with more detail about the topic and keeps going until it is definitely longer than the preview budget.';
    const body = firstSentence + secondSentence;

    render(<ExpandablePlainTextPreview text={body} maxChars={120} />);

    expect(screen.getByText(/truncation search window/)).toBeInTheDocument();
    expect(screen.queryByText(/second sentence continues/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(screen.getByText(body.replace(/\s+/g, ' ').trim())).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });
});
