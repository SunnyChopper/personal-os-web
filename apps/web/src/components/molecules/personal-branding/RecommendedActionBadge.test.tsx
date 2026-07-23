import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RecommendedActionBadge from './RecommendedActionBadge';

describe('RecommendedActionBadge', () => {
  it('renders reply label with icon', () => {
    render(<RecommendedActionBadge action="reply" />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('renders quote label with icon', () => {
    render(<RecommendedActionBadge action="quote" />);
    expect(screen.getByText('Quote')).toBeInTheDocument();
  });

  it('renders nothing when action is empty', () => {
    const { container } = render(<RecommendedActionBadge action={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('falls back to raw action label for unknown values', () => {
    render(<RecommendedActionBadge action="engage" />);
    expect(screen.getByText('engage')).toBeInTheDocument();
  });
});
