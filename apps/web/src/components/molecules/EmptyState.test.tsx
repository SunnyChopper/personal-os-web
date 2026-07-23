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

  it('falls back to icon when no scene is provided', () => {
    render(
      <EmptyState icon={FileText} title="No content" description="Add content to continue." />
    );

    expect(screen.getByRole('heading', { name: 'No content' })).toBeInTheDocument();
    expect(screen.getByText('Add content to continue.')).toBeInTheDocument();
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
