import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PointBadge } from '@/components/atoms/PointBadge';

describe('PointBadge', () => {
  it('renders nothing for zero or invalid values', () => {
    const { container } = render(<PointBadge value={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows value with PTS label and accessible name', () => {
    render(<PointBadge value={12} showPlus />);
    expect(screen.getByText('+12')).toBeInTheDocument();
    expect(screen.getByText('PTS')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      '12 reward points, awarded when marked done'
    );
  });

  it('reflects earned status in aria-label', () => {
    render(<PointBadge value={5} status="earned" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      '5 reward points, credited to wallet'
    );
  });
});
