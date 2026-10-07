import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoodPickAffirmBurst } from './GoodPickAffirmBurst';

const useReducedMotion = vi.fn(() => false);

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => useReducedMotion(),
  };
});

describe('GoodPickAffirmBurst', () => {
  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
  });

  it('renders children with check overlay when pulseKey is positive', () => {
    const { rerender } = render(
      <GoodPickAffirmBurst pulseKey={1}>
        <button type="button">Good pick</button>
      </GoodPickAffirmBurst>
    );

    expect(screen.getByRole('button', { name: 'Good pick' })).toBeInTheDocument();

    rerender(
      <GoodPickAffirmBurst pulseKey={2}>
        <button type="button">Good pick</button>
      </GoodPickAffirmBurst>
    );

    expect(screen.getByRole('button', { name: 'Good pick' })).toBeInTheDocument();
  });

  it('skips motion wrapper when pulseKey is zero', () => {
    const { container } = render(
      <GoodPickAffirmBurst pulseKey={0}>
        <span>Good pick</span>
      </GoodPickAffirmBurst>
    );

    expect(screen.getByText('Good pick')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('skips check overlay when reduced motion is preferred', () => {
    useReducedMotion.mockReturnValue(true);

    const { container } = render(
      <GoodPickAffirmBurst pulseKey={1}>
        <span>Good pick</span>
      </GoodPickAffirmBurst>
    );

    expect(screen.getByText('Good pick')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
