import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RadarDiscoveryRunDetailDialog from './RadarDiscoveryRunDetailDialog';
import type { RadarDiscoveryRun } from '@/types/api/personal-branding.dto';

vi.mock('@/components/molecules/Dialog', () => ({
  default: ({
    isOpen,
    title,
    children,
    onClose,
  }: {
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

function makeRun(status: RadarDiscoveryRun['status']): RadarDiscoveryRun {
  return {
    runId: 'run-1',
    status,
    profileSnapshots: [],
    profileNames: ['Builder'],
    customTopics: [],
    effectiveTopics: ['AI Systems'],
    generatedQueries: [],
    phase: 'evaluating',
    currentActivity: 'Scoring candidates',
    progress: {
      queriesTotal: 4,
      queriesCompleted: 2,
      candidatesDiscovered: 8,
      candidatesEvaluated: 3,
      candidatesRelevant: 2,
      candidatesNotRelevant: 1,
      candidatesFailed: 0,
    },
    createdAt: '2026-07-14T12:00:00Z',
    updatedAt: '2026-07-14T12:01:00Z',
    startedAt: '2026-07-14T12:00:00Z',
  };
}

const baseProps = {
  title: 'Discovery run · completed · 7/14/2026',
  run: makeRun('completed'),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onCancel: vi.fn(),
  candidateFilter: 'all' as const,
  candidatePage: 1,
  onCandidateFilterChange: vi.fn(),
  onCandidatePageChange: vi.fn(),
  onSave: vi.fn(),
  onAddAsItem: vi.fn(),
  onMarkNotASource: vi.fn(),
  onDismiss: vi.fn(),
  onParseSources: vi.fn(),
  onToggleCandidateSelected: vi.fn(),
  onSelectAllVisible: vi.fn(),
  onClearSelection: vi.fn(),
  onBulkAddAsItem: vi.fn(),
  onBulkDismiss: vi.fn(),
  onBulkNotASource: vi.fn(),
};

describe('RadarDiscoveryRunDetailDialog', () => {
  it('renders monitor and candidate review when open', () => {
    render(<RadarDiscoveryRunDetailDialog isOpen onClose={vi.fn()} {...baseProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Discovery monitor')).toBeInTheDocument();
    expect(screen.getByText('Candidate review')).toBeInTheDocument();
  });

  it('hides run detail content when closed', () => {
    render(<RadarDiscoveryRunDetailDialog isOpen={false} onClose={vi.fn()} {...baseProps} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Discovery monitor')).not.toBeInTheDocument();
  });
});
