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

describe('RadarDiscoveryCandidateCard', () => {
  it('allows a relevant unsaved candidate to be saved', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <RadarDiscoveryCandidateCard
        candidate={candidate}
        onSave={onSave}
        onAddAsItem={vi.fn()}
        onMarkNotASource={vi.fn()}
        onParseSources={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save source' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.getByText('91% confidence')).toBeInTheDocument();
    expect(screen.getByText(/Verified RSS endpoint/)).toBeInTheDocument();
  });

  it('disables saving for a not-relevant candidate and offers Trend Stream action', async () => {
    const user = userEvent.setup();
    const onAddAsItem = vi.fn();
    render(
      <RadarDiscoveryCandidateCard
        candidate={{
          ...candidate,
          verdict: 'not_relevant',
          endpoint: null,
          resolvedEndpoint: null,
          sourceType: null,
          probeStatus: 'no_feed',
          contentKind: 'article',
        }}
        onSave={vi.fn()}
        onAddAsItem={onAddAsItem}
        onMarkNotASource={vi.fn()}
        onParseSources={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Save source' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add as Trend Stream card' }));
    expect(onAddAsItem).toHaveBeenCalledOnce();
  });

  it('opens confirm modal from kebab menu and calls onMarkNotASource', async () => {
    const user = userEvent.setup();
    const onMarkNotASource = vi.fn();
    render(
      <RadarDiscoveryCandidateCard
        candidate={candidate}
        onSave={vi.fn()}
        onAddAsItem={vi.fn()}
        onMarkNotASource={onMarkNotASource}
        onParseSources={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Candidate options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Not a source' }));
    expect(screen.getByRole('heading', { name: 'Mark as not a source?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark not a source' }));
    expect(onMarkNotASource).toHaveBeenCalledOnce();
  });

  it('shows marked state and disables actions when userNotASource is true', () => {
    render(
      <RadarDiscoveryCandidateCard
        candidate={{
          ...candidate,
          userNotASource: true,
          userNotASourceMarkedAt: '2026-07-15T00:00:00Z',
        }}
        onSave={vi.fn()}
        onAddAsItem={vi.fn()}
        onMarkNotASource={vi.fn()}
        onParseSources={vi.fn()}
      />
    );

    expect(screen.getByText('Not a source')).toBeInTheDocument();
    expect(screen.getByText('Marked not a source')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save source' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Candidate options' })).toBeDisabled();
  });

  it('calls onParseSources from kebab menu', async () => {
    const user = userEvent.setup();
    const onParseSources = vi.fn();
    render(
      <RadarDiscoveryCandidateCard
        candidate={candidate}
        onSave={vi.fn()}
        onAddAsItem={vi.fn()}
        onMarkNotASource={vi.fn()}
        onParseSources={onParseSources}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Candidate options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Read and parse sources' }));
    expect(onParseSources).toHaveBeenCalledOnce();
  });
});
