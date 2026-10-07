import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProjectIdeaCard from './ProjectIdeaCard';
import {
  pbCardTitleClassName,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type { BrandProjectBuildKit, BrandProjectIdea } from '@/types/api/personal-branding.dto';

const sampleKit: BrandProjectBuildKit = {
  setupPrompt: 'setup',
  cursorSkills: [],
  modules: [],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

const baseIdea: BrandProjectIdea = {
  id: 'idea-1',
  title: 'Ship a CLI',
  status: 'generated',
  backgroundKnowledge: [{ topic: 'Rust', why: 'fast tooling' }],
  technologies: [{ name: 'Rust', role: 'runtime', isTrending: true }],
  trendSources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const noopHandlers = {
  onReject: vi.fn(),
  onComplete: vi.fn(),
};

function renderCard(idea: BrandProjectIdea = baseIdea) {
  return render(
    <MemoryRouter>
      <ProjectIdeaCard idea={idea} {...noopHandlers} />
    </MemoryRouter>
  );
}

describe('ProjectIdeaCard', () => {
  it('uses PB title tokens and links to the idea detail path', () => {
    renderCard();

    const title = screen.getByRole('heading', { level: 3, name: 'Ship a CLI' });
    expect(title.className).toContain(pbCardTitleClassName);
    expect(title.className).toContain('line-clamp-2');

    const detailLink = screen.getByRole('link', { name: 'Ship a CLI' });
    expect(detailLink).toHaveAttribute('href', '/admin/personal-branding/projects/idea-1');
  });

  it('maps status to tone and title-case label', () => {
    const { rerender } = renderCard();
    expect(screen.getByText('Generated')).toHaveClass('bg-blue-100');

    rerender(
      <MemoryRouter>
        <ProjectIdeaCard idea={{ ...baseIdea, status: 'rejected' }} {...noopHandlers} />
      </MemoryRouter>
    );
    expect(screen.getByText('Rejected')).toHaveClass('bg-red-100');

    rerender(
      <MemoryRouter>
        <ProjectIdeaCard idea={{ ...baseIdea, status: 'completed' }} {...noopHandlers} />
      </MemoryRouter>
    );
    expect(screen.getByText('Completed')).toHaveClass('bg-green-100');
  });

  it('clamps one-liner to two lines without an expandable control', () => {
    renderCard({ ...baseIdea, oneLiner: 'A compact pitch for the idea.' });

    const summary = screen.getByText('A compact pitch for the idea.');
    expect(summary.className).toContain('line-clamp-2');
    expect(summary.tagName).toBe('P');
    expect(screen.queryByRole('button', { name: /compact pitch/i })).not.toBeInTheDocument();
  });

  it('omits essay sections from the scan card', () => {
    renderCard({
      ...baseIdea,
      appealSummary: 'Strong scroll-stopper for builders.',
      demoHook: 'Show the CLI in 30 seconds.',
      tutorialAngle: 'Step by step',
      trendSources: [{ title: 'Linked signal', url: 'https://example.com/signal' }],
    });

    expect(screen.queryByText('Why it works')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo')).not.toBeInTheDocument();
    expect(screen.queryByText('Tutorial')).not.toBeInTheDocument();
    expect(screen.queryByText('Background')).not.toBeInTheDocument();
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
    expect(screen.queryByText('Strong scroll-stopper for builders.')).not.toBeInTheDocument();
  });

  it('shows meta row only when difficulty, hours, or generated date are present', () => {
    const { rerender } = renderCard();
    expect(screen.queryByText(/intermediate/i)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectIdeaCard
          idea={{
            ...baseIdea,
            difficulty: 'intermediate',
            estimatedHours: 8,
            generatedForDate: '2026-03-15',
          }}
          {...noopHandlers}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/intermediate · 8h · Mar 15, 2026/)).toBeInTheDocument();
  });

  it('caps technology chips at two names with a non-button +N overflow', () => {
    renderCard({
      ...baseIdea,
      technologies: [
        { name: 'Rust', role: 'core', isTrending: false },
        { name: 'Tokio', role: 'async', isTrending: false },
        { name: 'Clap', role: 'cli', isTrending: false },
        { name: 'Serde', role: 'serde', isTrending: false },
      ],
    });

    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('Tokio')).toBeInTheDocument();
    expect(screen.queryByText('Clap')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByText(/runtime/)).not.toBeInTheDocument();
    expect(screen.getByText('Rust').className).toBe(statusPillClassName('neutral'));
    expect(screen.queryByRole('button', { name: /\+2/ })).not.toBeInTheDocument();
  });

  it('shows Kit ready when buildKit exists', () => {
    renderCard({ ...baseIdea, buildKit: sampleKit });
    expect(screen.getByText('Kit ready')).toHaveClass('bg-green-100');
  });

  it('shows Reject and Mark complete on generated ideas without build kit actions', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    const onComplete = vi.fn();
    render(
      <MemoryRouter>
        <ProjectIdeaCard
          idea={{ ...baseIdea, buildKit: sampleKit }}
          {...noopHandlers}
          onReject={onReject}
          onComplete={onComplete}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view build kit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate build kit/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^reject$/i }));
    await user.click(screen.getByRole('button', { name: /mark complete/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows named post links on completed ideas without raw platform ids', () => {
    const idea: BrandProjectIdea = {
      ...baseIdea,
      status: 'completed',
      completion: {
        completedAt: '2026-02-01T00:00:00.000Z',
        postLinks: [
          { platform: 'x', url: 'https://x.com/post/1' },
          { platform: 'youtube', url: 'https://youtube.com/watch?v=1' },
          { platform: 'linkedin', url: 'https://linkedin.com/posts/1' },
        ],
      },
    };
    renderCard(idea);

    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', 'https://x.com/post/1');
    expect(screen.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
      'href',
      'https://youtube.com/watch?v=1'
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/posts/1'
    );
    expect(screen.queryByText('youtube')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view build kit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate build kit/i })).not.toBeInTheDocument();
  });

  it('links View build kit to the detail build-kit anchor on completed ideas', () => {
    renderCard({
      ...baseIdea,
      status: 'completed',
      buildKit: sampleKit,
      completion: {
        completedAt: '2026-01-01T00:00:00.000Z',
        postLinks: [{ platform: 'x', url: 'https://x.com/post/1' }],
      },
    });

    expect(screen.getByRole('link', { name: /view build kit/i })).toHaveAttribute(
      'href',
      '/admin/personal-branding/projects/idea-1#build-kit'
    );
  });

  it('shows rejection category and feedback on rejected ideas', () => {
    renderCard({
      ...baseIdea,
      status: 'rejected',
      rejection: {
        feedbackText: 'Not shareable enough',
        feedbackCategory: 'too_complex',
        rejectedAt: '2026-02-01T00:00:00.000Z',
      },
    });

    expect(screen.getByText('Too complex')).toBeInTheDocument();
    expect(screen.getByText('Not shareable enough')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate build kit/i })).not.toBeInTheDocument();
  });

  it('links View build kit on rejected ideas when buildKit exists', () => {
    renderCard({
      ...baseIdea,
      status: 'rejected',
      buildKit: sampleKit,
      rejection: {
        feedbackText: 'Off niche',
        feedbackCategory: 'off_niche',
        rejectedAt: '2026-02-01T00:00:00.000Z',
      },
    });

    expect(screen.getByRole('link', { name: /view build kit/i })).toHaveAttribute(
      'href',
      '/admin/personal-branding/projects/idea-1#build-kit'
    );
  });
});
