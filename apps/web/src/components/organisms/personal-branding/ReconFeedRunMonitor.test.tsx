import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReconFeedRunMonitor from './ReconFeedRunMonitor';
import type { ReconRunSummary } from '@/types/api/personal-branding.dto';

function makeRun(overrides: Partial<ReconRunSummary> = {}): ReconRunSummary {
  return {
    id: 'run-1',
    status: 'running',
    trigger: 'manual',
    connectionsTotal: 10,
    connectionsSucceeded: 4,
    connectionsFailed: 1,
    postsDiscovered: 20,
    postsScored: 8,
    followSuggestionsCreated: 0,
    apiCallsUsed: 12,
    currentActivity: 'Scoring posts for @builder',
    phase: 'scoring',
    activityLog: [],
    createdAt: '2026-08-08T12:00:00.000Z',
    updatedAt: '2026-08-08T12:05:00.000Z',
    ...overrides,
  };
}

describe('ReconFeedRunMonitor', () => {
  it('returns null when run is absent and not loading', () => {
    const { container } = render(
      <ReconFeedRunMonitor onPause={vi.fn()} onResume={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders slim collapsed strip by default without expanded stats', () => {
    render(
      <ReconFeedRunMonitor
        run={makeRun()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Scoring posts for @builder')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Recon connection progress' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Live activity')).not.toBeInTheDocument();
    expect(screen.queryByText('Posts discovered')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand run details' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('expands details on chevron click', async () => {
    const user = userEvent.setup();
    render(
      <ReconFeedRunMonitor
        run={makeRun({ activityLog: [{ at: '2026-08-08T12:01:00.000Z', kind: 'scored' }] })}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand run details' }));
    expect(screen.getByText('Live activity')).toBeInTheDocument();
    expect(screen.getByText('Posts discovered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse run details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('dismisses strip and restores via Show run progress', async () => {
    const user = userEvent.setup();
    render(
      <ReconFeedRunMonitor
        run={makeRun()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Hide run progress' }));
    expect(screen.getByRole('button', { name: 'Show run progress' })).toBeInTheDocument();
    expect(screen.queryByText('Scoring posts for @builder')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show run progress' }));
    expect(screen.getByText('Scoring posts for @builder')).toBeInTheDocument();
  });

  it('shows Continue for paused runs', () => {
    render(
      <ReconFeedRunMonitor
        run={makeRun({ status: 'paused', currentActivity: 'Recon ingest paused' })}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
  });

  it('invokes pause control when running', async () => {
    const onPause = vi.fn();
    const user = userEvent.setup();
    render(
      <ReconFeedRunMonitor
        run={makeRun()}
        onPause={onPause}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it('shows slim loading skeleton while run is loading', () => {
    render(
      <ReconFeedRunMonitor isLoading onPause={vi.fn()} onResume={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByRole('status', { name: 'Loading recon run' })).toBeInTheDocument();
    expect(screen.getByText('Loading recon run…')).toBeInTheDocument();
  });

  it('uses focus-visible rings on quiet controls', () => {
    render(
      <ReconFeedRunMonitor
        run={makeRun()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const expandBtn = screen.getByRole('button', { name: 'Expand run details' });
    expect(expandBtn.className).toContain('focus-visible:ring-blue-500/40');
    expect(expandBtn.className).not.toMatch(/\bfocus:ring-/);

    const dismissBtn = screen.getByRole('button', { name: 'Hide run progress' });
    expect(dismissBtn.className).toContain('focus-visible:ring-blue-500/40');
    expect(dismissBtn.className).not.toMatch(/\bfocus:ring-/);
  });

  it('expands on fine-pointer hover without sticky expand', async () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('hover: hover') && query.includes('pointer: fine'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);

    render(
      <ReconFeedRunMonitor
        run={makeRun()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const region = screen.getByRole('region', { name: 'Recon run progress' });
    fireEvent.pointerEnter(region);
    expect(screen.getByText('Posts discovered')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Recon run details', hidden: false })
    ).toBeInTheDocument();

    fireEvent.pointerLeave(region);
    expect(screen.getByRole('button', { name: 'Expand run details' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await waitFor(() => {
      expect(screen.queryByText('Posts discovered')).not.toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
