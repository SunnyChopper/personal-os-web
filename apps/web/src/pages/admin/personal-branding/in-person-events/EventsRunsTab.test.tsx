import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  EventDiscoveryRun,
  PaginatedPersonalBranding,
} from '@/types/api/personal-branding.dto';
import EventsRunsTab from './EventsRunsTab';

const { mockUseRunsPage, mockUseRunDetail } = vi.hoisted(() => ({
  mockUseRunsPage: vi.fn(),
  mockUseRunDetail: vi.fn(),
}));

vi.mock('@/hooks/useInPersonEvents', () => ({
  DISCOVERY_RUNS_PAGE_SIZE: 20,
  useEventDiscoveryRunsPage: mockUseRunsPage,
  useEventDiscoveryRunDetail: mockUseRunDetail,
}));

function makeRun(overrides: Partial<EventDiscoveryRun> = {}): EventDiscoveryRun {
  return {
    id: 'run-1',
    status: 'failed',
    triggerKind: 'manual',
    phase: 'failed',
    heartbeatAt: '2026-08-20T12:00:00.000Z',
    queuedAt: '2026-08-20T11:59:00.000Z',
    startedAt: '2026-08-20T11:59:10.000Z',
    finishedAt: '2026-08-20T12:00:00.000Z',
    queriesGenerated: 2,
    resultsFetched: 4,
    candidatesExtracted: 3,
    eventsCreated: 0,
    eventsDuplicate: 0,
    eventsFiltered: 3,
    generatedQueries: ['Austin founder events'],
    activityLog: [
      {
        at: '2026-08-20T12:00:00.000Z',
        phase: 'failed',
        message: 'The worker stopped.',
      },
    ],
    extractedEvents: [],
    errorSummary: 'Exact Tavily failure details',
    pollAfterMs: null,
    createdAt: '2026-08-20T11:59:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
    ...overrides,
  };
}

function page(
  data: EventDiscoveryRun[],
  overrides: Partial<PaginatedPersonalBranding<EventDiscoveryRun>> = {}
): PaginatedPersonalBranding<EventDiscoveryRun> {
  return {
    data,
    total: 21,
    page: 1,
    pageSize: 20,
    hasMore: false,
    ...overrides,
  };
}

function renderTab() {
  return render(
    <MemoryRouter initialEntries={['/admin/personal-branding/events?tab=runs']}>
      <EventsRunsTab />
    </MemoryRouter>
  );
}

describe('EventsRunsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRunsPage.mockReturnValue({
      data: page([makeRun()]),
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
    });
    mockUseRunDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  it('renders run errors and disables pagination at the appropriate edges', () => {
    renderTab();

    expect(screen.getByText('Exact Tavily failure details')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous discovery run history page' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next discovery run history page' })).toBeDisabled();
  });

  it('opens the full run error in the detail drawer', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: /Open event discovery run from/i }));

    expect(screen.getByRole('dialog', { name: 'Event discovery run details' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Exact Tavily failure details');
    expect(screen.getByText('Austin founder events')).toBeInTheDocument();
  });

  it('shows inferred inputs and scoring failures in the detail drawer', async () => {
    const user = userEvent.setup();
    mockUseRunsPage.mockReturnValue({
      data: page([
        makeRun({
          inferredInterests: ['AI agents', 'Developer tooling'],
          inferredEventTypes: ['meetup', 'workshop'],
          inferenceSource: 'brandProfilePillars',
          scoringFailures: 2,
        }),
      ]),
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
    });
    renderTab();

    await user.click(screen.getByRole('button', { name: /Open event discovery run from/i }));

    expect(screen.getByText('Inferred discovery inputs')).toBeInTheDocument();
    expect(screen.getByText('AI agents, Developer tooling')).toBeInTheDocument();
    expect(screen.getByText('meetup, workshop')).toBeInTheDocument();
    expect(screen.getByText('Scoring failures')).toBeInTheDocument();
    expect(screen.getByText('Scoring failures').parentElement).toHaveTextContent('2');
  });

  it('loads the next history page when more runs are available', async () => {
    const user = userEvent.setup();
    mockUseRunsPage.mockImplementation((requestedPage: number) => ({
      data: page([makeRun({ id: `run-${requestedPage}` })], {
        page: requestedPage,
        hasMore: requestedPage === 1,
      }),
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
    }));
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Next discovery run history page' }));

    expect(mockUseRunsPage).toHaveBeenLastCalledWith(2);
  });
});
