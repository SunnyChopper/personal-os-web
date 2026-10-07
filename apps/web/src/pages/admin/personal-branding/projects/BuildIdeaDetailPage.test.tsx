import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { BrandProjectBuildKit, BrandProjectIdea } from '@/types/api/personal-branding.dto';
import BuildIdeaDetailPage from './BuildIdeaDetailPage';
import { ROUTES } from '@/routes';

const refetch = vi.fn();
const buildKitMutate = vi.fn();

const hookState = {
  isPending: false,
  isError: false,
  error: null as Error | null,
  data: undefined as BrandProjectIdea | null | undefined,
  refetch,
};

const mutationsState = {
  buildKit: { mutate: buildKitMutate, isPending: false, variables: undefined as string | undefined },
  jobQuery: { data: undefined },
  kitRevise: { mutate: vi.fn(), isPending: false, variables: undefined },
  applyKitRevision: { mutate: vi.fn(), isPending: false, error: null },
};

const reviseState = {
  mutateAsync: vi.fn(),
  isPending: false,
  error: null as Error | null,
};

const patchMutateAsync = vi.fn();

vi.mock('@/hooks/usePersonalBrandingProjects', () => ({
  useBrandProjectIdea: () => hookState,
  usePersonalBrandingProjectsMutations: () => mutationsState,
  useReviseBrandProjectIdea: () => reviseState,
  useBrandProjectBuildKitPatch: () => ({ mutateAsync: patchMutateAsync, isPending: false }),
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

const sampleKit: BrandProjectBuildKit = {
  setupPrompt: 'setup',
  cursorSkills: [],
  modules: [],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/personal-branding/projects/:ideaId" element={<BuildIdeaDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BuildIdeaDetailPage', () => {
  beforeEach(() => {
    hookState.isPending = false;
    hookState.isError = false;
    hookState.error = null;
    hookState.data = undefined;
    refetch.mockClear();
    buildKitMutate.mockClear();
    reviseState.isPending = false;
    reviseState.error = null;
    reviseState.mutateAsync.mockClear();
    patchMutateAsync.mockReset();
    patchMutateAsync.mockResolvedValue(undefined);
  });

  it('renders header, meta, brief, build kit section, and back link on success', () => {
    hookState.data = makeIdea({ appealSummary: 'Great hook' });
    renderAt('/admin/personal-branding/projects/idea-1');

    expect(screen.getByRole('heading', { name: 'Ship a CLI' })).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getByText(/Medium · 8h · Oct 1, 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to active ideas/i })).toHaveAttribute(
      'href',
      `${ROUTES.admin.personalBrandingProjects}?tab=active`
    );
    expect(screen.getByText('Why it works')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Build kit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate build kit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.queryByText('Refine is locked once a build kit exists.')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="BuildIdeaActionBar"]')).toBeInTheDocument();
  });

  it('shows stored kit in workspace without generate button', () => {
    hookState.data = makeIdea({ buildKit: sampleKit });
    renderAt('/admin/personal-branding/projects/idea-1');

    expect(screen.queryByRole('button', { name: /generate build kit/i })).not.toBeInTheDocument();
    expect(screen.getByText('setup')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy all/i })).toBeInTheDocument();
    expect(screen.getByText('Refine is locked once a build kit exists.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add skill' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add module' })).toBeInTheDocument();
  });

  it('patches a skill prompt through the detail page hook', async () => {
    hookState.data = makeIdea({
      buildKit: {
        ...sampleKit,
        cursorSkills: [{ name: 'My Skill', description: 'd', skillMarkdown: 'old' }],
      },
    });
    renderAt('/admin/personal-branding/projects/idea-1');

    fireEvent.click(screen.getByRole('button', { name: 'Edit My Skill' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Skill prompt' }), {
      target: { value: 'new prompt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(patchMutateAsync).toHaveBeenCalledWith([
        { op: 'updateSkill', name: 'My Skill', skillMarkdown: 'new prompt' },
      ]);
    });
  });

  it('shows not-found when idea is null', () => {
    hookState.data = null;
    renderAt('/admin/personal-branding/projects/missing');

    expect(screen.getByRole('heading', { name: /project idea not found/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Build kit' })).not.toBeInTheDocument();
  });

  it('shows retry on fetch error', () => {
    hookState.isError = true;
    hookState.error = new Error('Server error');
    renderAt('/admin/personal-branding/projects/idea-1');

    expect(screen.getByRole('alert')).toHaveTextContent('Server error');
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /project idea not found/i })).not.toBeInTheDocument();
  });

  it('disables generate while a revise is pending', () => {
    reviseState.isPending = true;
    hookState.data = makeIdea();
    renderAt('/admin/personal-branding/projects/idea-1');

    expect(screen.getByRole('button', { name: /generate build kit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Revising…' })).toBeDisabled();
  });

  it('shows loading without not-found heading', () => {
    hookState.isPending = true;
    renderAt('/admin/personal-branding/projects/idea-1');

    expect(screen.getByText(/loading project idea/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /project idea not found/i })).not.toBeInTheDocument();
  });
});
