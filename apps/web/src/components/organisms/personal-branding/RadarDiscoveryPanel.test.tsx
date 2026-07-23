import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RadarDiscoveryPanel from './RadarDiscoveryPanel';
import type { RadarDiscoveryRun } from '@/types/api/personal-branding.dto';

const mockUseSignalRadarDiscoveryRuns = vi.fn();
const mockUseSignalRadarDiscoveryRun = vi.fn();
const mockUseSignalRadarDiscoveryCandidates = vi.fn();

vi.mock('@/hooks/useSignalRadar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useSignalRadar')>();
  return {
    ...actual,
    useSignalRadarDiscoveryRuns: (...args: unknown[]) => mockUseSignalRadarDiscoveryRuns(...args),
    useSignalRadarDiscoveryRun: (...args: unknown[]) => mockUseSignalRadarDiscoveryRun(...args),
    useSignalRadarDiscoveryCandidates: (...args: unknown[]) =>
      mockUseSignalRadarDiscoveryCandidates(...args),
  };
});

vi.mock('@/hooks/useRadarDiscoveryParseJob', () => ({
  useRadarDiscoveryParseJob: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

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

function makeRun(status: RadarDiscoveryRun['status'], runId = 'run-1'): RadarDiscoveryRun {
  return {
    runId,
    status,
    profileSnapshots: [],
    profileNames: ['Builder'],
    customTopics: [],
    effectiveTopics: ['AI Systems'],
    generatedQueries: [],
    phase: status === 'running' ? 'evaluating' : 'completed',
    currentActivity: status === 'running' ? 'Scoring candidates' : 'Discovery completed.',
    progress: {
      queriesTotal: 4,
      queriesCompleted: status === 'running' ? 2 : 4,
      candidatesDiscovered: 8,
      candidatesEvaluated: status === 'running' ? 3 : 8,
      candidatesRelevant: 2,
      candidatesNotRelevant: 1,
      candidatesFailed: 0,
    },
    createdAt: '2026-07-14T12:00:00Z',
    updatedAt: '2026-07-14T12:01:00Z',
    startedAt: '2026-07-14T12:00:00Z',
  };
}

function makeSignalRadar() {
  return {
    settings: { data: { hasTavilyKey: true } },
    discoveryProfiles: { data: { data: [] }, isLoading: false },
    startDiscovery: { mutateAsync: vi.fn(), isPending: false },
    controlDiscovery: { mutateAsync: vi.fn() },
    saveDiscoveryCandidate: { mutateAsync: vi.fn() },
    addDiscoveryCandidateAsItem: { mutateAsync: vi.fn() },
    markDiscoveryCandidateNotASource: { mutateAsync: vi.fn() },
    dismissDiscoveryCandidate: { mutateAsync: vi.fn() },
    parseDiscoveryCandidateSources: { mutateAsync: vi.fn() },
  };
}

describe('RadarDiscoveryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignalRadarDiscoveryRuns.mockReturnValue({
      runs: {
        data: {
          data: [makeRun('completed')],
          total: 1,
          page: 1,
          pageSize: 10,
          hasMore: false,
        },
        isLoading: false,
        isFetching: false,
      },
    });
    mockUseSignalRadarDiscoveryRun.mockReturnValue({
      detail: { data: undefined, isLoading: false },
    });
    mockUseSignalRadarDiscoveryCandidates.mockReturnValue({
      candidates: { data: undefined, isLoading: false, isFetching: false, error: null },
    });
  });

  it('does not render monitor or candidate review on the page until a run is opened', () => {
    render(<RadarDiscoveryPanel signalRadar={makeSignalRadar() as never} />);

    expect(screen.getByText('Discovery history')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run discovery/i })).toBeInTheDocument();
    expect(screen.queryByText('Durable source discovery')).not.toBeInTheDocument();
    expect(screen.queryByText('Discovery monitor')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate review')).not.toBeInTheDocument();
  });

  it('disables Run discovery and shows Tavily warning when no API key is configured', () => {
    const signalRadar = makeSignalRadar();
    signalRadar.settings = { data: { hasTavilyKey: false } };

    render(<RadarDiscoveryPanel signalRadar={signalRadar as never} />);

    expect(screen.getByRole('button', { name: /Run discovery/i })).toBeDisabled();
    expect(
      screen.getByText('Add a Tavily API key in Sync settings before starting discovery.')
    ).toBeInTheDocument();
  });

  it('opens the detail modal when a history row is selected', async () => {
    const user = userEvent.setup();
    const completedRun = makeRun('completed');
    mockUseSignalRadarDiscoveryRun.mockImplementation((runId: string | null) => ({
      detail: {
        data: runId ? completedRun : undefined,
        isLoading: false,
      },
    }));

    render(<RadarDiscoveryPanel signalRadar={makeSignalRadar() as never} />);

    await user.click(screen.getByRole('button', { name: /Open discovery run from/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Discovery monitor')).toBeInTheDocument();
    expect(screen.getByText('Candidate review')).toBeInTheDocument();
  });

  it('closes the detail modal without clearing history', async () => {
    const user = userEvent.setup();
    const completedRun = makeRun('completed');
    mockUseSignalRadarDiscoveryRun.mockImplementation((runId: string | null) => ({
      detail: {
        data: runId ? completedRun : undefined,
        isLoading: false,
      },
    }));

    render(<RadarDiscoveryPanel signalRadar={makeSignalRadar() as never} />);

    await user.click(screen.getByRole('button', { name: /Open discovery run from/i }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Discovery history')).toBeInTheDocument();
  });

  it('shows Show progress for a live run and opens the modal only when clicked', async () => {
    const user = userEvent.setup();
    const runningRun = makeRun('running');
    mockUseSignalRadarDiscoveryRuns.mockReturnValue({
      runs: {
        data: {
          data: [runningRun],
          total: 1,
          page: 1,
          pageSize: 10,
          hasMore: false,
        },
        isLoading: false,
        isFetching: false,
      },
    });
    mockUseSignalRadarDiscoveryRun.mockImplementation((runId: string | null) => ({
      detail: {
        data: runId ? runningRun : undefined,
        isLoading: false,
      },
    }));

    render(<RadarDiscoveryPanel signalRadar={makeSignalRadar() as never} />);

    expect(screen.getByRole('button', { name: 'Show progress' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show progress' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not auto-reopen the modal after the user closes it while a run is still live', async () => {
    const user = userEvent.setup();
    const runningRun = makeRun('running');
    mockUseSignalRadarDiscoveryRuns.mockReturnValue({
      runs: {
        data: {
          data: [runningRun],
          total: 1,
          page: 1,
          pageSize: 10,
          hasMore: false,
        },
        isLoading: false,
        isFetching: false,
      },
    });
    mockUseSignalRadarDiscoveryRun.mockImplementation((runId: string | null) => ({
      detail: {
        data: runId ? runningRun : undefined,
        isLoading: false,
      },
    }));

    const { rerender } = render(<RadarDiscoveryPanel signalRadar={makeSignalRadar() as never} />);

    await user.click(screen.getByRole('button', { name: 'Show progress' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show progress' })).toBeInTheDocument();

    rerender(<RadarDiscoveryPanel signalRadar={makeSignalRadar() as never} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
