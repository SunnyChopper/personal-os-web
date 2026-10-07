import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildIdeaDetailBody } from './BuildIdeaDetailBody';
import {
  pbBodySecondaryClassName,
  pbEyebrowClassName,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type { BrandProjectIdea } from '@/types/api/personal-branding.dto';

type BodyProps = Pick<
  BrandProjectIdea,
  | 'appealSummary'
  | 'demoHook'
  | 'demoCritique'
  | 'tutorialAngle'
  | 'backgroundKnowledge'
  | 'technologies'
  | 'trendSources'
>;

const emptyBody: BodyProps = {
  appealSummary: null,
  demoHook: null,
  demoCritique: null,
  tutorialAngle: null,
  backgroundKnowledge: [],
  technologies: [],
  trendSources: [],
};

describe('BuildIdeaDetailBody', () => {
  it('returns null when every section is empty', () => {
    const { container } = render(<BuildIdeaDetailBody {...emptyBody} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders sections in brief order with PB eyebrow and body tokens', () => {
    render(
      <BuildIdeaDetailBody
        {...emptyBody}
        appealSummary="Hook"
        demoHook="Clip the CLI"
        demoCritique="Rewrote the hook so the payoff shows in the first ten seconds"
        tutorialAngle="Walk through setup"
        backgroundKnowledge={[{ topic: 'Rust', why: 'fast tooling' }]}
        technologies={[{ name: 'Rust', role: 'runtime', isTrending: true }]}
        trendSources={[{ title: 'Signal', url: 'https://news.ycombinator.com/item' }]}
      />
    );

    const labels = ['Why it works', 'Demo', 'Critic', 'Tutorial', 'Background', 'Stack', 'Sources'];
    const nodes = labels.map((label) => screen.getByText(label));
    for (let i = 1; i < nodes.length; i += 1) {
      expect(
        nodes[i - 1].compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }

    const eyebrow = screen.getByText('Background');
    expect(eyebrow.className).toContain(pbEyebrowClassName);
    const backgroundList = eyebrow.parentElement?.querySelector('ul');
    expect(backgroundList?.className).toContain(pbBodySecondaryClassName);
  });

  it('renders a critique-only idea and hides Critic when the field is blank', () => {
    const { container, rerender } = render(
      <BuildIdeaDetailBody
        {...emptyBody}
        demoCritique="Rewrote demoHook so the chart fills on screen"
      />
    );
    const eyebrow = screen.getByText('Critic');
    expect(eyebrow.className).toContain(pbEyebrowClassName);
    expect(screen.getByText('Rewrote demoHook so the chart fills on screen')).toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();

    rerender(<BuildIdeaDetailBody {...emptyBody} demoCritique="   " />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Critic')).not.toBeInTheDocument();

    rerender(<BuildIdeaDetailBody {...emptyBody} appealSummary="Hook" demoCritique={null} />);
    expect(screen.getByText('Why it works')).toBeInTheDocument();
    expect(screen.queryByText('Critic')).not.toBeInTheDocument();
  });

  it('labels demo hook Demo by default and Post when copy includes an X URL', () => {
    const { rerender } = render(
      <BuildIdeaDetailBody {...emptyBody} demoHook="Show the CLI in 30 seconds." />
    );
    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.queryByText('X demo')).not.toBeInTheDocument();

    rerender(
      <BuildIdeaDetailBody
        {...emptyBody}
        demoHook="Quote this thread: https://x.com/builder/status/1"
      />
    );
    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.queryByText('Demo')).not.toBeInTheDocument();
  });

  it('collapses background after three bullets with Show N more', async () => {
    const user = userEvent.setup();
    render(
      <BuildIdeaDetailBody
        {...emptyBody}
        backgroundKnowledge={[
          { topic: 'A', why: 'one' },
          { topic: 'B', why: 'two' },
          { topic: 'C', why: 'three' },
          { topic: 'D', why: 'four' },
        ]}
      />
    );

    expect(screen.getByText(/one/)).toBeInTheDocument();
    expect(screen.queryByText(/four/)).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Show 1 more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    expect(screen.getByText(/four/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('renders stack chips with role, trending, and +N overflow', () => {
    render(
      <BuildIdeaDetailBody
        {...emptyBody}
        technologies={[
          { name: 'Rust', role: 'core', isTrending: false },
          { name: 'Tokio', role: 'async', isTrending: false },
          { name: 'Clap', role: 'cli', isTrending: false },
          { name: 'Serde', role: 'serde', isTrending: false },
        ]}
      />
    );

    const techName = screen.getByText('Rust');
    const techPill = techName.closest('span[class*="rounded-full"]');
    expect(techPill?.textContent).toMatch(/Rust.*core/);
    expect(techPill?.className).toBe(statusPillClassName('neutral'));
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.queryByText(/Serde/)).not.toBeInTheDocument();
  });

  it('renders source rows with domain, truncated title, and outbound link', () => {
    render(
      <BuildIdeaDetailBody
        {...emptyBody}
        trendSources={[
          {
            title: 'Very long trend signal title that should still appear in the document',
            url: 'https://www.example.com/path',
          },
          { title: 'Offline note', url: null },
        ]}
      />
    );

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Open source: Very long trend signal title that should still appear in the document',
      })
    ).toHaveAttribute('href', 'https://www.example.com/path');
    expect(screen.getByText('Offline note')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Offline note/ })).not.toBeInTheDocument();
  });

  it('hides Sources when trendSources is empty', () => {
    render(<BuildIdeaDetailBody {...emptyBody} appealSummary="Only appeal" />);
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('does not render card action buttons', () => {
    render(<BuildIdeaDetailBody {...emptyBody} appealSummary="Hook" demoHook="Demo line" />);
    expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument();
  });
});
