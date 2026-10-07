import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectsPortfolioCompletedSection } from './ProjectsPortfolioCompletedSection';

describe('ProjectsPortfolioCompletedSection', () => {
  it('defaults to collapsed with Completed count in header', () => {
    render(
      <ProjectsPortfolioCompletedSection count={1}>
        <p>Completed project card</p>
      </ProjectsPortfolioCompletedSection>
    );

    const button = screen.getByRole('button', { name: /completed \(1\)/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const panel = screen.getByRole('region', { hidden: true });
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('toggles open and closed in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(
      <ProjectsPortfolioCompletedSection count={2}>
        <p>Completed project card</p>
      </ProjectsPortfolioCompletedSection>
    );

    const button = screen.getByRole('button', { name: /completed \(2\)/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Completed project card')).toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports controlled open and onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ProjectsPortfolioCompletedSection count={3} isOpen={false} onOpenChange={onOpenChange}>
        <p>Completed project card</p>
      </ProjectsPortfolioCompletedSection>
    );

    const button = screen.getByRole('button', { name: /completed \(3\)/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <ProjectsPortfolioCompletedSection count={3} isOpen={true} onOpenChange={onOpenChange}>
        <p>Completed project card</p>
      </ProjectsPortfolioCompletedSection>
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Completed project card')).toBeInTheDocument();
  });
});
