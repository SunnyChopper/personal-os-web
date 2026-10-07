import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProjectCard } from '@/components/molecules/ProjectCard';
import type { Project } from '@/types/growth-system';
import {
  stalePlanningDisplayFixture,
  stalePlanningProjectFixture,
} from '@/components/molecules/project-status-badge-parity-fixture';

const baseProject: Project = {
  id: 'project-1',
  name: 'UND - Intro to Linear Algebra',
  description: null,
  area: 'Happiness',
  subCategory: null,
  priority: 'P2',
  status: 'Active',
  impact: 3,
  startDate: '2026-01-01',
  targetEndDate: '2026-06-01',
  actualEndDate: null,
  notes: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockOpen = vi.fn();

vi.mock('@/contexts/EntityExplainChatContext', () => ({
  useEntityExplainChatOptional: () => ({
    open: mockOpen,
    close: vi.fn(),
    session: null,
  }),
}));

describe('ProjectCard grid metadata hierarchy', () => {
  it('renders priority, quiet status/area meta, and progress ring', () => {
    const { container } = render(
      <ProjectCard
        project={baseProject}
        onClick={vi.fn()}
        taskCount={4}
        completedTaskCount={2}
        linkedGoalCount={1}
        viewMode="grid"
      />
    );

    expect(screen.getByRole('button', { name: /view project details/i })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Happiness')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(screen.queryByText('--')).toBeNull();
  });

  it('shows subcategory pill when subCategory is set', () => {
    const projectWithPurpose = { ...baseProject, subCategory: 'Purpose' as const };
    render(<ProjectCard project={projectWithPurpose} onClick={vi.fn()} viewMode="grid" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Happiness')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
  });

  it('omits subcategory pill when subCategory is null', () => {
    render(<ProjectCard project={baseProject} onClick={vi.fn()} viewMode="grid" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Happiness')).toBeInTheDocument();
    expect(screen.queryByText('Purpose')).toBeNull();
  });

  it('renders progress ring at 0% when project has no tasks or linked goals', () => {
    const { container } = render(
      <ProjectCard project={baseProject} onClick={vi.fn()} viewMode="grid" />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('circle')[0]?.getAttribute('class')).toContain(
      'text-gray-300'
    );
    expect(screen.queryByText('--')).toBeNull();
  });

  it('renders visible track and 0% for Planning projects with no tasks', () => {
    const planningProject = { ...baseProject, status: 'Planning' as const };
    const { container } = render(
      <ProjectCard
        project={planningProject}
        onClick={vi.fn()}
        viewMode="grid"
        display={{
          progressPercent: 0,
          isWorkComplete: false,
          effectiveStatus: 'Planning',
          isStale: false,
        }}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelectorAll('circle')[0]?.getAttribute('class')).toContain(
      'text-gray-300'
    );
  });

  it('uses green ring color for Active projects', () => {
    const { container } = render(
      <ProjectCard
        project={baseProject}
        onClick={vi.fn()}
        taskCount={2}
        completedTaskCount={1}
        viewMode="grid"
      />
    );

    const progressStroke = container.querySelectorAll('circle')[1];
    expect(progressStroke?.getAttribute('class')).toContain('text-green-600');
  });

  it('uses amber ring color for Planning projects', () => {
    const planningProject = {
      ...baseProject,
      status: 'Planning' as const,
      targetEndDate: null,
    };
    const { container } = render(
      <ProjectCard project={planningProject} onClick={vi.fn()} viewMode="grid" />
    );

    const progressStroke = container.querySelectorAll('circle')[1];
    expect(progressStroke?.getAttribute('class')).toContain('text-amber-600');
  });

  it('opens entity explain with project context when explain is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard
        project={baseProject}
        onClick={vi.fn()}
        taskCount={4}
        completedTaskCount={2}
        linkedGoalCount={1}
        viewMode="grid"
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: /explain this project: und - intro to linear algebra/i,
      })
    );

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'project',
        entity: baseProject,
        projectEnrichment: expect.objectContaining({
          taskCount: 4,
          completedTaskCount: 2,
          linkedGoalCount: 1,
          progressPercent: 50,
        }),
      })
    );
  });

  it('uses border hover emphasis without resting shadow on grid shell', () => {
    const { container } = render(
      <ProjectCard project={baseProject} onClick={vi.fn()} viewMode="grid" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-3');
    expect(card.className).toContain('lg:hover:border-blue-500');
    expect(card.className).not.toMatch(/shadow-lg/);
  });

  it('hides priority accent bar at rest on grid cards', () => {
    const { container } = render(
      <ProjectCard project={baseProject} onClick={vi.fn()} viewMode="grid" />
    );

    const accentBar = container.querySelector('[aria-hidden="true"]');
    expect(accentBar?.className).toContain('opacity-0');
    expect(accentBar?.className).toContain('group-hover:opacity-100');
  });

  it('does not reserve a selection checkbox column on grid cards', () => {
    const { container } = render(
      <ProjectCard project={baseProject} onClick={vi.fn()} viewMode="grid" />
    );

    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(container.querySelector('[data-project-select]')).toBeNull();
  });

  it('shows Stale status badge and muted ring for stale Planning projects', () => {
    const { container } = render(
      <ProjectCard
        project={stalePlanningProjectFixture}
        onClick={vi.fn()}
        viewMode="grid"
        display={stalePlanningDisplayFixture}
      />
    );

    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.queryByText('Planning')).toBeNull();
    const progressStroke = container.querySelectorAll('circle')[1];
    expect(progressStroke?.getAttribute('class')).toContain('text-gray-400');
  });
});

describe('ProjectCard list progress ring', () => {
  it('shows progress ring at all breakpoints in list mode', () => {
    const { container } = render(
      <ProjectCard
        project={{ ...baseProject, status: 'Planning' }}
        onClick={vi.fn()}
        viewMode="list"
        display={{
          progressPercent: 0,
          isWorkComplete: false,
          effectiveStatus: 'Planning',
          isStale: false,
        }}
      />
    );

    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('svg')).toBeTruthy();
    const progressSlot = container.querySelector('svg')?.parentElement?.parentElement;
    expect(progressSlot?.className).not.toContain('hidden');
  });
});
