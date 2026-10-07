import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EntitySummary, Task } from '@/types/growth-system';
import { TaskEditPanel } from '@/components/organisms/TaskEditPanel';

const { showToast } = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast,
  }),
}));

vi.mock('@/lib/llm', () => ({
  llmConfig: { isConfigured: () => false },
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

function makeTask(): Task {
  return {
    id: 'task-1',
    title: 'My task',
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P2',
    status: 'Backlog',
    size: 3,
    dueDate: null,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: ['p1'],
    goalIds: ['g1'],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

const linkedProjects: EntitySummary[] = [
  { id: 'p1', title: 'Capital OS', type: 'project', area: 'Wealth', status: 'Active' },
  { id: 'p2', title: 'Side project', type: 'project', area: 'Operations', status: 'Active' },
];

const linkedGoals: EntitySummary[] = [
  { id: 'g1', title: 'Goal one', type: 'goal', area: 'Wealth', status: 'Active' },
];

function renderPanel(overrides: Partial<Parameters<typeof TaskEditPanel>[0]> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  render(
    <TaskEditPanel
      task={makeTask()}
      isOpen
      onClose={onClose}
      onSave={onSave}
      dependencies={[]}
      blockedBy={[]}
      linkedProjects={linkedProjects.slice(0, 1)}
      linkedGoals={linkedGoals}
      availableTasks={[]}
      availableProjects={linkedProjects}
      availableGoals={linkedGoals}
      onDependencyAdd={vi.fn()}
      onDependencyRemove={vi.fn()}
      {...overrides}
    />
  );

  return { onSave, onClose };
}

describe('TaskEditPanel save', () => {
  afterEach(() => {
    cleanup();
  });

  it('includes selected projectIds and goalIds in the task PATCH payload', async () => {
    const user = userEvent.setup();
    const { onSave } = renderPanel();

    const titleInput = screen.getByLabelText('Title *');
    await user.clear(titleInput);
    await user.type(titleInput, 'My task edited');

    const saveButton = await screen.findByRole('button', { name: 'Save changes' });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({
        projectIds: ['p1'],
        goalIds: ['g1'],
      })
    );
  });
});

describe('TaskEditPanel polish', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Notes and Scheduled Date fields', () => {
    renderPanel();

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Scheduled Date')).toBeInTheDocument();
  });

  it('hydrates notes and scheduled date from task', () => {
    renderPanel({
      task: {
        ...makeTask(),
        notes: 'hello',
        scheduledDate: '2026-09-07T00:00:00Z',
      },
    });

    expect(screen.getByLabelText('Notes')).toHaveValue('hello');
    expect(screen.getByLabelText('Scheduled Date')).toHaveValue('2026-09-07');
  });

  it('enables Save when only notes change', async () => {
    const user = userEvent.setup();
    renderPanel({
      task: { ...makeTask(), notes: 'original' },
    });

    const saveButton = await screen.findByRole('button', { name: 'Save changes' });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Notes'), ' updated');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
    expect(saveButton).toBeEnabled();
  });

  it('sends notes null when notes cleared on save', async () => {
    const user = userEvent.setup();
    const { onSave } = renderPanel({
      task: { ...makeTask(), notes: 'remove me' },
    });

    const notesInput = screen.getByLabelText('Notes');
    await user.clear(notesInput);

    const saveButton = await screen.findByRole('button', { name: 'Save changes' });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({
        notes: null,
      })
    );
  });

  it('renders section headings for scanability', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Identity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Classification' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Context & Vibe' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Scheduling & Points' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dependencies' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Relationships' })).toBeInTheDocument();
  });

  it('disables Save changes until dirty', async () => {
    const user = userEvent.setup();
    renderPanel();

    const saveButton = await screen.findByRole('button', { name: 'Save changes' });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Title *'), ' updated');
    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
    expect(saveButton).toBeEnabled();
  });

  it('shows inline title error on empty submit', async () => {
    const user = userEvent.setup();
    renderPanel();

    const titleInput = screen.getByLabelText('Title *');
    await user.clear(titleInput);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('uses matching selected classes for energy and best-window chips', async () => {
    const user = userEvent.setup();
    renderPanel({
      task: {
        ...makeTask(),
        energyLevel: 'Deep Work',
        executionWindow: 'Morning Peak',
      },
    });

    const deepWork = screen.getByRole('button', { name: 'Deep Work' });
    const morningPeak = screen.getByRole('button', { name: 'Morning Peak' });
    expect(deepWork.className).toBe(morningPeak.className);
    expect(deepWork).toHaveAttribute('aria-pressed', 'true');
    expect(morningPeak).toHaveAttribute('aria-pressed', 'true');

    const admin = screen.getByRole('button', { name: 'Admin' });
    expect(admin.className).not.toBe(deepWork.className);
    expect(admin).toHaveAttribute('aria-pressed', 'false');

    await user.click(admin);
    expect(screen.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pins footer outside scroll body', () => {
    renderPanel();
    expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders with an unknown area without crashing subcategory map (da291a9e90d5)', () => {
    expect(() =>
      renderPanel({
        // API TaskResponse.area is a free string; legacy/AI values may not be Area keys
        task: { ...makeTask(), area: 'Career' as Task['area'], subCategory: null },
      })
    ).not.toThrow();

    expect(screen.getByLabelText('Sub-Category')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
  });

  it('renders when area is missing at runtime without crashing subcategory map', () => {
    expect(() =>
      renderPanel({
        task: { ...makeTask(), area: undefined as unknown as Task['area'] },
      })
    ).not.toThrow();

    expect(screen.getByLabelText('Sub-Category')).toBeInTheDocument();
  });
});
