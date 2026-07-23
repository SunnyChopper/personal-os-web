import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RadarSourceHealthIndicator from '@/components/molecules/personal-branding/RadarSourceHealthIndicator';

describe('RadarSourceHealthIndicator', () => {
  it('renders healthy label with reason in accessible name', () => {
    render(<RadarSourceHealthIndicator health="healthy" healthReason="Last success 2h ago" />);

    expect(screen.getByLabelText('Healthy: Last success 2h ago')).toBeInTheDocument();
  });

  it('falls back to degraded when health is missing', () => {
    render(<RadarSourceHealthIndicator healthReason="Never scraped successfully" />);

    expect(
      screen.getByLabelText('Needs attention: Never scraped successfully')
    ).toBeInTheDocument();
  });

  it('uses health label only when reason is empty', () => {
    render(<RadarSourceHealthIndicator health="paused" />);

    expect(screen.getByLabelText('Paused')).toBeInTheDocument();
  });

  it('renders as a button when onClick is provided', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <RadarSourceHealthIndicator
        health="healthy"
        healthReason="Last success 2h ago"
        onClick={onClick}
      />
    );

    const button = screen.getByRole('button', { name: /view health details/i });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
