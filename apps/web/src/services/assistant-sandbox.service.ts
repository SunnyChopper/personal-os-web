import { apiClient } from '@/lib/api-client';
import type { CreateSandboxSessionRequest, SandboxSession } from '@/types/assistant-sandbox';

export const assistantSandboxService = {
  async createSession(body: CreateSandboxSessionRequest): Promise<SandboxSession> {
    const res = await apiClient.post<SandboxSession>('/assistant/sandbox/sessions', body);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to create sandbox session');
  },

  async getSession(sessionId: string): Promise<SandboxSession> {
    const res = await apiClient.get<SandboxSession>(
      `/assistant/sandbox/sessions/${encodeURIComponent(sessionId)}`
    );
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to load sandbox session');
  },
};
