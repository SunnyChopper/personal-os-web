import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VariantPerformanceStrip } from './VariantPerformanceStrip';

describe('VariantPerformanceStrip', () => {
  it('renders compact chips and an accessible bar chart', () => {
    render(
      <VariantPerformanceStrip engagement={{ views: 1200, likes: 48, comments: 6, shares: 2 }} />
    );

    const strip = screen.getByTestId('variant-performance-strip');
    expect(strip).toHaveTextContent('1.2k');
    expect(strip).toHaveTextContent('views');
    expect(strip).toHaveTextContent('48');
    expect(strip).toHaveTextContent('likes');
    expect(strip).toHaveTextContent('6');
    expect(strip).toHaveTextContent('comments');
    expect(strip).toHaveTextContent('2');
    expect(strip).toHaveTextContent('shares');

    expect(
      screen.getByRole('img', {
        name: 'Engagement: 1200 views · 48 likes · 6 comments · 2 shares',
      })
    ).toBeInTheDocument();
  });

  it('returns null when engagement has no populated metrics', () => {
    const { container } = render(<VariantPerformanceStrip engagement={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
