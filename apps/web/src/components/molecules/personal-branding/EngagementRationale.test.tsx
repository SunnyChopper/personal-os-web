import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EngagementRationale from './EngagementRationale';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe('EngagementRationale', () => {
  it('renders lead only when no bullets', () => {
    render(<EngagementRationale lead="Strong alignment with your pillar." bullets={[]} />);
    expect(screen.getByText('Strong alignment with your pillar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Why this matters/i })).not.toBeInTheDocument();
  });

  it('returns null when lead and bullets are empty', () => {
    const { container } = render(<EngagementRationale lead={null} bullets={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('hides bullets by default behind Why this matters', () => {
    render(
      <EngagementRationale
        lead="Lead sentence."
        bullets={['First supporting point.', 'Second supporting point.']}
      />
    );

    expect(screen.getByText('Lead sentence.')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /Why this matters/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('First supporting point.')).not.toBeInTheDocument();
    expect(screen.queryByText('Second supporting point.')).not.toBeInTheDocument();
  });

  it('reveals all bullets when expander is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EngagementRationale
        lead="Lead sentence."
        bullets={['First supporting point.', 'Second supporting point.']}
      />
    );

    const toggle = screen.getByRole('button', { name: /Why this matters/i });
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('First supporting point.')).toBeInTheDocument();
    expect(screen.getByText('Second supporting point.')).toBeInTheDocument();
  });

  it('renders bullets inline when collapsibleBullets is false', () => {
    render(<EngagementRationale bullets={['Always visible bullet.']} collapsibleBullets={false} />);

    expect(screen.getByText('Always visible bullet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Why this matters/i })).not.toBeInTheDocument();
  });

  it('wraps long expanded bullets with break-words', async () => {
    const user = userEvent.setup();
    const longBullet =
      'Directalignmentwithyouredge-casereadinesspillarandrecurringmotifsonover-relianceoninsulation(latency/costtrade-offsindistributedagenticsystems)';
    render(<EngagementRationale bullets={[longBullet]} />);

    await user.click(screen.getByRole('button', { name: /Why this matters/i }));

    expect(screen.getByText(longBullet)).toHaveClass('break-words');
  });
});
