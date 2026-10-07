import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProjectListItem } from '@/components/molecules/ProjectListItem';
import type { Project } from '@/types/growth-system';
import {
  stalePlanningDisplayFixture,
  stalePlanningProjectFixture,
} from '@/components/molecules/project-status-badge-parity-fixture';
import { EXTREME_OVERDUE_DAYS } from '@/utils/project-summary';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

const FIXED_NOW_MS = Date.UTC(2026, 6, 27, 12, 0, 0);
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function endDateDaysBeforeNow(days: number): string {
  return new Date(FIXED_NOW_MS - days * MS_PER_DAY).toISOString().slice(0, 10);
}

const baseProject: Project = {
  id: 'project-1',
  name: 'Leisure Mode',
  description: null,
  area: 'Happiness',
  subCategory: null,
  priority: 'P3',
  status: 'Planning',
  impact: 2,
  startDate: null,
  targetEndDate: null,
  actualEndDate: null,
  notes: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProjectListItem progress ring', () => {
  it('always renders progress ring at 0% when no tasks or goals', () => {
    const { container } = render(
      <ProjectListItem
        project={baseProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('circle')[0]?.getAttribute('class')).toContain(
      'text-gray-300'
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText('--')).toBeNull();
  });

  it('shows subcategory pill when subCategory is set', () => {
    const projectWithPurpose = { ...baseProject, subCategory: 'Purpose' as const };
    render(
      <ProjectListItem
        project={projectWithPurpose}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Happiness')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
  });

  it('omits subcategory pill when subCategory is null', () => {
    render(
      <ProjectListItem
        project={baseProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Happiness')).toBeInTheDocument();
    expect(screen.queryByText('Purpose')).toBeNull();
  });

  it('keeps progress slot visible at base breakpoint', () => {
    const { container } = render(
      <ProjectListItem
        project={baseProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const progressSlot = container.querySelector('svg')?.closest('.flex.shrink-0');
    expect(progressSlot?.className).toContain('flex');
    expect(progressSlot?.className).not.toContain('hidden');
  });

  it('renders red overdue badge for moderately past target end date', () => {
    const overdueProject = {
      ...baseProject,
      status: 'Active' as const,
      startDate: endDateDaysBeforeNow(90),
      targetEndDate: endDateDaysBeforeNow(30),
    };

    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW_MS);

    render(
      <ProjectListItem
        project={overdueProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        display={{
          progressPercent: 86,
          isWorkComplete: false,
          effectiveStatus: 'Active',
          isStale: false,
        }}
      />
    );

    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText(/Overdue by \d+ days/)).toBeInTheDocument();
    expect(screen.queryByText(/Long overdue/)).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders abandoned-risk badge for extreme overdue target end date', () => {
    const daysOverdue = EXTREME_OVERDUE_DAYS + 74;
    const overdueProject = {
      ...baseProject,
      status: 'Active' as const,
      startDate: endDateDaysBeforeNow(daysOverdue + 30),
      targetEndDate: endDateDaysBeforeNow(daysOverdue),
    };

    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW_MS);

    render(
      <ProjectListItem
        project={overdueProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        display={{
          progressPercent: 86,
          isWorkComplete: false,
          effectiveStatus: 'Active',
          isStale: false,
        }}
      />
    );

    expect(screen.getByText(/Long overdue · \d+ days/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('uses amber ring color for Planning projects', () => {
    const { container } = render(
      <ProjectListItem
        project={baseProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const progressStroke = container.querySelectorAll('circle')[1];
    expect(progressStroke?.getAttribute('class')).toContain('text-amber-600');
  });

  it('uses muted ring color for stale projects', () => {
    const staleProject = { ...baseProject, status: 'Active' as const, isStale: true };
    const { container } = render(
      <ProjectListItem
        project={staleProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        display={{
          progressPercent: 0,
          isWorkComplete: false,
          effectiveStatus: 'Active',
          isStale: true,
        }}
      />
    );

    const progressStroke = container.querySelectorAll('circle')[1];
    expect(progressStroke?.getAttribute('class')).toContain('text-gray-400');
    expect(container.querySelectorAll('circle')[0]?.getAttribute('class')).toContain(
      'text-gray-300'
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Stale')).toBeInTheDocument();
  });

  it('shows archive action for non-archived projects', () => {
    render(
      <ProjectListItem
        project={baseProject}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
      />
    );

    expect(screen.getByLabelText(`Archive project: ${baseProject.name}`)).toBeInTheDocument();
  });

  it('shows revive action for archived projects', () => {
    render(
      <ProjectListItem
        project={{ ...baseProject, status: 'Archived' }}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onRevive={vi.fn()}
      />
    );

    expect(screen.getByLabelText(`Revive project: ${baseProject.name}`)).toBeInTheDocument();
  });
});

describe('ProjectListItem status badge parity with grid', () => {
  it('shows Stale for the same stale Planning fixture as ProjectCard', () => {
    render(
      <ProjectListItem
        project={stalePlanningProjectFixture}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        display={stalePlanningDisplayFixture}
      />
    );

    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.queryByText('Planning')).toBeNull();
  });
});
