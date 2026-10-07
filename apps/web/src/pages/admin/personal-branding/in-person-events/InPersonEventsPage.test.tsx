import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import InPersonEventsPage from './InPersonEventsPage';

const mockMutateAsync = vi.fn();

const mockEventsHook = {
  settings: { data: null, isError: false, isPending: false },
  locations: { data: { data: [] }, isPending: false },
  events: { data: { data: [] }, isPending: false },
  upcomingEvents: [],
  pastEvents: [],
  operatorToday: '2026-08-13',
  minFitScore: 40,
  rawUpcomingEvents: [],
  rawPastEvents: [],
  filteredAllEvents: [],
  discoveryRuns: { data: { data: [] } },
  discoveryRunDetail: { data: undefined },
  activeRunId: null,
  updateSettings: { mutateAsync: mockMutateAsync, isPending: false },
  createLocation: { mutateAsync: mockMutateAsync, isPending: false },
  updateLocation: { mutateAsync: mockMutateAsync, isPending: false },
  deleteLocation: { mutateAsync: mockMutateAsync, isPending: false },
  createEvent: { mutateAsync: mockMutateAsync, isPending: false },
  updateEvent: { mutateAsync: mockMutateAsync, isPending: false },
  updateRelevance: { mutateAsync: mockMutateAsync, isPending: false },
  startDiscovery: { mutateAsync: mockMutateAsync, isPending: false },
  cancelDiscovery: { mutateAsync: mockMutateAsync, isPending: false },
  isLoading: false,
  isDiscoveryBusy: false,
};

vi.mock('@/hooks/useInPersonEvents', () => ({
  useInPersonEvents: () => mockEventsHook,
  useInPersonEventsUnmountCleanup: () => undefined,
  useEventDiscoveryRunsPage: () => ({
    data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
    isPending: false,
    isError: false,
    isFetching: false,
    error: null,
  }),
  useEventDiscoveryRunDetail: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

function renderPage(initialEntry = '/admin/personal-branding/events?tab=calendar') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/personal-branding/events" element={<InPersonEventsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function monthLabelForOffset(offsetMonths: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

describe('InPersonEventsPage keepMounted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one tabpanel per tab when keepMounted is enabled', () => {
    renderPage();

    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4);
  });

  it('preserves calendar month cursor across Events tab round-trip', async () => {
    const user = userEvent.setup();
    renderPage();

    const initialMonth = monthLabelForOffset(0);
    const nextMonth = monthLabelForOffset(1);

    expect(screen.getByRole('heading', { level: 2, name: initialMonth })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByRole('heading', { level: 2, name: nextMonth })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Calendar' }));
    expect(screen.getByRole('heading', { level: 2, name: nextMonth })).toBeInTheDocument();
  });
});
