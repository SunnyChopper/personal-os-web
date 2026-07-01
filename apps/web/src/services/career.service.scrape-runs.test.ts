import { describe, it, expect, vi, beforeEach } from 'vitest';
import { careerService } from '@/services/career.service';
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

describe('careerService job scrape runs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists scrape runs with pagination query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 2, pageSize: 20, hasMore: false },
    });
    await careerService.listJobScrapeRuns({
      page: 2,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/career/resume/job-scrape-runs?page=2&pageSize=20&sortBy=createdAt&sortOrder=desc'
    );
  });

  it('starts a manual scrape run', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { runId: 'run-1', status: 'queued', trigger: 'manual' },
    });
    const res = await careerService.startJobScrapeRun({});
    expect(res.runId).toBe('run-1');
    expect(apiClient.post).toHaveBeenCalledWith('/career/resume/job-scrape-runs', {});
  });

  it('lists postings filtered by scrape run and fit status', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    await careerService.listJobPostings({
      scrapeRunId: 'run-abc',
      fitStatus: 'relevant',
      pageSize: 50,
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/career/resume/job-postings?pageSize=50&fitStatus=relevant&scrapeRunId=run-abc'
    );
  });
});
