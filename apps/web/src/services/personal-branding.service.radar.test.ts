import { describe, it, expect, vi, beforeEach } from 'vitest';
import { personalBrandingService } from '@/services/personal-branding.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

describe('personalBrandingService signal radar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists radar sources with pagination query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 2, pageSize: 25, hasMore: false },
    });
    await personalBrandingService.listRadarSources(2, 25);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/personal-branding/radar-sources?page=2&pageSize=25'
    );
  });

  it('creates a radar source with write-only secret token', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { id: 'src-1', name: 'HN', sourceType: 'RSS', endpoint: 'https://example.com/feed' },
    });
    await personalBrandingService.createRadarSource({
      name: 'HN',
      sourceType: 'RSS',
      endpoint: 'https://example.com/feed',
      secretToken: 'tok',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/radar-sources', {
      name: 'HN',
      sourceType: 'RSS',
      endpoint: 'https://example.com/feed',
      secretToken: 'tok',
    });
  });

  it('updates radar settings with sync cadence and Tavily key', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: {
        syncCadence: 'DAILY',
        hasTavilyKey: true,
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      },
    });
    await personalBrandingService.updateRadarSettings({
      syncCadence: 'DAILY',
      tavilyApiKey: 'tvly-key',
    });
    expect(apiClient.put).toHaveBeenCalledWith('/personal-branding/radar-settings', {
      syncCadence: 'DAILY',
      tavilyApiKey: 'tvly-key',
    });
  });

  it('starts a manual radar ingest run', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { runId: 'run-1', status: 'queued', trigger: 'manual' },
    });
    const res = await personalBrandingService.startRadarRun();
    expect(res.runId).toBe('run-1');
    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/radar-runs', {});
  });

  it('lists radar items with pagination', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    await personalBrandingService.listRadarItems(1, 50);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/personal-branding/radar-items?page=1&pageSize=50&includeFiltered=false'
    );
  });

  it('lists radar items with includeFiltered query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    await personalBrandingService.listRadarItems(1, 50, true);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/personal-branding/radar-items?page=1&pageSize=50&includeFiltered=true'
    );
  });

  it('creates a GitHub radar source with githubConfig', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        id: 'src-gh',
        name: 'LangGraph',
        sourceType: 'GITHUB_REPO',
        endpoint: 'https://github.com/langchain-ai/langgraph',
      },
    });
    await personalBrandingService.createRadarSource({
      name: 'LangGraph',
      sourceType: 'GITHUB_REPO',
      endpoint: 'https://github.com/langchain-ai/langgraph',
      githubConfig: {
        owner: 'langchain-ai',
        repo: 'langgraph',
        eventTypes: ['COMMITS', 'RELEASES'],
        releaseFilter: 'MAJOR_ONLY',
        aiFilterEnabled: true,
      },
    });
    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/radar-sources', {
      name: 'LangGraph',
      sourceType: 'GITHUB_REPO',
      endpoint: 'https://github.com/langchain-ai/langgraph',
      githubConfig: {
        owner: 'langchain-ai',
        repo: 'langgraph',
        eventTypes: ['COMMITS', 'RELEASES'],
        releaseFilter: 'MAJOR_ONLY',
        aiFilterEnabled: true,
      },
    });
  });

  it('updates radar item relevance', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      data: {
        id: 'item-1',
        itemType: 'ARTICLE',
        title: 'Promo',
        relevanceScore: 0,
        userRelevant: false,
        userId: 'u1',
        createdAt: '',
        matchedPillars: [],
      },
    });
    const res = await personalBrandingService.updateRadarItemRelevance('item-1', false);
    expect(res.userRelevant).toBe(false);
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/personal-branding/radar-items/item-1/relevance',
      { relevant: false }
    );
  });

  it('starts durable discovery with profile pillars and custom topics', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: {
        runId: 'discovery-1',
        status: 'queued',
        phase: 'queued',
        progress: {
          queriesTotal: 0,
          queriesCompleted: 0,
          candidatesDiscovered: 0,
          candidatesEvaluated: 0,
          candidatesRelevant: 0,
          candidatesNotRelevant: 0,
          candidatesFailed: 0,
        },
        effectiveTopics: [],
        profileNames: [],
        createdAt: '',
        updatedAt: '',
      },
    });
    const body = {
      profileSelections: [{ profileId: 'profile-1', pillars: ['AI systems'] }],
      customTopics: ['Durable agents'],
    };

    await personalBrandingService.startRadarDiscoveryRun(body);

    expect(apiClient.post).toHaveBeenCalledWith('/personal-branding/radar-discovery/runs', body);
  });

  it('lists discovery history and filtered candidates with camelCase pagination', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 2, pageSize: 20, hasMore: false },
    });

    await personalBrandingService.listRadarDiscoveryRuns(2, 20);
    await personalBrandingService.listRadarDiscoveryCandidates('run-1', 3, 10, {
      verdict: 'relevant',
      status: 'completed',
    });

    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      '/personal-branding/radar-discovery/runs?page=2&pageSize=20'
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(
      2,
      '/personal-branding/radar-discovery/runs/run-1/candidates?page=3&pageSize=10&status=completed&verdict=relevant'
    );
  });

  it.each(['pause', 'resume', 'cancel'] as const)(
    'posts to the %s discovery control endpoint',
    async (action) => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'run-1', status: action === 'resume' ? 'running' : `${action}d` },
      });

      await personalBrandingService[
        action === 'pause'
          ? 'pauseRadarDiscoveryRun'
          : action === 'resume'
            ? 'resumeRadarDiscoveryRun'
            : 'cancelRadarDiscoveryRun'
      ]('run-1');

      expect(apiClient.post).toHaveBeenCalledWith(
        `/personal-branding/radar-discovery/runs/run-1/${action}`,
        {}
      );
    }
  );

  it('saves a durable discovery candidate as a source', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { id: 'src-2', name: 'Blog', sourceType: 'RSS', endpoint: 'https://blog.example/rss' },
    });
    await personalBrandingService.saveRadarDiscoveryCandidate('run-1', 'candidate-2');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/personal-branding/radar-discovery/runs/run-1/candidates/candidate-2/save',
      {}
    );
  });
});
