import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import DashboardPage from '@/pages/admin/DashboardPage';
import type { Project } from '@/types/growth-system';
import { ROUTES } from '@/routes';
import { sortActiveProjectsForDashboard } from '@/lib/growth-system/dashboard-active-projects';

function makeProject(overrides: Partial<Project> & Pick<Project, 'id' | 'name'>): Project {
  return {
    description: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Active',
    impact: 1,
    startDate: null,
    targetEndDate: null,
    actualEndDate: null,
    notes: null,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const activeProjectsFixture: Project[] = [
  makeProject({ id: 'p-1', name: 'Newest Project', updatedAt: '2026-05-27T12:00:00Z' }),
  makeProject({ id: 'p-2', name: 'Second Project', updatedAt: '2026-05-26T12:00:00Z' }),
  makeProject({ id: 'p-3', name: 'Third Project', updatedAt: '2026-05-25T12:00:00Z' }),
  makeProject({ id: 'p-4', name: 'Fourth Project', updatedAt: '2026-05-24T12:00:00Z' }),
  makeProject({ id: 'p-5', name: 'Fifth Project', updatedAt: '2026-05-23T12:00:00Z' }),
  makeProject({ id: 'p-6', name: 'Oldest Active Project', updatedAt: '2020-01-01T00:00:00Z' }),
  makeProject({ id: 'p-planning', name: 'Planning Only', status: 'Planning' }),
];

const sortedActive = sortActiveProjectsForDashboard(activeProjectsFixture);
const omittedProject = sortedActive[sortedActive.length - 1]!;

vi.mock('@/hooks/useGrowthSystemDashboard', () => ({
  useGrowthSystemDashboard: () => ({
    tasks: [],
    goals: [],
    projects: activeProjectsFixture,
    habits: [],
    metrics: [],
    logbookEntries: [],
    isLoading: false,
    isError: false,
    error: null,
    data: undefined,
  }),
}));

vi.mock('@/contexts/Mode', () => ({
  useMode: () => ({ isLeisureMode: false }),
}));

vi.mock('@/contexts/BackendStatusContext', () => ({
  useBackendStatus: () => ({
    status: { isOnline: true, lastError: null, isChecking: false },
    recordError: vi.fn(),
    recordSuccess: vi.fn(),
  }),
}));

vi.mock('@/components/organisms/DailyPlanningAssistant', () => ({
  DailyPlanningAssistant: () => <div data-testid="daily-planning-assistant" />,
}));

vi.mock('@/components/organisms/MorningLaunchpad', () => ({
  MorningLaunchpad: () => null,
}));

vi.mock('@/components/organisms/GoalsDashboardWidget', () => ({
  GoalsDashboardWidget: () => <div data-testid="goals-dashboard-widget" />,
}));

vi.mock('@/components/organisms/AIInsightsWidget', () => ({
  AIInsightsWidget: () => <div data-testid="ai-insights-widget" />,
}));

vi.mock('@/components/molecules/StaleVelocityAdvisoryCard', () => ({
  StaleVelocityAdvisoryCard: () => null,
}));

function renderDashboard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <DashboardPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage Active Projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows full active count on stat card but only five rows in widget with overflow', () => {
    renderDashboard();

    const statCardLink = screen.getByRole('link', { name: /Active Projects/i });
    expect(within(statCardLink).getByRole('heading', { level: 3 })).toHaveTextContent('6');

    const widgetHeading = screen.getByRole('heading', { name: 'Active Projects', level: 2 });
    const widgetPanel = widgetHeading.closest('div.bg-white, div.dark\\:bg-gray-800');
    expect(widgetPanel).toBeTruthy();

    const widget = widgetPanel as HTMLElement;
    expect(within(widget).getByText('Newest Project')).toBeInTheDocument();
    expect(within(widget).getByText('Fifth Project')).toBeInTheDocument();
    expect(within(widget).queryByText('Oldest Active Project')).not.toBeInTheDocument();
    expect(within(widget).queryByText('Planning Only')).not.toBeInTheDocument();

    expect(within(widget).getByText('+1 more active project')).toBeInTheDocument();

    const viewAllLinks = within(widget).getAllByRole('link', { name: 'View all projects' });
    expect(viewAllLinks.length).toBeGreaterThanOrEqual(1);
    expect(viewAllLinks[0]).toHaveAttribute('href', ROUTES.admin.projects);

    expect(omittedProject.name).toBe('Oldest Active Project');
  });
});
