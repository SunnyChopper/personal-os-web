import { apiClient } from '@/lib/api-client';

export interface WebhookCatcher {
  id: string;
  name: string;
  secretToken: string;
  ingestPath: string;
  createdAt: string;
  eventCount: number;
}

export interface WebhookEventDetail {
  eventId: string;
  method: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  bodyText: string;
  truncated: boolean;
  sourceIp: string;
  receivedAt: string;
}

export const webhooksService = {
  async list(): Promise<{ items: WebhookCatcher[] }> {
    const response = await apiClient.get<{ items: WebhookCatcher[] }>('/tools/webhooks');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list webhooks');
  },

  async create(name: string): Promise<WebhookCatcher> {
    const response = await apiClient.post<WebhookCatcher>('/tools/webhooks', { name });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to create webhook');
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/tools/webhooks/${id}`);
    if (response.success) {
      return;
    }
    throw new Error(response.error?.message || 'Failed to delete');
  },

  async listEvents(catcherId: string): Promise<{ items: WebhookEventDetail[] }> {
    const response = await apiClient.get<{ items: WebhookEventDetail[] }>(
      `/tools/webhooks/${catcherId}/events`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list events');
  },

  async saveEventToVault(catcherId: string, eventId: string): Promise<{ vaultItemId: string }> {
    const response = await apiClient.post<{ vaultItemId: string }>(
      `/tools/webhooks/${catcherId}/events/${eventId}/save-to-vault`,
      {}
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to save to vault');
  },
};
