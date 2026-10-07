import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type {
  BrandProjectBuildKit,
  BrandProjectIdea,
  BrandProjectJob,
  GenerateBrandProjectsInput,
  RadarItem,
} from '@/types/api/personal-branding.dto';
import ProjectsPage from './ProjectsPage';

const mutateGenerate = vi.fn();
const mutateBuildKit = vi.fn();

const sampleKit: BrandProjectBuildKit = {
  setupPrompt: 'setup prompt body',
  cursorSkills: [{ name: 'skill-a', description: 'd', skillMarkdown: 'skill body' }],
  modules: [{ order: 1, name: 'Mod', goal: 'goal', prompt: 'module prompt body', dependsOn: [] }],
  generatedAt: '2026-10-01T00:00:00.000Z',
};

function makeIdea(overrides: Partial<BrandProjectIdea> = {}): BrandProjectIdea {
  return {
    id: 'idea-1',
    title: 'Test idea',
    backgroundKnowledge: [],
    technologies: [],
    trendSources: [],
    status: 'generated',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

const listRefetch = vi.fn();

const hookState = {
  ideas: [] as BrandProjectIdea[],
  hasMore: false,
  listData: undefined as
    | { data: BrandProjectIdea[]; hasMore: boolean; total: number; page: number; pageSize: number }
    | undefined,
  listTotal: undefined as number | undefined,
  listIsPending: false,
  listIsError: false,
  listError: null as Error | null,
  generate: { mutate: mutateGenerate, isPending: false },
  reject: { mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() },
  complete: { mutate: vi.fn(), isPending: false },
  buildKit: {
    mutate: mutateBuildKit,
    isPending: false,
    variables: undefined as string | undefined,
  },
  activeJobId: null as string | null,
  activeJobFeature: 'projectIdeation' as 'projectIdeation' | 'projectBuildKit',
  activeJobReplayed: false,
  submittedCardCount: null as number | null,
  lastGenerateInput: null as GenerateBrandProjectsInput | null,
  jobQuery: { data: undefined as BrandProjectJob | undefined, isFetching: false },
};

const radarState = {
  rows: [] as RadarItem[],
  isPending: false,
  isError: false,
};

function radarItem(overrides: Partial<RadarItem> & Pick<RadarItem, 'id' | 'title'>): RadarItem {
  return {
    itemType: 'ARTICLE',
    relevanceScore: 0,
    matchedPillars: [],
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

vi.mock('@/hooks/usePersonalBrandingProjects', () => ({
  useBrandProjectIdeas: () => ({
    data:
      hookState.listData ??
      (hookState.listIsPending && hookState.listData === undefined
        ? undefined
        : {
            data: hookState.ideas,
            hasMore: hookState.hasMore,
            total: hookState.listTotal ?? hookState.ideas.length,
            page: 1,
            pageSize: 50,
          }),
    isPending: hookState.listIsPending,
    isError: hookState.listIsError,
    error: hookState.listError,
    refetch: listRefetch,
  }),
  useBrandProjectSettings: () => ({
    data: { autoEnabled: false, dailyCount: 5, startTime: '09:00' },
  }),
  usePersonalBrandingProjectsMutations: () => hookState,
}));

vi.mock('@/hooks/useSignalRadar', () => ({
  useSignalRadarItems: () => ({
    items: {
      data: {
        data: radarState.rows,
        total: radarState.rows.length,
        page: 1,
        pageSize: 50,
        hasMore: false,
      },
      isPending: radarState.isPending,
      isError: radarState.isError,
      error: null,
    },
  }),
}));

vi.mock('./BuildIdeasSettingsPanel', () => ({
  default: () => <div>Settings panel</div>,
}));

function ideationJob(
  overrides: Partial<BrandProjectJob> & Pick<BrandProjectJob, 'status'>
): BrandProjectJob {
  return {
    jobId: 'job-1',
    jobType: 'ideation',
    ideaIds: [],
    droppedDuplicateCount: 0,
    createdAt: '2026-10-03T00:00:00Z',
    ...overrides,
  };
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    mutateGenerate.mockClear();
    mutateBuildKit.mockReset();
    mutateBuildKit.mockImplementation(
      (_ideaId: string, options?: { onSuccess?: (data: { jobId: string }) => void }) => {
        options?.onSuccess?.({ jobId: 'job-kit-1' });
      }
    );
    hookState.ideas = [];
    hookState.hasMore = false;
    hookState.listData = undefined;
    hookState.listTotal = undefined;
    hookState.listIsPending = false;
    hookState.listIsError = false;
    hookState.listError = null;
    listRefetch.mockClear();
    hookState.generate.isPending = false;
    hookState.buildKit.isPending = false;
    hookState.buildKit.variables = undefined;
    hookState.activeJobId = null;
    hookState.activeJobFeature = 'projectIdeation';
    hookState.activeJobReplayed = false;
    hookState.submittedCardCount = null;
    hookState.lastGenerateInput = null;
    hookState.jobQuery = { data: undefined, isFetching: false };
    radarState.rows = [];
    radarState.isPending = false;
    radarState.isError = false;
  });

  it('labels the open-ideas tab Active', () => {
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: /today/i })).not.toBeInTheDocument();
  });

  it('renders generate action on active tab empty state', () => {
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /no open project ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate now/i })).toBeInTheDocument();
    expect(
      screen.queryByText(/Trend-grounded build-in-public ideas for X demos/i)
    ).not.toBeInTheDocument();
  });

  it('shows completed and rejected empty copy without generate', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('tab', { name: 'Completed' }));
    expect(screen.getByRole('heading', { name: /no completed projects/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate now/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Rejected' }));
    expect(screen.getByRole('heading', { name: /no rejected ideas/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate now/i })).not.toBeInTheDocument();
  });

  it('shows list loading skeleton instead of empty state', () => {
    hookState.listIsPending = true;
    hookState.listData = undefined;
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading project ideas')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /no open project ideas/i })
    ).not.toBeInTheDocument();
  });

  it('shows list error with retry that refetches', async () => {
    const user = userEvent.setup();
    hookState.listIsError = true;
    hookState.listError = new Error('Network down');
    hookState.listData = undefined;
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await user.click(screen.getByRole('button', { name: /^retry$/i }));
    expect(listRefetch).toHaveBeenCalled();
  });

  it('shows Active toolbar with open count and Generate now on one row', () => {
    hookState.ideas = [
      makeIdea({ id: 'idea-a', title: 'Alpha' }),
      makeIdea({ id: 'idea-b', title: 'Beta' }),
    ];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    const toolbar = screen.getByTestId('active-ideas-toolbar');
    expect(within(toolbar).getByText('2 open')).toBeInTheDocument();
    expect(within(toolbar).getByRole('button', { name: /generate now/i })).toBeInTheDocument();
    expect(within(toolbar).queryByRole('link')).not.toBeInTheDocument();
    const chrome = screen.getByTestId('active-ideas-chrome');
    expect(chrome.className).toContain('sticky');
    expect(chrome).toContainElement(toolbar);
  });

  it('orders sticky chrome toolbar then job banner then ideas grid', () => {
    hookState.ideas = [makeIdea()];
    hookState.activeJobId = 'job-1';
    hookState.jobQuery = {
      data: ideationJob({ status: 'running' }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    const chrome = screen.getByTestId('active-ideas-chrome');
    const toolbar = screen.getByTestId('active-ideas-toolbar');
    const banner = screen.getByTestId('generation-job-banner');
    const grid = screen.getByTestId('project-ideas-grid');
    expect(chrome).toContainElement(toolbar);
    expect(chrome).toContainElement(banner);
    expect(toolbar.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(banner.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('items-stretch');
  });

  it('uses API total for open count when the page is truncated', () => {
    hookState.ideas = Array.from({ length: 50 }, (_, index) =>
      makeIdea({ id: `idea-${index}`, title: `Idea ${index}` })
    );
    hookState.hasMore = true;
    hookState.listTotal = 72;
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('72 open')).toBeInTheDocument();
  });

  it('shows singular open count for one idea', () => {
    hookState.ideas = [makeIdea()];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('1 open')).toBeInTheDocument();
  });

  it('links Active cards to the idea detail route', () => {
    hookState.ideas = [makeIdea({ id: 'idea-abc', title: 'Test idea' })];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Test idea' })).toHaveAttribute(
      'href',
      '/admin/personal-branding/projects/idea-abc'
    );
  });

  it('links Completed tab cards to the detail route', async () => {
    const user = userEvent.setup();
    hookState.ideas = [makeIdea({ id: 'idea-done', status: 'completed', title: 'Done idea' })];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole('tab', { name: 'Completed' }));
    expect(screen.getByRole('link', { name: 'Done idea' })).toHaveAttribute(
      'href',
      '/admin/personal-branding/projects/idea-done'
    );
  });

  it('does not show open count toolbar when Active list is empty', () => {
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('active-ideas-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/0 open/i)).not.toBeInTheDocument();
  });

  it('does not show open count on Completed tab', async () => {
    const user = userEvent.setup();
    hookState.ideas = [makeIdea({ status: 'completed' })];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole('tab', { name: 'Completed' }));
    expect(screen.queryByTestId('active-ideas-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ open/i)).not.toBeInTheDocument();
  });

  it('renders ideation status outside the ideas grid', () => {
    hookState.ideas = [makeIdea()];
    hookState.activeJobId = 'job-1';
    hookState.jobQuery = {
      data: ideationJob({ status: 'running' }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    const grid = screen.getByTestId('project-ideas-grid');
    expect(within(grid).queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('generation-job-banner')).toHaveTextContent(
      'Generation in progress…'
    );
  });

  it('shows truncation note when hasMore is true', () => {
    hookState.ideas = Array.from({ length: 50 }, (_, index) =>
      makeIdea({ id: `idea-${index}`, title: `Idea ${index}` })
    );
    hookState.hasMore = true;
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/showing the 50 most recent\. older ideas are not listed/i)
    ).toBeInTheDocument();
  });

  it('coerces unknown tab query to active with generate visible', () => {
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=nope']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /generate now/i })).toBeInTheDocument();
  });

  it('disables Generate now while ideation job is running', () => {
    hookState.activeJobId = 'job-1';
    hookState.jobQuery = {
      data: ideationJob({ status: 'running' }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /generate now/i })).toBeDisabled();
    expect(screen.getByTestId('generation-job-banner')).toHaveTextContent(
      'Generation in progress…'
    );
  });

  it('keeps Generate now enabled between poll fetches when job is terminal', () => {
    hookState.jobQuery = {
      data: ideationJob({ status: 'succeeded', ideaIds: ['a'] }),
      isFetching: true,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /generate now/i })).toBeEnabled();
    expect(screen.getByTestId('generation-job-banner')).toHaveTextContent('1 idea added.');
  });

  it('shows failure with retry', async () => {
    const user = userEvent.setup();
    hookState.jobQuery = {
      data: ideationJob({
        status: 'failed',
        error: 'No trend items available for project ideation',
      }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('generation-job-banner')).toHaveTextContent(
      'No trend items available for project ideation'
    );
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(mutateGenerate).toHaveBeenCalledWith({ count: 5 });
  });

  it('dismisses terminal success banner', async () => {
    const user = userEvent.setup();
    hookState.jobQuery = {
      data: ideationJob({ status: 'succeeded', ideaIds: ['a', 'b', 'c'] }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('generation-job-banner')).toHaveTextContent('3 ideas added.');
    await user.click(screen.getByRole('button', { name: /dismiss generation result/i }));
    expect(screen.queryByTestId('generation-job-banner')).not.toBeInTheDocument();
  });

  it('dismisses failure banner', async () => {
    const user = userEvent.setup();
    hookState.jobQuery = {
      data: ideationJob({ status: 'failed', error: 'Generation failed.' }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /dismiss generation result/i }));
    expect(screen.queryByTestId('generation-job-banner')).not.toBeInTheDocument();
  });

  it('does not offer dismiss while ideation is in flight', () => {
    hookState.activeJobId = 'job-1';
    hookState.jobQuery = {
      data: ideationJob({ status: 'running' }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(
      screen.queryByRole('button', { name: /dismiss generation result/i })
    ).not.toBeInTheDocument();
  });

  it('does not show ideation status when a kit job is polling', () => {
    hookState.activeJobFeature = 'projectBuildKit';
    hookState.jobQuery = {
      data: {
        jobId: 'kit-job',
        jobType: 'kit',
        status: 'running',
        ideaIds: [],
        droppedDuplicateCount: 0,
        createdAt: '2026-10-03T00:00:00Z',
      },
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate now/i })).toBeEnabled();
  });

  it('active scan cards link to detail and omit build kit actions', () => {
    hookState.ideas = [makeIdea({ buildKit: sampleKit })];

    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Test idea' })).toHaveAttribute(
      'href',
      '/admin/personal-branding/projects/idea-1'
    );
    expect(screen.queryByRole('button', { name: /generate build kit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view build kit/i })).not.toBeInTheDocument();
  });

  it('links View build kit to the detail page on completed tab', async () => {
    hookState.ideas = [
      makeIdea({
        status: 'completed',
        buildKit: sampleKit,
        completion: {
          completedAt: '2026-10-01T00:00:00.000Z',
          postLinks: [{ platform: 'x', url: 'https://x.com/post/1' }],
        },
      }),
    ];

    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=completed']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /view build kit/i })).toHaveAttribute(
      'href',
      '/admin/personal-branding/projects/idea-1#build-kit'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('setup prompt body')).not.toBeInTheDocument();
  });

  it('reject modal does not mutate without feedback; mutates with feedback and category', async () => {
    const user = userEvent.setup();
    const rejectMutate = vi.fn();
    hookState.ideas = [makeIdea()];
    hookState.reject = { mutate: rejectMutate, isPending: false, error: null, reset: vi.fn() };

    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /^reject$/i }));
    expect(screen.getByRole('heading', { name: /reject project idea/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Too complex' }));
    const submitReject = screen.getByRole('button', { name: /reject idea/i });
    expect(submitReject).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'Not shareable enough');
    expect(submitReject).not.toBeDisabled();

    await user.click(submitReject);
    expect(rejectMutate).toHaveBeenCalledWith(
      {
        ideaId: 'idea-1',
        feedbackText: 'Not shareable enough',
        feedbackCategory: 'too_complex',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('opens a trend picker and does not start a job on cancel', async () => {
    const user = userEvent.setup();
    radarState.rows = [radarItem({ id: 'high', title: 'High signal', aiRelevanceScore: 0.9 })];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /generate now/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose trend cards' });
    expect(mutateGenerate).not.toHaveBeenCalled();
    expect(
      await within(dialog).findByRole('checkbox', { name: 'Select High signal' })
    ).toBeChecked();

    await user.click(within(dialog).getByRole('button', { name: 'Clear' }));
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(mutateGenerate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirms selected radar cards with the daily count', async () => {
    const user = userEvent.setup();
    radarState.rows = [
      radarItem({ id: 'low', title: 'Low signal', aiRelevanceScore: 0.2 }),
      radarItem({ id: 'high', title: 'High signal', aiRelevanceScore: 0.9 }),
    ];
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /generate now/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose trend cards' });
    expect(
      await within(dialog).findByRole('checkbox', { name: 'Select High signal' })
    ).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    expect(mutateGenerate).toHaveBeenCalledWith({
      count: 5,
      radarItemIds: ['high', 'low'],
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('retries the last submitted card payload', async () => {
    const user = userEvent.setup();
    hookState.lastGenerateInput = { count: 5, radarItemIds: ['high', 'low'] };
    hookState.jobQuery = {
      data: ideationJob({ status: 'failed', error: 'Generation failed.' }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(mutateGenerate).toHaveBeenCalledWith({
      count: 5,
      radarItemIds: ['high', 'low'],
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the cards used on the job banner', () => {
    hookState.ideas = [makeIdea()];
    hookState.submittedCardCount = 7;
    hookState.jobQuery = {
      data: ideationJob({ status: 'succeeded', ideaIds: ['a', 'b', 'c'] }),
      isFetching: false,
    };
    render(
      <MemoryRouter initialEntries={['/admin/personal-branding/projects?tab=active']}>
        <ProjectsPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('generation-job-banner')).toHaveTextContent(
      '3 ideas added from 7 cards.'
    );
  });
});
