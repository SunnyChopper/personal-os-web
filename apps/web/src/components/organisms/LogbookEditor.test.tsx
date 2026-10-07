import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogbookEntry } from '@/types/growth-system';
import { LogbookEditor } from '@/components/organisms/LogbookEditor';
import { projectsService } from '@/services/growth-system/projects.service';
import { goalsService } from '@/services/growth-system/goals.service';
import { logbookService } from '@/services/growth-system/logbook.service';

vi.mock('@/services/growth-system/projects.service', () => ({
  projectsService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/services/growth-system/goals.service', () => ({
  goalsService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/services/growth-system/logbook.service', () => ({
  logbookService: {
    suggestLinks: vi.fn(),
  },
}));

const mockProjects = [
  {
    id: 'project-1',
    name: 'Personal OS Memory',
    area: 'Operations',
    status: 'Active',
  },
];

const mockGoals = [
  {
    id: 'goal-1',
    title: 'Rekindle AI curiosity',
    area: 'Day Job',
    status: 'Active',
  },
];

const mockSuggestions = {
  suggestions: [
    {
      entityId: 'project-1',
      entityType: 'project' as const,
      title: 'Personal OS Memory',
      reason: 'Matches AI themes in your note.',
      confidence: 0.82,
    },
    {
      entityId: 'goal-1',
      entityType: 'goal' as const,
      title: 'Rekindle AI curiosity',
      reason: 'Your note discusses curiosity.',
      confidence: 0.75,
    },
  ],
};

function renderEditor(props: ComponentProps<typeof LogbookEditor>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <LogbookEditor {...props} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(projectsService.getAll).mockResolvedValue({
    success: true,
    data: mockProjects as never,
  });
  vi.mocked(goalsService.getAll).mockResolvedValue({
    success: true,
    data: mockGoals as never,
  });
  vi.mocked(logbookService.suggestLinks).mockResolvedValue({
    success: true,
    data: mockSuggestions,
  });
});

const baseEntry: LogbookEntry = {
  id: 'entry-1',
  date: '2026-09-07',
  title: 'Morning reflection',
  notes: 'Shipped logbook links',
  mood: 'Steady',
  energy: 6,
  linkedEntities: [{ entityType: 'project', entityId: 'proj-1', entityName: 'Personal OS' }],
  userId: 'user-1',
  createdAt: '2026-09-07T12:00:00.000Z',
  updatedAt: '2026-09-07T12:00:00.000Z',
};

describe('LogbookEditor PATCH payload', () => {
  const noop = vi.fn();

  it('disables the date input when editing an existing entry', () => {
    renderEditor({ entry: baseEntry, onSubmit: noop, onCancel: noop });

    const dateInput = screen.getByDisplayValue('2026-09-07');
    expect(dateInput).toBeDisabled();
  });

  it('submits update payload without date', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderEditor({ entry: baseEntry, onSubmit: onSubmit, onCancel: noop });

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).not.toHaveProperty('date');
    expect(payload).toEqual(
      expect.objectContaining({
        title: 'Morning reflection',
        notes: 'Shipped logbook links',
        mood: 'Steady',
        energy: 6,
        linkedEntities: [{ entityType: 'project', entityId: 'proj-1', entityName: 'Personal OS' }],
      })
    );
  });

  it('includes date on create payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderEditor({ defaultDate: '2026-09-08', onSubmit: onSubmit, onCancel: noop });

    await user.type(screen.getByPlaceholderText('Optional title for today...'), 'New day');
    await user.click(screen.getByRole('button', { name: 'Create Entry' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-09-08',
        title: 'New day',
      })
    );
  });
});

describe('LogbookEditor link suggestions', () => {
  const noop = vi.fn();

  it('does not submit when linking a suggestion and passes excludeEntities on re-run', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderEditor({ defaultDate: '2026-09-08', onSubmit, onCancel: noop });

    await user.type(
      screen.getByPlaceholderText(/What happened today/),
      'Working on AI memory and curiosity today'
    );
    await user.click(screen.getByRole('button', { name: 'Suggest links' }));

    await waitFor(() => {
      expect(screen.getByText('Personal OS Memory')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Link' })[0]);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Linked' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Suggest links' }));

    await waitFor(() => {
      expect(logbookService.suggestLinks).toHaveBeenLastCalledWith(
        expect.objectContaining({
          excludeEntities: [{ entityType: 'project', entityId: 'project-1' }],
        })
      );
    });
  });
});
