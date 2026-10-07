import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '@/components/molecules/EmptyState';

describe('EmptyState', () => {
  it('renders scene illustration when scene prop is set', () => {
    const { container } = render(
      <EmptyState scene="noVariants" title="No variants yet" description="Generate some." />
    );

    expect(screen.getByRole('heading', { name: 'No variants yet' })).toBeInTheDocument();
    expect(screen.getByText('Generate some.')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders recovery check-in scene', () => {
    const { container } = render(
      <EmptyState scene="recoveryCheckIn" title="Log today's recovery in <30 s" />
    );

    expect(
      screen.getByRole('heading', { name: "Log today's recovery in <30 s" })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders aura correlation scene', () => {
    const { container } = render(
      <EmptyState scene="auraCorrelation" title="0 of 7 days with both signals" />
    );

    expect(
      screen.getByRole('heading', { name: '0 of 7 days with both signals' })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('falls back to icon when no scene is provided', () => {
    render(
      <EmptyState icon={FileText} title="No content" description="Add content to continue." />
    );

    expect(screen.getByRole('heading', { name: 'No content' })).toBeInTheDocument();
    expect(screen.getByText('Add content to continue.')).toBeInTheDocument();
  });

  it('renders rewards quick claim scene', () => {
    const { container } = render(
      <EmptyState scene="rewardsQuickClaim" title="No manual claims ready" />
    );

    expect(screen.getByRole('heading', { name: 'No manual claims ready' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders rewards rules scene', () => {
    const { container } = render(
      <EmptyState scene="rewardsRules" title="Create a rule to start earning" />
    );

    expect(
      screen.getByRole('heading', { name: 'Create a rule to start earning' })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders rewards claims scene', () => {
    const { container } = render(
      <EmptyState scene="rewardsClaims" title="No claims in the last 14 days" />
    );

    expect(
      screen.getByRole('heading', { name: 'No claims in the last 14 days' })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders recon scarcity scene', () => {
    const { container } = render(
      <EmptyState scene="reconScarcity" title="Few high-signal posts lately" />
    );

    expect(
      screen.getByRole('heading', { name: 'Few high-signal posts lately' })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders recon awaiting ingest scene', () => {
    const { container } = render(
      <EmptyState scene="reconAwaitingIngest" title="Ready for your first ingest" />
    );

    expect(
      screen.getByRole('heading', { name: 'Ready for your first ingest' })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses compact density padding when density is compact', () => {
    const { container } = render(
      <EmptyState scene="rewardsQuickClaim" title="No manual claims ready" density="compact" />
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass('py-8');
    expect(root).not.toHaveClass('py-14');
  });

  it('uses default density padding when density is omitted', () => {
    const { container } = render(
      <EmptyState scene="rewardsQuickClaim" title="No manual claims ready" />
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass('py-14');
  });

  it('fires action callbacks', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onSecondaryAction = vi.fn();

    render(
      <EmptyState
        scene="actionRequired"
        title="Action required"
        actionLabel="Primary"
        onAction={onAction}
        secondaryActionLabel="Secondary"
        onSecondaryAction={onSecondaryAction}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Primary' }));
    await user.click(screen.getByRole('button', { name: 'Secondary' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
  });
});
