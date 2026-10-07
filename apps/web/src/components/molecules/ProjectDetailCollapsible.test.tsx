import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitBranch } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectDetailCollapsible } from './ProjectDetailCollapsible';

describe('ProjectDetailCollapsible', () => {
  it('defaults to collapsed with aria-expanded="false"', () => {
    render(
      <ProjectDetailCollapsible title="Notes">
        <p>Project note content</p>
      </ProjectDetailCollapsible>
    );

    const button = screen.getByRole('button', { name: /notes/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles open and closed when clicked in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(
      <ProjectDetailCollapsible title="Notes" defaultOpen={false}>
        <p>Project note content</p>
      </ProjectDetailCollapsible>
    );

    const button = screen.getByRole('button', { name: /notes/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports controlled open and onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ProjectDetailCollapsible
        title="Dependencies"
        count={2}
        isOpen={false}
        onOpenChange={onOpenChange}
      >
        <div>Dependency content</div>
      </ProjectDetailCollapsible>
    );

    const button = screen.getByRole('button', { name: /dependencies \(2\)/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <ProjectDetailCollapsible
        title="Dependencies"
        count={2}
        isOpen={true}
        onOpenChange={onOpenChange}
      >
        <div>Dependency content</div>
      </ProjectDetailCollapsible>
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders title with count and suffix', () => {
    render(
      <ProjectDetailCollapsible
        title="Memory thread"
        count={5}
        suffix="Last 30 days"
        icon={GitBranch}
      >
        <div>Memory items</div>
      </ProjectDetailCollapsible>
    );

    expect(screen.getByText('Memory thread (5)')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('applies amber tone when specified', () => {
    render(
      <ProjectDetailCollapsible title="AI Project Tools" tone="amber">
        <div>Tools</div>
      </ProjectDetailCollapsible>
    );

    const button = screen.getByRole('button', { name: /ai project tools/i });
    expect(button.className).toContain('text-amber-600');
  });
});
