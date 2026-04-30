import { apiClient } from '@/lib/api-client';
import type {
  ObservabilityBurnBreakdown,
  ObservabilityBurnSummary,
  ObservabilityBurnTimeseries,
  ObservabilityExecutionDetail,
  ObservabilityExecutionsPage,
  ObservabilityHealthMatrix,
  ObservabilityHealthSummary,
  ObservabilityRetryQueued,
} from '@/types/observability';

function searchFromRecord(r: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(r)) {
    if (v === undefined || v === '') continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const observabilityService = {
  async getBurnSummary(filters?: {
    startDate?: string;
    endDate?: string;
    module?: string;
    model?: string;
    provider?: string;
  }): Promise<ObservabilityBurnSummary> {
    const res = await apiClient.get<ObservabilityBurnSummary>(
      `/observability/burn/summary${searchFromRecord((filters ?? {}) as Record<string, string | number | undefined>)}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load burn summary');
  },

  async getBurnTimeseries(filters?: {
    startDate?: string;
    endDate?: string;
    module?: string;
    model?: string;
  }): Promise<ObservabilityBurnTimeseries> {
    const res = await apiClient.get<ObservabilityBurnTimeseries>(
      `/observability/burn/timeseries${searchFromRecord((filters ?? {}) as Record<string, string | number | undefined>)}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load burn timeseries');
  },

  async getBurnBreakdown(filters?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'module' | 'model' | 'provider';
  }): Promise<ObservabilityBurnBreakdown> {
    const res = await apiClient.get<ObservabilityBurnBreakdown>(
      `/observability/burn/breakdown${searchFromRecord((filters ?? {}) as Record<string, string | number | undefined>)}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load burn breakdown');
  },

  async getHealthSummary(sinceDays?: number): Promise<ObservabilityHealthSummary> {
    const res = await apiClient.get<ObservabilityHealthSummary>(
      `/observability/health/summary${sinceDays != null ? `?sinceDays=${sinceDays}` : ''}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load health summary');
  },

  async getHealthMatrix(sinceDays?: number): Promise<ObservabilityHealthMatrix> {
    const res = await apiClient.get<ObservabilityHealthMatrix>(
      `/observability/health/matrix${sinceDays != null ? `?sinceDays=${sinceDays}` : ''}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load health matrix');
  },

  async listExecutions(filters: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    module?: string;
    model?: string;
    provider?: string;
    status?: string;
    requestId?: string;
    threadId?: string;
    runId?: string;
  }): Promise<ObservabilityExecutionsPage> {
    const res = await apiClient.get<ObservabilityExecutionsPage>(
      `/observability/executions${searchFromRecord(filters as Record<string, string | number | undefined>)}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to list executions');
  },

  async getExecution(executionId: string): Promise<ObservabilityExecutionDetail> {
    const res = await apiClient.get<ObservabilityExecutionDetail>(
      `/observability/executions/${encodeURIComponent(executionId)}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load execution');
  },

  async replayJob(jobRunId: string): Promise<ObservabilityRetryQueued> {
    const res = await apiClient.post<ObservabilityRetryQueued>(
      `/observability/health/jobs/${encodeURIComponent(jobRunId)}/replay`,
      {}
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Replay failed');
  },
};
