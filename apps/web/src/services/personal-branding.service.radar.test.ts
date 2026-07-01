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
    expect(apiClient.get).toHaveBeenCalledWith('/personal-branding/radar-items?page=1&pageSize=50');
  });

  it('saves a discovery suggestion as a source', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { id: 'src-2', name: 'Blog', sourceType: 'RSS', endpoint: 'https://blog.example/rss' },
    });
    await personalBrandingService.saveRadarDiscoverySuggestion({
      name: 'Blog',
      sourceType: 'RSS',
      endpoint: 'https://blog.example/rss',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/personal-branding/radar-discovery/suggestions/save',
      {
        name: 'Blog',
        sourceType: 'RSS',
        endpoint: 'https://blog.example/rss',
      }
    );
  });
});
