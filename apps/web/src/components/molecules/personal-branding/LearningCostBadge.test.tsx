import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LearningCostBadge from './LearningCostBadge';

describe('LearningCostBadge', () => {
  it('renders nothing when learningCost is absent', () => {
    const { container } = render(<LearningCostBadge learningCost={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders Easy for low tier', () => {
    render(<LearningCostBadge learningCost="low" />);
    const badge = screen.getByText('Easy');
    expect(badge.closest('[data-learning-cost]')).toHaveAttribute('data-learning-cost', 'low');
  });

  it('renders Stretch for medium tier', () => {
    render(<LearningCostBadge learningCost="medium" />);
    expect(screen.getByText('Stretch')).toBeInTheDocument();
  });

  it('renders Hard for high tier', () => {
    render(<LearningCostBadge learningCost="high" />);
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('renders Expert for max tier', () => {
    render(<LearningCostBadge learningCost="max" />);
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('hides invalid tier values', () => {
    const { container } = render(<LearningCostBadge learningCost="bogus" />);
    expect(container).toBeEmptyDOMElement();
  });
});
