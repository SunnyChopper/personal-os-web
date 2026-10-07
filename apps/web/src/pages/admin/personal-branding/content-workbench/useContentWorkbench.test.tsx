import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { ContentIdeationJob, ContentIdea } from '@/types/api/personal-branding.dto';
import { personalBrandingService } from '@/services/personal-branding.service';
import { useContentWorkbench } from './useContentWorkbench';

const emptyPage = { data: [], total: 0, page: 1, pageSize: 50, hasMore: false };

const { listContentNodes, listContentIdeas, listProfiles, getContentNode, rejectContentIdea } =
  vi.hoisted(() => ({
    listContentNodes: vi.fn(),
    listContentIdeas: vi.fn(),
    listProfiles: vi.fn(),
    getContentNode: vi.fn(),
    rejectContentIdea: vi.fn(),
  }));

const ideationTerminals = new Set<(job: ContentIdeationJob) => void>();

vi.mock('@/hooks/useContentIdeationJob', () => ({
  useContentIdeationJob: vi.fn((_jobId, onTerminal) => {
    if (onTerminal) ideationTerminals.add(onTerminal);
    return { data: undefined };
  }),
}));

vi.mock('@/hooks/useContentIdeaApproveJob', () => ({
  useContentIdeaApproveJob: vi.fn(),
}));

vi.mock('@/hooks/useContentImageInjectJob', () => ({
  useContentImageInjectJob: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@/hooks/useKeywordOptimizationJob', () => ({
  useKeywordOptimizationJob: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@/hooks/personal-branding/useIdeationEngineAIModelPicker', () => ({
  useIdeationEngineAIModelPicker: vi.fn(() => ({
    catalog: [],
    isCatalogLoading: false,
    picker: { provider: 'openai', model: 'gpt-4' },
    setPicker: vi.fn(),
    resolveApiModel: vi.fn(),
  })),
}));

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    listContentNodes,
    listContentIdeas,
    listProfiles,
    getContentNode,
    createContentNode: vi.fn(),
    updateContentNode: vi.fn(),
    deleteContentNode: vi.fn(),
    approveContentIdea: vi.fn(),
    rejectContentIdea,
    generateContentIdeas: vi.fn(),
    generateVaultExtractedIdeas: vi.fn(),
    generateAssetPrompts: vi.fn(),
    finishContent: vi.fn(),
    lengthenContent: vi.fn(),
    formatContent: vi.fn(),
    generateDraft: vi.fn(),
    injectContentImages: vi.fn(),
    startKeywordOptimizationJob: vi.fn(),
  },
}));

function makeGeneratedIdea(overrides: Partial<ContentIdea> = {}): ContentIdea {
  return {
    id: 'idea-1',
    title: 'Test idea',
    contentType: 'DEEP_DIVE_BLOG',
    sourceType: 'ON_DEMAND_AI',
    tags: [],
    status: 'GENERATED',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function wrap(initialEntry: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    client,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter initialEntries={[initialEntry]}>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </MemoryRouter>
      );
    },
  };
}

describe('useContentWorkbench export contract (f590a9b425aa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ideationTerminals.clear();
    listContentNodes.mockResolvedValue(emptyPage);
    listContentIdeas.mockResolvedValue(emptyPage);
    listProfiles.mockResolvedValue({
      success: true,
      data: emptyPage,
    });
  });

  it('exports trendIdeasQ with boolean isPending and openDraftFromIdea on default tab', async () => {
    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));

    expect(result.current.trendIdeasQ).toBeDefined();
    expect(typeof result.current.trendIdeasQ.isPending).toBe('boolean');
    expect(typeof result.current.openDraftFromIdea).toBe('function');
  });

  it('exports a dirty-marking content type setter', async () => {
    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));

    act(() => {
      result.current.setContentType('SOCIAL_THREAD');
    });

    expect(result.current.contentType).toBe('SOCIAL_THREAD');
    expect(result.current.isDirty).toBe(true);
  });

  it('sends the Vault image-search flag without changing Ideation Engine state', async () => {
    vi.mocked(personalBrandingService.generateVaultExtractedIdeas).mockResolvedValue({
      jobId: 'vault-job-1',
      status: 'queued',
      pollAfterMs: 2000,
      countEffective: 6,
    });
    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));
    act(() => {
      result.current.setSelectedProfileId('profile-1');
      result.current.setSelectedVaultItemIds(['note-1']);
      result.current.setVaultEnableImageSearch(true);
    });
    await act(async () => {
      await result.current.generateVaultIdeasMutation.mutateAsync();
    });

    expect(personalBrandingService.generateVaultExtractedIdeas).toHaveBeenCalledWith({
      brandProfileId: 'profile-1',
      vaultItemIds: ['note-1'],
      targetPlatform: 'linkedin',
      enableImageSearch: true,
    });
    expect(result.current.vaultEnableImageSearch).toBe(true);
    expect(result.current.enableImageSearch).toBe(false);
  });

  it('exports trendIdeasQ when deep-linked to trend-ideas tab', async () => {
    const { Wrapper } = wrap('/admin/personal-branding/workbench?tab=trend-ideas');
    const { result } = renderHook(() => useContentWorkbench(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.ideasQ.isSuccess).toBe(true));
    await waitFor(() => expect(listContentIdeas).toHaveBeenCalledWith(1, 50, 'DRAFTED'));

    expect(result.current.activeTab).toBe('trend-ideas');
    expect(result.current.trendIdeasQ).toBeDefined();
    expect(typeof result.current.trendIdeasQ.isPending).toBe('boolean');
    expect(typeof result.current.openDraftFromIdea).toBe('function');
    expect(typeof result.current.openDraftFromLibrary).toBe('function');
  });

  it('openDraftFromLibrary switches to sandbox and loads the node', async () => {
    const node = {
      id: 'node-abc',
      title: 'Library pick',
      body: 'Body',
      status: 'DRAFT' as const,
      sourceType: 'MANUAL' as const,
      contentType: 'DEEP_DIVE_BLOG' as const,
      platform: null,
      tags: [] as string[],
      pillars: [] as string[],
      userId: 'user-1',
      createdAt: '2026-08-01T12:00:00.000Z',
      updatedAt: '2026-08-09T12:00:00.000Z',
    };

    listContentNodes.mockResolvedValue({
      data: [node],
      total: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });

    const { Wrapper } = wrap('/admin/personal-branding/workbench?tab=ideation');
    const { result } = renderHook(() => useContentWorkbench(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));
    expect(result.current.activeTab).toBe('ideation');

    result.current.openDraftFromLibrary(node);

    await waitFor(() => expect(result.current.activeTab).toBe('sandbox'));
    expect(result.current.activeDraftId).toBe('node-abc');
    expect(result.current.editorTitle).toBe('Library pick');
    expect(getContentNode).not.toHaveBeenCalled();
  });

  it('cancelIdeationJob sets cancelled state', async () => {
    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));

    act(() => {
      result.current.cancelIdeationJob();
    });

    expect(result.current.ideationClientCancelState).toBe('cancelled');
  });
});

describe('useContentWorkbench live region messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ideationTerminals.clear();
    listContentNodes.mockResolvedValue(emptyPage);
    listContentIdeas.mockResolvedValue(emptyPage);
    listProfiles.mockResolvedValue({
      success: true,
      data: emptyPage,
    });
  });

  it('sets ideationLiveMessage when ideation job succeeds', async () => {
    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));
    await waitFor(() => expect(ideationTerminals.size).toBeGreaterThanOrEqual(2));

    const [ideationTerminal] = [...ideationTerminals];

    act(() => {
      ideationTerminal({
        jobId: 'job-ideation',
        status: 'succeeded',
        result: {
          ideas: [{ id: 'idea-1' }, { id: 'idea-2' }, { id: 'idea-3' }],
          contextStats: {
            existingGeneratedCount: 0,
            rejectedFeedbackCount: 0,
            referencedPublishedCount: 0,
          },
        },
      } as ContentIdeationJob);
    });

    await waitFor(() => expect(result.current.ideationLiveMessage).toBe('3 new ideas ready'));
  });

  it('sets vaultLiveMessage when vault job succeeds', async () => {
    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));
    await waitFor(() => expect(ideationTerminals.size).toBeGreaterThanOrEqual(2));

    const terminals = [...ideationTerminals];
    const vaultTerminal = terminals[terminals.length - 1];

    act(() => {
      vaultTerminal({
        jobId: 'job-vault',
        status: 'succeeded',
        result: {
          ideas: [{ id: 'idea-1' }],
          contextStats: {
            existingGeneratedCount: 0,
            rejectedFeedbackCount: 0,
            referencedPublishedCount: 0,
          },
        },
      } as ContentIdeationJob);
    });

    await waitFor(() => expect(result.current.vaultLiveMessage).toBe('1 new idea ready'));
  });

  it('sets aiToolLiveMessage when finish content succeeds', async () => {
    vi.mocked(personalBrandingService.finishContent).mockResolvedValue({ body: 'Finished body' });

    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.contentQ.isSuccess).toBe(true));

    act(() => {
      result.current.finishContentMutation.mutate();
    });

    await waitFor(() =>
      expect(result.current.aiToolLiveMessage).toBe('Content updated by AI tool')
    );
    expect(result.current.editorBody).toBe('Finished body');
  });
});

describe('useContentWorkbench rejectIdeaMutation optimistic updates', () => {
  const generatedIdeasQueryKey = queryKeys.personalBranding.ideas.list(1, 50, 'GENERATED');

  beforeEach(() => {
    vi.clearAllMocks();
    ideationTerminals.clear();
    listContentNodes.mockResolvedValue(emptyPage);
    listProfiles.mockResolvedValue({
      success: true,
      data: emptyPage,
    });
    rejectContentIdea.mockResolvedValue(undefined);
  });

  it('removes the idea from cache and closes the modal before the API resolves', async () => {
    const idea = makeGeneratedIdea();
    const ideasPage = { data: [idea], total: 1, page: 1, pageSize: 50, hasMore: false };
    listContentIdeas.mockResolvedValue(ideasPage);

    let resolveReject!: () => void;
    rejectContentIdea.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveReject = resolve;
        })
    );

    const { client, Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.ideasQ.isSuccess).toBe(true));
    expect(result.current.ideas).toHaveLength(1);

    act(() => {
      result.current.setRejectingIdea(idea);
    });
    expect(result.current.rejectingIdea?.id).toBe('idea-1');

    act(() => {
      result.current.rejectIdeaMutation.mutate({ ideaId: idea.id, feedbackText: null });
    });

    await waitFor(() => expect(result.current.rejectingIdea).toBeNull());
    expect(result.current.ideas).toHaveLength(0);
    expect(client.getQueryData(generatedIdeasQueryKey)).toMatchObject({ data: [], total: 0 });

    resolveReject();
    await waitFor(() =>
      expect(rejectContentIdea).toHaveBeenCalledWith('idea-1', {
        feedbackText: undefined,
        feedbackCategory: undefined,
      })
    );
  });

  it('restores the previous cache when reject fails', async () => {
    const idea = makeGeneratedIdea();
    const ideasPage = { data: [idea], total: 1, page: 1, pageSize: 50, hasMore: false };
    listContentIdeas.mockResolvedValue(ideasPage);
    rejectContentIdea.mockRejectedValue(new Error('Reject failed'));

    const { Wrapper } = wrap('/admin/personal-branding/workbench');
    const { result } = renderHook(() => useContentWorkbench(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.ideasQ.isSuccess).toBe(true));

    act(() => {
      result.current.setRejectingIdea(idea);
      result.current.rejectIdeaMutation.mutate({ ideaId: idea.id, feedbackText: 'Too generic' });
    });

    await waitFor(() => expect(result.current.rejectIdeaMutation.isError).toBe(true));
    expect(result.current.ideas).toHaveLength(1);
    expect(result.current.ideas[0]?.id).toBe('idea-1');
  });
});
