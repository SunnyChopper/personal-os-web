import { apiClient } from '@/lib/api-client';
import { authService } from '@/lib/auth/auth.service';
import { getResolvedApiBaseUrl } from '@/lib/vite-public-env';

const API_BASE = getResolvedApiBaseUrl();

/** Backend subgraph node: `{ id, isSeed }` */
export interface GraphSubgraphNode {
  id: string;
  isSeed?: boolean;
}

/** Raw edge row from Dynamo (camelCase). */
export interface GraphEdgeRecord {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType?: string;
  targetType?: string;
  connectionStrength?: number;
  connectionType?: string;
}

export interface GraphSubgraphPayload {
  nodes: GraphSubgraphNode[];
  edges: GraphEdgeRecord[];
}

export const conceptGraphService = {
  async getSubgraph(seedIds: string[], maxDepth = 2) {
    if (!seedIds.length) {
      return {
        success: false as const,
        data: null as GraphSubgraphPayload | null,
        error: 'Select at least one seed',
      };
    }
    const params = new URLSearchParams({
      seedIds: seedIds.join(','),
      maxDepth: String(maxDepth),
    });
    const res = await apiClient.get<GraphSubgraphPayload>(`/knowledge/graph/subgraph?${params}`);
    if (res.success && res.data) {
      return { success: true as const, data: res.data, error: null };
    }
    return {
      success: false as const,
      data: null,
      error: res.error?.message || 'Failed to load graph',
    };
  },

  async synthesize(nodeIds: string[]) {
    return apiClient.post<{ markdown: string }>('/knowledge/graph/synthesize', {
      nodeIds,
    });
  },

  async saveSynthesis(nodeIds: string[], markdown: string, connectionStrength = 0.9) {
    return apiClient.post<{ note: Record<string, unknown>; edges: unknown[] }>(
      '/knowledge/graph/synthesize/save',
      {
        nodeIds,
        markdown,
        connectionStrength,
      }
    );
  },

  /**
   * SSE stream (`text/event-stream`) — use fetch because axios does not parse SSE well.
   */
  async streamSynthesis(
    nodeIds: string[],
    onDelta: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onError?: (message: string) => void
  ): Promise<void> {
    const token = authService.getStoredTokens()?.accessToken;
    const res = await fetch(`${API_BASE}/knowledge/graph/synthesize-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ nodeIds }),
    });
    if (!res.ok || !res.body) {
      onError?.(`Stream failed: ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const block of parts) {
          const line = block.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          try {
            const payload = JSON.parse(jsonStr) as {
              delta?: string;
              done?: boolean;
              fullText?: string;
              error?: string;
            };
            if (payload.error) {
              onError?.(payload.error);
              return;
            }
            if (payload.delta) onDelta(payload.delta);
            if (payload.done && typeof payload.fullText === 'string') {
              onComplete(payload.fullText);
              return;
            }
          } catch {
            /* ignore partial JSON */
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
