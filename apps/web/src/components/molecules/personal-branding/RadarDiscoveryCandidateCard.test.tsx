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
  status: 'completed',
  verdict: 'relevant',
  rationale: 'Strong match for the selected pillar.',
  confidence: 0.91,
  matchedTopics: ['AI Systems'],
  duplicateStatus: 'new',
};

describe('RadarDiscoveryCandidateCard', () => {
  it('allows a relevant unsaved candidate to be saved', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RadarDiscoveryCandidateCard candidate={candidate} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Save source' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.getByText('91% confidence')).toBeInTheDocument();
    expect(screen.getByText(/Strong match/)).toBeInTheDocument();
  });

  it('disables saving for a not-relevant candidate', () => {
    render(
      <RadarDiscoveryCandidateCard
        candidate={{ ...candidate, verdict: 'not_relevant' }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Save source' })).toBeDisabled();
  });
});
