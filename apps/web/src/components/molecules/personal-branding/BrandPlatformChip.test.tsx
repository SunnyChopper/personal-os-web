import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandPlatformChip } from '@/components/molecules/personal-branding/BrandPlatformChip';

describe('BrandPlatformChip', () => {
  it('renders the platform label and brand icon', () => {
    const { container } = render(<BrandPlatformChip platform="linkedin" />);

    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses an accessible title on the icon when provided', () => {
    render(<BrandPlatformChip platform="x" title="X (Twitter)" />);

    expect(screen.getByRole('img', { name: 'X (Twitter)' })).toBeInTheDocument();
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
  });
});
