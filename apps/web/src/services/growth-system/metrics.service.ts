import { apiClient } from '@/lib/api-client';
import type {
  Metric,
  MetricLog,
  MetricStatus,
  CreateMetricInput,
  UpdateMetricInput,
  CreateMetricLogInput,
} from '@/types/growth-system';
import type { ApiResponse, ApiListResponse } from '@/types/api-contracts';

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Backend metric log format (API returns 'note' instead of 'notes')
interface BackendMetricLog {
  id: string;
  metricId: string;
  value: number;
  loggedAt: string;
  note: string | null; // API uses 'note' (singular)
  createdAt: string;
}

// Backend metric format (may include logs and isActive instead of status)
interface BackendMetric extends Omit<Metric, 'logs' | 'status'> {
  logs?: BackendMetricLog[] | null;
  isActive?: boolean; // Backend uses isActive boolean instead of status
  status?: MetricStatus; // May also have status field (for backwards compatibility)
}

// Normalize backend metric log to frontend format
function normalizeMetricLog(log: BackendMetricLog, metricUserId: string): MetricLog {
  return {
    id: log.id,
    metricId: log.metricId,
    value: log.value,
    notes: log.note, // Map 'note' to 'notes'
    loggedAt: log.loggedAt,
    userId: metricUserId, // Use metric's userId if not provided in log
    createdAt: log.createdAt,
  };
}

// Normalize backend metric to frontend format
function normalizeMetric(metric: BackendMetric): Metric {
  // Map isActive boolean to status string
  let status: MetricStatus = 'Active';
  if (metric.status) {
    status = metric.status;
  } else if (metric.isActive !== undefined) {
    status = metric.isActive ? 'Active' : 'Paused';
  }

  // Normalize logs: handle null, undefined, or array
  let logs: MetricLog[] | undefined;
  if (metric.logs && Array.isArray(metric.logs)) {
    logs = metric.logs.map((log) => normalizeMetricLog(log, metric.userId));
  } else {
    logs = undefined; // null or undefined becomes undefined
  }

  // Create normalized metric, ensuring all required fields are present
  const normalized: Metric = {
    id: metric.id,
    name: metric.name,
    description: metric.description ?? null,
    area: metric.area,
    subCategory: metric.subCategory ?? null,
    unit: metric.unit,
    customUnit: metric.customUnit ?? null,
    direction: metric.direction,
    targetValue: metric.targetValue ?? null,
    thresholdLow: metric.thresholdLow ?? null,
    thresholdHigh: metric.thresholdHigh ?? null,
    source: metric.source,
    status,
    goalIds: metric.goalIds,
    userId: metric.userId,
    createdAt: metric.createdAt,
    updatedAt: metric.updatedAt,
    currentValue: metric.currentValue,
    baselineValue: metric.baselineValue ?? null,
    trackingFrequency: metric.trackingFrequency,
    logCount: metric.logCount,
    milestoneCount: metric.milestoneCount,
    logs,
  };

  return normalized;
}

interface MetricAnalytics {
  trend: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    velocity: number;
    acceleration: number;
    isImproving: boolean;
  };
  progress: {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
    isOnTrack: boolean;
  };
  streak: {
    current: number;
    longest: number;
  };
  prediction: {
    futureValue: number;
    daysAhead: number;
    confidence: number;
  };
}

interface MetricMilestone {
  id: string;
  metricId: string;
  type: string;
  value: number;
  achievedAt: string;
  pointsAwarded: number;
}

interface MetricInsight {
  type: string;
  content: Record<string, unknown>;
  cachedAt: string;
  expiresAt: string;
}

export const metricsService = {
  async getAll(filters?: { area?: string; status?: string }): Promise<ApiListResponse<Metric>> {
    const queryParams = new URLSearchParams();
    if (filters?.area) queryParams.append('area', filters.area);
    if (filters?.status) queryParams.append('status', filters.status);

    const endpoint = `/metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    // API response structure: { success: true, data: { data: [...], total, page, pageSize, hasMore }, error: null }
    // The apiClient.get returns ApiResponse<T>, so response.data is the BackendPaginatedResponse
    const response = await apiClient.get<BackendPaginatedResponse<BackendMetric>>(endpoint);

    if (response.success && response.data) {
      // response.data is BackendPaginatedResponse<BackendMetric> which has { data: [...], total, ... }
      const paginatedData = response.data;
      if (paginatedData && Array.isArray(paginatedData.data)) {
        const normalizedMetrics = paginatedData.data.map(normalizeMetric);
        return {
          data: normalizedMetrics,
          total: paginatedData.total,
          success: true,
        };
      }
    }

    throw new Error(response.error?.message || 'Failed to fetch metrics');
  },

  async getById(id: string): Promise<ApiResponse<Metric>> {
    const response = await apiClient.get<BackendMetric>(`/metrics/${id}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeMetric(response.data),
      };
    }
    return {
      success: false,
      error: response.error,
    };
  },

  async create(input: CreateMetricInput): Promise<ApiResponse<Metric>> {
    const response = await apiClient.post<BackendMetric>('/metrics', input);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeMetric(response.data),
      };
    }
    return {
      success: false,
      error: response.error,
    };
  },

  async update(id: string, input: UpdateMetricInput): Promise<ApiResponse<Metric>> {
    const response = await apiClient.patch<BackendMetric>(`/metrics/${id}`, input);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeMetric(response.data),
      };
    }
    return {
      success: false,
      error: response.error,
    };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/metrics/${id}`);
    return response;
  },

  async getHistory(
    metricId: string,
    filters?: { startDate?: string; endDate?: string; limit?: number }
  ): Promise<ApiListResponse<MetricLog>> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const endpoint = `/metrics/${metricId}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<MetricLog>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch metric logs');
  },

  async logValue(input: CreateMetricLogInput): Promise<ApiResponse<MetricLog>> {
    // Backend expects 'note' (singular) but we use 'notes' (plural) in frontend
    const response = await apiClient.post<BackendMetricLog>(`/metrics/${input.metricId}/logs`, {
      value: input.value,
      loggedAt: input.loggedAt,
      note: input.notes, // Map 'notes' to 'note' for API
    });
    if (response.success && response.data) {
      // We need the metric's userId to normalize the log, but we don't have it here
      // The backend should return the full metric with updated logs, or we can fetch it
      // For now, we'll normalize without userId and let the cache update handle it
      const normalizedLog: MetricLog = {
        id: response.data.id,
        metricId: response.data.metricId,
        value: response.data.value,
        notes: response.data.note, // Map 'note' to 'notes'
        loggedAt: response.data.loggedAt,
        userId: '', // Will be updated when metric is refetched
        createdAt: response.data.createdAt,
      };
      return {
        ...response,
        data: normalizedLog,
      };
    }
    return {
      success: false,
      error: response.error,
    };
  },

  async deleteLog(metricId: string, logId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/metrics/${metricId}/logs/${logId}`);
    return response;
  },

  async getAnalytics(metricId: string): Promise<ApiResponse<MetricAnalytics>> {
    const response = await apiClient.get<MetricAnalytics>(`/metrics/${metricId}/analytics`);
    return response;
  },

  async getMilestones(metricId: string): Promise<ApiListResponse<MetricMilestone>> {
    const response = await apiClient.get<BackendPaginatedResponse<MetricMilestone>>(
      `/metrics/${metricId}/milestones`
    );
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch milestones');
  },

  async getInsights(metricId: string): Promise<ApiResponse<MetricInsight>> {
    const response = await apiClient.get<MetricInsight>(`/metrics/${metricId}/insights`);
    return response;
  },
};
