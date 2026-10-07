import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, within } from '@testing-library/react';
import ReplySuggestionsList from './ReplySuggestionsList';
import type { ReplySuggestion } from '@/types/api/personal-branding.dto';

const useReducedMotion = vi.fn(() => false);

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => useReducedMotion(),
  };
});

const baseSuggestion: ReplySuggestion = {
  id: 'sug-1',
  runId: 'run-1',
  connectionId: 'conn-1',
  label: 'Warm opener',
  angle: 'knowledge',
  draftText: 'Great point about shipping fast.',
  rationale: 'Matches your tone.',
  status: 'SUGGESTED',
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
};

describe('ReplySuggestionsList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders primary Accept and ghost Reject for suggested items', () => {
    render(
      <ReplySuggestionsList suggestions={[baseSuggestion]} onAccept={vi.fn()} onReject={vi.fn()} />
    );

    expect(screen.getByText('Knowledge')).toBeInTheDocument();

    const accept = screen.getByRole('button', { name: /accept & copy/i });
    const reject = screen.getByRole('button', { name: /^reject$/i });

    expect(accept.className).toContain('bg-primary');
    expect(reject.className).toContain('hover:bg-gray-100');
    expect(reject.className).not.toContain('border-primary');
  });

  it('shows Conversation starter chip when label matches', () => {
    render(
      <ReplySuggestionsList
        suggestions={[{ ...baseSuggestion, label: 'Conversation starter' }]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Conversation starter')).toBeInTheDocument();
    expect(screen.queryByText('Warm opener')).not.toBeInTheDocument();
  });

  it('shows Copied then calls onAccept after the success delay', () => {
    const onAccept = vi.fn();

    render(
      <ReplySuggestionsList suggestions={[baseSuggestion]} onAccept={onAccept} onReject={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: /accept & copy/i }));

    expect(screen.getByRole('button', { name: /^copied$/i })).toBeInTheDocument();
    expect(onAccept).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(649);
    });
    expect(onAccept).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(baseSuggestion);
  });

  it('calls onAccept immediately when reduced motion is preferred', () => {
    useReducedMotion.mockReturnValue(true);
    const onAccept = vi.fn();

    render(
      <ReplySuggestionsList suggestions={[baseSuggestion]} onAccept={onAccept} onReject={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: /accept & copy/i }));

    act(() => {
      vi.runAllTimers();
    });

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(baseSuggestion);
  });

  it('requires a reject category before submitting feedback', () => {
    const onReject = vi.fn();

    render(
      <ReplySuggestionsList suggestions={[baseSuggestion]} onAccept={vi.fn()} onReject={onReject} />
    );

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    expect(screen.getByText('Reason category')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const rejectButton = within(dialog).getByRole('button', { name: /^reject$/i });
    expect(rejectButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /too generic/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^reject$/i }));

    expect(onReject).toHaveBeenCalledWith(baseSuggestion, null, 'tooGeneric');
  });

  it('shows rejected category label on processed suggestions', () => {
    render(
      <ReplySuggestionsList
        suggestions={[
          {
            ...baseSuggestion,
            status: 'REJECTED',
            rejectionFeedbackCategory: 'wrongTone',
          },
        ]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Rejected: Wrong tone / off-brand')).toBeInTheDocument();
  });

  it('renders media and meme brief blocks with copy actions', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const withBriefs: ReplySuggestion = {
      ...baseSuggestion,
      id: 'sug-2',
      mediaBrief: {
        kind: 'image',
        concept: 'Screenshot of the bug',
        visualBrief: 'Crop to the failing assertion line',
        altText: 'Test output showing failure',
      },
      memeSuggestion: {
        concept: 'This is fine',
        visualBrief: 'Dog in burning room',
        format: 'reaction',
        formatName: 'This is fine',
      },
    };

    render(
      <ReplySuggestionsList suggestions={[withBriefs]} onAccept={vi.fn()} onReject={vi.fn()} />
    );

    expect(screen.getByText('Media brief')).toBeInTheDocument();
    expect(screen.getByText('Meme idea — This is fine')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy brief/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy meme/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /copy brief/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Screenshot of the bug'));

    fireEvent.click(screen.getByRole('button', { name: /copy meme/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('This is fine'));
  });
});
