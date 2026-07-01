import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandPlatformIcon } from '@/components/atoms/BrandPlatformIcon';

describe('BrandPlatformIcon', () => {
  it('renders an svg brand mark for linked platforms', () => {
    const { container } = render(<BrandPlatformIcon platform="linkedin" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the newsletter mail icon', () => {
    const { container } = render(<BrandPlatformIcon platform="newsletter" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses an accessible title when provided', () => {
    render(<BrandPlatformIcon platform="youtube" title="YouTube" />);
    expect(screen.getByRole('img', { name: 'YouTube' })).toBeInTheDocument();
  });
});
