import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RadarDiscoveryCandidateCard from './RadarDiscoveryCandidateCard';
import type { RadarDiscoveryCandidate } from '@/types/api/personal-branding.dto';

const candidate: RadarDiscoveryCandidate = {
  id: 'candidate-1',
  runId: 'run-1',
  title: 'Agent Reliability Feed',
  url: 'https://example.com/article',
  snippet: 'A reliable source about durable agent systems.',
  sourceType: 'RSS',
  endpoint: 'https://example.com/feed.xml',
  resolvedEndpoint: 'https://example.com/feed.xml',
  status: 'completed',
  verdict: 'relevant',
  rationale: 'Verified RSS endpoint.',
  confidence: 0.91,
  matchedTopics: ['AI Systems'],
  duplicateStatus: 'new',
  probeStatus: 'verified_feed',
  contentKind: 'feed',
};

function renderCard(props: Partial<ComponentProps<typeof RadarDiscoveryCandidateCard>> = {}) {
  const handlers = {
    onSave: vi.fn(),
    onAddAsItem: vi.fn(),
    onMarkNotASource: vi.fn(),
    onDismiss: vi.fn(),
    onParseSources: vi.fn(),
  };

  render(<RadarDiscoveryCandidateCard candidate={candidate} {...handlers} {...props} />);

  return handlers;
}

describe('RadarDiscoveryCandidateCard', () => {
  it('allows a relevant unsaved candidate to be saved', async () => {
    const user = userEvent.setup();
    const { onSave } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Save source' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.getByText('91% confidence')).toBeInTheDocument();
    expect(screen.queryByText(/Verified RSS endpoint/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show reasoning' })).toBeInTheDocument();
  });

  it('reveals rationale behind Show reasoning disclosure', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Show reasoning' }));
    expect(screen.getByText(/Verified RSS endpoint/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide reasoning' })).toBeInTheDocument();
  });

  it('hides Save for not-relevant candidates and offers Trend Stream action', async () => {
    const user = userEvent.setup();
    const { onAddAsItem } = renderCard({
      candidate: {
        ...candidate,
        verdict: 'not_relevant',
        endpoint: null,
        resolvedEndpoint: null,
        sourceType: null,
        probeStatus: 'no_feed',
        contentKind: 'article',
      },
    });

    expect(screen.queryByRole('button', { name: 'Save source' })).not.toBeInTheDocument();
    expect(screen.getByText('Not Relevant')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add as Trend Stream card' }));
    expect(onAddAsItem).toHaveBeenCalledOnce();
  });

  it('formats duplicate status badges without underscores', () => {
    renderCard({
      candidate: {
        ...candidate,
        duplicateStatus: 'not_applicable',
      },
    });

    expect(screen.getByText('Not Applicable')).toBeInTheDocument();
  });

  it('opens confirm modal from kebab menu and calls onMarkNotASource', async () => {
    const user = userEvent.setup();
    const { onMarkNotASource } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Candidate options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Not a source' }));
    expect(screen.getByRole('heading', { name: 'Mark as not a source?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark not a source' }));
    expect(onMarkNotASource).toHaveBeenCalledOnce();
  });

  it('opens discard confirm modal and calls onDismiss', async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Candidate options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Discard candidate' }));
    expect(screen.getByRole('heading', { name: 'Discard candidate?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Discard candidate' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows marked state and disables actions when userNotASource is true', () => {
    renderCard({
      candidate: {
        ...candidate,
        userNotASource: true,
        userNotASourceMarkedAt: '2026-07-15T00:00:00Z',
      },
    });

    expect(screen.getByText('Not a source')).toBeInTheDocument();
    expect(screen.getByText('Marked not a source')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save source' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Candidate options' })).toBeDisabled();
  });

  it('calls onParseSources from kebab menu', async () => {
    const user = userEvent.setup();
    const { onParseSources } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Candidate options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Read and parse sources' }));
    expect(onParseSources).toHaveBeenCalledOnce();
  });
});
