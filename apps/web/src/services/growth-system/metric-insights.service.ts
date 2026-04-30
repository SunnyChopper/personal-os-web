import { getStorageAdapter } from '@/lib/storage';
import { generateId, randomDelay } from '@/mocks/storage';
import type { MetricInsight } from '@/types/growth-system';
import type { ApiResponse, ApiListResponse } from '@/types/api-contracts';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const metricInsightsService = {
  /**
   * Get cached insights for a metric
   */
  async getInsights(metricId: string): Promise<ApiListResponse<MetricInsight>> {
    await randomDelay();
    const storage = getStorageAdapter();
    const allInsights = await storage.getAll<MetricInsight>('metricInsights');
    const now = new Date().getTime();

    const validInsights = allInsights.filter(
      (insight) => insight.metricId === metricId && new Date(insight.expiresAt).getTime() > now
    );

    return {
      data: validInsights,
      total: validInsights.length,
      success: true,
    };
  },

  /**
   * Store insights in cache
   */
  async cacheInsight(insight: Omit<MetricInsight, 'id'>): Promise<ApiResponse<MetricInsight>> {
    await randomDelay();
    const storage = getStorageAdapter();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);

    const cachedInsight: MetricInsight = {
      id: generateId(),
      ...insight,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await storage.create('metricInsights', cachedInsight.id, cachedInsight);
    return {
      data: cachedInsight,
      success: true,
    };
  },

  /**
   * Cache multiple insights
   */
  async cacheInsights(
    insights: Array<Omit<MetricInsight, 'id' | 'cachedAt' | 'expiresAt'>>
  ): Promise<ApiResponse<MetricInsight[]>> {
    await randomDelay();
    const storage = getStorageAdapter();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);

    const cachedInsights: MetricInsight[] = insights.map((insight) => ({
      id: generateId(),
      ...insight,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }));

    for (const insight of cachedInsights) {
      await storage.create('metricInsights', insight.id, insight);
    }

    return {
      data: cachedInsights,
      success: true,
    };
  },

  /**
   * Invalidate cached insights for a metric (when new log is added)
   */
  async invalidateInsights(metricId: string): Promise<ApiResponse<void>> {
    await randomDelay();
    const storage = getStorageAdapter();
    const allInsights = await storage.getAll<MetricInsight>('metricInsights');

    for (const insight of allInsights.filter((i) => i.metricId === metricId)) {
      await storage.delete('metricInsights', insight.id);
    }

    return {
      data: undefined,
      success: true,
    };
  },

  /**
   * Get dashboard insights (aggregated for multiple metrics)
   */
  async getDashboardInsights(metricIds: string[]): Promise<ApiListResponse<MetricInsight>> {
    await randomDelay();
    const storage = getStorageAdapter();
    const allInsights = await storage.getAll<MetricInsight>('metricInsights');
    const now = new Date().getTime();

    const validInsights = allInsights.filter(
      (insight) =>
        metricIds.includes(insight.metricId) && new Date(insight.expiresAt).getTime() > now
    );

    // Sort by confidence and recency
    validInsights.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime();
    });

    return {
      data: validInsights.slice(0, 10), // Top 10 insights
      total: validInsights.length,
      success: true,
    };
  },

  /**
   * Check if insights need refresh
   */
  async needsRefresh(metricId: string): Promise<boolean> {
    await randomDelay();
    const storage = getStorageAdapter();
    const allInsights = await storage.getAll<MetricInsight>('metricInsights');
    const now = new Date().getTime();

    const validInsights = allInsights.filter(
      (insight) => insight.metricId === metricId && new Date(insight.expiresAt).getTime() > now
    );

    // Need refresh if no valid insights or insights are expiring soon (within 6 hours)
    if (validInsights.length === 0) return true;

    const sixHoursFromNow = now + 6 * 60 * 60 * 1000;
    return validInsights.some((insight) => new Date(insight.expiresAt).getTime() < sixHoursFromNow);
  },
};
