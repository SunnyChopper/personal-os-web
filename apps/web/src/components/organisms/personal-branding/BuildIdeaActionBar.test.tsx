import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type {
  BrandProjectBuildKit,
  BrandProjectIdea,
  BrandProjectJob,
} from '@/types/api/personal-branding.dto';
import BuildIdeaActionBar from './BuildIdeaActionBar';
import { ROUTES } from '@/routes';

const navigate = vi.fn();
const buildKitMutate = vi.fn();
const rejectMutate = vi.fn();
const completeMutate = vi.fn();

const sampleKit: BrandProjectBuildKit = {
  setupPrompt: 'setup',
  cursorSkills: [],
  modules: [],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

const hookState = {
  reject: { mutate: rejectMutate, isPending: false, error: null, reset: vi.fn() },
  complete: { mutate: completeMutate, isPending: false },
  buildKit: {
    mutate: buildKitMutate,
    isPending: false,
    variables: undefined as string | undefined,
  },
  jobQuery: { data: undefined as BrandProjectJob | undefined },
};

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/hooks/usePersonalBrandingProjects', () => ({
  usePersonalBrandingProjectsMutations: () => hookState,
}));

vi.mock('@/hooks/useTerminalJobFailureAlert', () => ({
  useTerminalJobFailureAlert: vi.fn(),
}));

function makeIdea(overrides: Partial<BrandProjectIdea> = {}): BrandProjectIdea {
  return {
    id: 'idea-1',
    title: 'Ship a CLI',
    status: 'generated',
    difficulty: 'Medium',
    estimatedHours: 8,
    generatedForDate: '2026-10-01',
    backgroundKnowledge: [],
    technologies: [],
    trendSources: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderBar(idea: BrandProjectIdea) {
  return render(
    <MemoryRouter>
      <BuildIdeaActionBar idea={idea} />
    </MemoryRouter>
  );
}

describe('BuildIdeaActionBar', () => {
  beforeEach(() => {
    navigate.mockClear();
    buildKitMutate.mockClear();
    rejectMutate.mockClear();
    completeMutate.mockClear();
    hookState.buildKit.isPending = false;
    hookState.buildKit.variables = undefined;
    hookState.jobQuery.data = undefined;
  });

  it('shows Reject, Mark complete, and Generate build kit for generated ideas without a kit', () => {
    renderBar(makeIdea());
    expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate build kit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view build kit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /un-reject/i })).not.toBeInTheDocument();
  });

  it('shows View build kit instead of Generate when buildKit exists', () => {
    renderBar(makeIdea({ buildKit: sampleKit }));
    expect(screen.getByRole('button', { name: /view build kit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate build kit/i })).not.toBeInTheDocument();
  });

  it('scrolls to #build-kit when View build kit is clicked', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const el = document.createElement('section');
    el.id = 'build-kit';
    el.scrollIntoView = scrollIntoView;
    document.body.appendChild(el);

    renderBar(makeIdea({ buildKit: sampleKit }));
    await user.click(screen.getByRole('button', { name: /view build kit/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    el.remove();
  });

  it('disables all controls while kit job is running', () => {
    hookState.buildKit.isPending = true;
    hookState.buildKit.variables = 'idea-1';
    renderBar(makeIdea());
    expect(screen.getByRole('button', { name: /^reject$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('shows inline job error and re-enables Generate after failure', async () => {
    const user = userEvent.setup();
    buildKitMutate.mockImplementation((_id, opts) => {
      opts?.onSuccess?.({ jobId: 'job-1' });
    });
    hookState.jobQuery.data = {
      jobId: 'job-1',
      jobType: 'kit',
      status: 'failed',
      ideaIds: [],
      droppedDuplicateCount: 0,
      error: 'Worker blew up',
      createdAt: '2026-10-01T00:00:00.000Z',
    };
    renderBar(makeIdea());
    await user.click(screen.getByRole('button', { name: /generate build kit/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Worker blew up');
    expect(screen.getByRole('button', { name: /generate build kit/i })).toBeEnabled();
  });

  it('navigates to active tab after reject success', async () => {
    const user = userEvent.setup();
    rejectMutate.mockImplementation((_args, opts) => {
      opts?.onSuccess?.();
    });
    renderBar(makeIdea());
    await user.click(screen.getByRole('button', { name: /^reject$/i }));
    await user.click(screen.getByRole('button', { name: 'Too complex' }));
    await user.type(screen.getByRole('textbox'), 'Too hard');
    await user.click(screen.getByRole('button', { name: /reject idea/i }));
    expect(navigate).toHaveBeenCalledWith(`${ROUTES.admin.personalBrandingProjects}?tab=active`);
  });

  it('navigates to active tab after complete success', async () => {
    const user = userEvent.setup();
    completeMutate.mockImplementation((_args, opts) => {
      opts?.onSuccess?.();
    });
    renderBar(makeIdea());
    await user.click(screen.getByRole('button', { name: /mark complete/i }));
    await user.type(screen.getAllByPlaceholderText('https://')[0], 'https://x.com/post/1');
    await user.click(screen.getByRole('button', { name: /save links/i }));
    expect(navigate).toHaveBeenCalledWith(`${ROUTES.admin.personalBrandingProjects}?tab=active`);
  });

  it('starts build kit mutation on Generate', async () => {
    const user = userEvent.setup();
    renderBar(makeIdea());
    await user.click(screen.getByRole('button', { name: /generate build kit/i }));
    expect(buildKitMutate).toHaveBeenCalledWith(
      'idea-1',
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
