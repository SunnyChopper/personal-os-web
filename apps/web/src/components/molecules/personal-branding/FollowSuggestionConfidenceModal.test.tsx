import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FollowSuggestionConfidenceModal from '@/components/molecules/personal-branding/FollowSuggestionConfidenceModal';
import type { FollowSuggestion } from '@/types/api/personal-branding.dto';

function buildSuggestion(overrides: Partial<FollowSuggestion> = {}): FollowSuggestion {
  return {
    id: 'suggestion-1',
    xUsername: 'claudeai',
    displayName: 'Claude',
    bio: null,
    followersCount: 1000,
    profileUrl: null,
    rationale: 'Official Claude AI developer account.',
    confidence: 0.96,
    confidenceExplanation: {
      summary: 'Strong audience overlap.',
      factors: [
        {
          key: 'audienceFit',
          label: 'Audience Fit',
          score: 0.96,
          weight: 0.25,
          note: 'Strong match for agentic AI niche.',
        },
      ],
      method: 'llm',
      generatedAt: '2026-07-16T00:00:00.000Z',
    },
    confidenceFeedback: null,
    sharedConnectionIds: ['conn-1'],
    entityType: 'company',
    status: 'NEW',
    runId: 'run-1',
    dismissalFeedbackText: null,
    userId: 'user-1',
    createdAt: '2026-07-16T00:00:00.000Z',
    updatedAt: '2026-07-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('FollowSuggestionConfidenceModal calibration UX', () => {
  it('disables feedback inputs and shows Saving… on the clicked verdict while submitting', async () => {
    const user = userEvent.setup();
    const onSubmitFeedback = vi.fn();

    const { rerender } = render(
      <FollowSuggestionConfidenceModal
        isOpen
        suggestion={buildSuggestion()}
        isExplaining={false}
        isSubmittingFeedback={false}
        onClose={() => {}}
        onExplain={() => {}}
        onSubmitFeedback={onSubmitFeedback}
      />
    );

    const textarea = screen.getByPlaceholderText(/too generic/i);
    const percentInput = screen.getByPlaceholderText('40');

    await user.type(textarea, 'Strong overlap');
    await user.clear(percentInput);
    await user.type(percentInput, '85');
    await user.click(screen.getByRole('button', { name: 'Confirm score' }));

    expect(onSubmitFeedback).toHaveBeenCalledWith({
      verdict: 'CONFIRMED',
      feedbackText: 'Strong overlap',
      suggestedConfidence: 0.85,
    });

    rerender(
      <FollowSuggestionConfidenceModal
        isOpen
        suggestion={buildSuggestion()}
        isExplaining={false}
        isSubmittingFeedback
        onClose={() => {}}
        onExplain={() => {}}
        onSubmitFeedback={onSubmitFeedback}
      />
    );

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(textarea).toBeDisabled();
    expect(percentInput).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject confidence' })).toBeDisabled();
  });

  it('prefills saved feedback and shows human-readable calibration banner', () => {
    render(
      <FollowSuggestionConfidenceModal
        isOpen
        suggestion={buildSuggestion({
          confidenceFeedback: {
            verdict: 'CONFIRMED',
            feedbackText: 'Strong agentic-AI overlap',
            suggestedConfidence: 0.88,
            createdAt: '2026-07-16T12:00:00.000Z',
          },
        })}
        isExplaining={false}
        isSubmittingFeedback={false}
        onClose={() => {}}
        onExplain={() => {}}
        onSubmitFeedback={() => {}}
      />
    );

    expect(screen.getByText('Your calibration: Confirmed')).toBeInTheDocument();
    expect(screen.getByText('You can change this below.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Strong agentic-AI overlap')).toBeInTheDocument();
    expect(screen.getByDisplayValue('88')).toBeInTheDocument();
    expect(
      screen.getByText(/update your verdict or feedback to override the saved calibration/i)
    ).toBeInTheDocument();
  });

  it('allows overriding a saved rejection with confirm', async () => {
    const user = userEvent.setup();
    const onSubmitFeedback = vi.fn();

    render(
      <FollowSuggestionConfidenceModal
        isOpen
        suggestion={buildSuggestion({
          confidenceFeedback: {
            verdict: 'REJECTED',
            feedbackText: 'Too generic',
            suggestedConfidence: 0.4,
            createdAt: '2026-07-16T12:00:00.000Z',
          },
        })}
        isExplaining={false}
        isSubmittingFeedback={false}
        onClose={() => {}}
        onExplain={() => {}}
        onSubmitFeedback={onSubmitFeedback}
      />
    );

    expect(screen.getByText('Your calibration: Rejected')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Too generic')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm score' }));

    expect(onSubmitFeedback).toHaveBeenCalledWith({
      verdict: 'CONFIRMED',
      feedbackText: 'Too generic',
      suggestedConfidence: 0.4,
    });
  });
});
