import { apiClient } from '@/lib/api-client';
import type {
  WorkflowDefinition,
  WorkflowResponse,
  WorkflowRunResponse,
  TriggerWorkflowRunRequest,
} from '@/types/api/tools';

export const workflowsService = {
  async list(): Promise<{ items: WorkflowResponse[] }> {
    const res = await apiClient.get<{ items: WorkflowResponse[] }>('/tools/workflows');
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to list workflows');
  },

  async create(body: {
    name: string;
    description?: string;
    definition: WorkflowDefinition;
    enabled?: boolean;
  }): Promise<WorkflowResponse> {
    const res = await apiClient.post<WorkflowResponse>('/tools/workflows', body);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to create workflow');
  },

  async get(id: string): Promise<WorkflowResponse> {
    const res = await apiClient.get<WorkflowResponse>(`/tools/workflows/${id}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load workflow');
  },

  async patch(
    id: string,
    body: Partial<{
      name: string;
      description: string;
      definition: WorkflowDefinition;
      enabled: boolean;
    }>
  ): Promise<WorkflowResponse> {
    const res = await apiClient.patch<WorkflowResponse>(`/tools/workflows/${id}`, body);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to save workflow');
  },

  async remove(id: string): Promise<void> {
    const res = await apiClient.delete(`/tools/workflows/${id}`);
    if (res.success) return;
    throw new Error(res.error?.message || 'Failed to delete workflow');
  },

  async run(id: string, body: TriggerWorkflowRunRequest = {}): Promise<{ runId: string }> {
    const res = await apiClient.post<{ runId: string }>(`/tools/workflows/${id}/runs`, body);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to run workflow');
  },

  async listRuns(id: string): Promise<{ items: WorkflowRunResponse[] }> {
    const res = await apiClient.get<{ items: WorkflowRunResponse[] }>(
      `/tools/workflows/${id}/runs`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to list runs');
  },

  async getRun(workflowId: string, runId: string): Promise<WorkflowRunResponse> {
    const res = await apiClient.get<WorkflowRunResponse>(
      `/tools/workflows/${workflowId}/runs/${runId}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load run');
  },
};
