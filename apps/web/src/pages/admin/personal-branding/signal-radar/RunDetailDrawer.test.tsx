import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RunDetailDrawer from './RunDetailDrawer';
import type { RadarRunDetail } from '@/types/api/personal-branding.dto';

const mockUseSignalRadarRunOutcomes = vi.fn(
  (_runId: string, _options?: { dropReason?: string | null }) => buildOutcomesResult()
);

function buildOutcomesResult() {
  return {
    outcomes: {
      isLoading: false,
      isError: false,
      data: {
        data: [
          {
            id: 'o1',
            runId: 'run-1',
            disposition: 'filtered',
            dropReason: 'aiFiltered',
            sourceId: 's1',
            sourceName: 'Feed',
            title: 'Noise item',
            itemId: 'item-filtered-1',
            relevanceScore: 0.4,
            aiRelevanceScore: 0.15,
            aiRationale: 'Off brand',
            createdAt: '2026-06-01T12:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
        hasMore: false,
      },
    },
  };
}

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/molecules/SlideDrawer', () => ({
  default: ({
    open,
    children,
    header,
  }: {
    open: boolean;
    children: React.ReactNode;
    header?: React.ReactNode;
  }) =>
    open ? (
      <div>
        {header}
        {children}
      </div>
    ) : null,
}));

const mockPromoteRadarItem = vi.fn();

vi.mock('@/hooks/useSignalRadar', () => ({
  useSignalRadarRunOutcomes: (runId: string, options?: { dropReason?: string | null }) =>
    mockUseSignalRadarRunOutcomes(runId, options),
  usePromoteRadarItem: () => mockPromoteRadarItem(),
}));

function makeRun(overrides: Partial<RadarRunDetail> = {}): RadarRunDetail {
  return {
    id: 'run-1',
    status: 'completed',
    trigger: 'manual',
    runKind: 'ingest',
    sourcesTotal: 1,
    sourcesSucceeded: 1,
    sourcesFailed: 0,
    itemsDiscovered: 4,
    itemsAlreadyAdded: 2,
    itemsCreated: 1,
    itemsFiltered: 1,
    createdAt: '2026-06-01T12:00:00Z',
    updatedAt: '2026-06-01T12:01:00Z',
    sourceResults: [],
    ...overrides,
  };
}

describe('RunDetailDrawer', () => {
  beforeEach(() => {
    mockPromoteRadarItem.mockReturnValue({
      isPending: false,
      variables: undefined,
      mutateAsync: vi.fn().mockResolvedValue({ id: 'item-filtered-1' }),
    });
  });

  it('opens dropped items with aiFiltered preselected when the filtered count is clicked', () => {
    render(<RunDetailDrawer open run={makeRun()} onClose={vi.fn()} onRerun={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '1' }));

    expect(screen.getByRole('group', { name: 'Filter by drop reason' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI filtered' })).toHaveClass('border-blue-500');
    expect(screen.getByText('Noise item')).toBeInTheDocument();
    expect(screen.getByText('AI filter score')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('Pillar keyword match')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Does not decide the drop')).toBeInTheDocument();
    expect(screen.getByText('Off brand')).toBeInTheDocument();
    expect(mockUseSignalRadarRunOutcomes).toHaveBeenCalledWith('run-1', {
      dropReason: 'aiFiltered',
    });
    expect(screen.getByRole('button', { name: 'This should have been kept' })).toBeInTheDocument();
  });

  it('promotes filtered item when keep action is clicked', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'item-filtered-1' });
    mockPromoteRadarItem.mockReturnValue({
      isPending: false,
      variables: undefined,
      mutateAsync,
    });

    render(<RunDetailDrawer open run={makeRun()} onClose={vi.fn()} onRerun={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: 'This should have been kept' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('item-filtered-1');
    });
    expect(await screen.findByText('Added to Trend Stream')).toBeInTheDocument();
  });

  it('opens dropped items with alreadyAdded preselected when already added count is clicked', () => {
    render(<RunDetailDrawer open run={makeRun()} onClose={vi.fn()} onRerun={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(screen.getByRole('button', { name: 'Already in Trend Stream' })).toHaveClass(
      'border-blue-500'
    );
    expect(mockUseSignalRadarRunOutcomes).toHaveBeenCalledWith('run-1', {
      dropReason: 'alreadyAdded',
    });
  });

  it('switches to all drop reasons when the All chip is clicked', () => {
    render(<RunDetailDrawer open run={makeRun()} onClose={vi.fn()} onRerun={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    expect(screen.getByRole('button', { name: 'All' })).toHaveClass('border-blue-500');
    expect(mockUseSignalRadarRunOutcomes).toHaveBeenLastCalledWith('run-1', {
      dropReason: null,
    });
  });

  it('does not make zero counts clickable', () => {
    render(
      <RunDetailDrawer
        open
        run={makeRun({ itemsFiltered: 0, itemsAlreadyAdded: 0 })}
        onClose={vi.fn()}
        onRerun={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
  });
});
