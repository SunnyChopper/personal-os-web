import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReplyGeneratingState from './ReplyGeneratingState';

describe('ReplyGeneratingState', () => {
  it('renders N skeleton cards from submitted draft count', () => {
    render(
      <ReplyGeneratingState
        submittedDraft={{
          suggestionCount: 4,
          mode: 'SIMPLE',
          researchEnabled: false,
          vaultGroundingEnabled: false,
          submittedAtMs: Date.now(),
        }}
        isPending
      />
    );

    expect(screen.getAllByTestId('reply-suggestion-card-skeleton')).toHaveLength(4);
    expect(screen.queryByLabelText('Reply agent progress')).not.toBeInTheDocument();
  });

  it('shows agent progress strip for agent mode while pending', () => {
    render(
      <ReplyGeneratingState
        submittedDraft={{
          suggestionCount: 2,
          mode: 'AGENT',
          researchEnabled: true,
          vaultGroundingEnabled: false,
          submittedAtMs: Date.now() - 5_000,
        }}
        isPending
        nowMs={Date.now()}
      />
    );

    expect(screen.getAllByTestId('reply-suggestion-card-skeleton')).toHaveLength(2);
    expect(screen.getByLabelText('Reply agent progress')).toBeInTheDocument();
    expect(screen.getByText('Queued for generation…')).toBeInTheDocument();
  });

  it('shows planning label once run is running', () => {
    render(
      <ReplyGeneratingState
        run={{
          id: 'run-1',
          connectionId: 'conn-1',
          platform: 'x',
          creatorText: 'hello',
          mode: 'AGENT',
          researchEnabled: true,
          vaultGroundingEnabled: false,
          suggestionCount: 2,
          status: 'RUNNING',
          userId: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          suggestions: [],
        }}
        nowMs={Date.now()}
      />
    );

    expect(screen.getByText('Planning engagement…')).toBeInTheDocument();
  });

  it('prefers active run suggestion count when present', () => {
    render(
      <ReplyGeneratingState
        run={{
          id: 'run-1',
          connectionId: 'conn-1',
          platform: 'x',
          creatorText: 'hello',
          mode: 'SIMPLE',
          researchEnabled: false,
          vaultGroundingEnabled: false,
          suggestionCount: 5,
          status: 'RUNNING',
          userId: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          suggestions: [],
        }}
        submittedDraft={{
          suggestionCount: 2,
          mode: 'SIMPLE',
          researchEnabled: false,
          vaultGroundingEnabled: false,
          submittedAtMs: Date.now(),
        }}
      />
    );

    expect(screen.getAllByTestId('reply-suggestion-card-skeleton')).toHaveLength(5);
  });
});
