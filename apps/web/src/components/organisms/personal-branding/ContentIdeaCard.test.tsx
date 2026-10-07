import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ContentIdea } from '@/types/api/personal-branding.dto';
import ContentIdeaCard from './ContentIdeaCard';

function makeIdea(overrides: Partial<ContentIdea> = {}): ContentIdea {
  return {
    id: 'idea-1',
    title: 'Test idea title',
    summary: 'A short summary for the idea card.',
    rationale: 'Strategic rationale for creating this content.',
    contentType: 'SOCIAL_THREAD',
    sourceType: 'ON_DEMAND_AI',
    tags: ['alpha', 'beta'],
    status: 'GENERATED',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const LONG_TITLE =
  'Video Script: From Prototype to Production Agent Efficiency in 8 Minutes with observability and action.';
const LONG_SUMMARY =
  'A concise hook for busy operators who want repeatable agent workflows without hype. ' +
  'This summary spans multiple lines to exercise the three-line clamp on idea cards.';
const LONG_RATIONALE =
  'Pillar fit reinforces your ops-first positioning with a clear audience job-to-be-done. ' +
  'Platform format fit favors a concise thread that differentiates from generic AI hype. ' +
  'Funnel role: top-of-funnel awareness without invented engagement metrics.';

describe('ContentIdeaCard', () => {
  it('renders GENERATED card with Generate Draft, Reject, and content-type info pill', () => {
    render(
      <ContentIdeaCard
        idea={makeIdea()}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: /Generate draft and open in Sandbox/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByText('Social Thread')).toHaveClass('bg-blue-100');
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.queryByText('Grounded in')).not.toBeInTheDocument();
  });

  it('renders grounded pillar chips when matchedPillars is non-empty', () => {
    render(
      <ContentIdeaCard
        idea={makeIdea({ matchedPillars: ['Leadership', 'Engineering'] })}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Grounded in')).toBeInTheDocument();
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('renders +N overflow for more than three grounded pillars', () => {
    render(
      <ContentIdeaCard
        idea={makeIdea({
          matchedPillars: ['Pillar A', 'Pillar B', 'Pillar C', 'Pillar D'],
        })}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.queryByText('Pillar D')).not.toBeInTheDocument();
  });

  it('renders metaExtras slot content', () => {
    render(
      <ContentIdeaCard
        idea={makeIdea()}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        metaExtras={<span>Vault chip</span>}
      />
    );

    expect(screen.getByText('Vault chip')).toBeInTheDocument();
  });

  it('renders sourceFallbackLabel when no target platform', () => {
    render(
      <ContentIdeaCard
        idea={makeIdea({ targetPlatform: null })}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        sourceFallbackLabel="Weekly Review Quick Win"
      />
    );

    expect(screen.getByText('Weekly Review Quick Win')).toBeInTheDocument();
  });

  it('renders DRAFTED chrome without Reject and with re-approve + open draft', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onOpenDraft = vi.fn();

    render(
      <ContentIdeaCard
        idea={makeIdea({ status: 'DRAFTED', draftNodeId: 'draft-1' })}
        isApproving={false}
        onApprove={onApprove}
        onReject={vi.fn()}
        onOpenDraft={onOpenDraft}
      />
    );

    expect(screen.getByText('Draft generated')).toHaveClass('bg-amber-100');
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate another draft' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open existing draft' }));
    expect(onOpenDraft).toHaveBeenCalledTimes(1);
  });

  it('shows Generating… while approving', () => {
    render(
      <ContentIdeaCard idea={makeIdea()} isApproving onApprove={vi.fn()} onReject={vi.fn()} />
    );

    expect(screen.getByText('Generating…')).toBeInTheDocument();
  });

  it('clamps long title and summary with ClampedExpandableText and no Show more', () => {
    render(
      <ContentIdeaCard
        idea={makeIdea({ title: LONG_TITLE, summary: LONG_SUMMARY, rationale: LONG_RATIONALE })}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    const titleNode = screen.getByRole('button', { name: LONG_TITLE });
    const summaryNode = screen.getByRole('button', { name: LONG_SUMMARY });
    const rationaleNode = screen.getByRole('button', { name: LONG_RATIONALE });

    expect(titleNode).toHaveClass('line-clamp-2');
    expect(summaryNode).toHaveClass('line-clamp-3');
    expect(rationaleNode).toHaveClass('line-clamp-3');
    expect(screen.getByText('Why create this')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('pins expanded title on click', async () => {
    const user = userEvent.setup();
    render(
      <ContentIdeaCard
        idea={makeIdea({ title: LONG_TITLE })}
        isApproving={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    const titleNode = screen.getByRole('button', { name: LONG_TITLE });
    await user.click(titleNode);

    expect(titleNode).not.toHaveClass('line-clamp-2');
    expect(titleNode).toHaveAttribute('aria-expanded', 'true');
  });
});
