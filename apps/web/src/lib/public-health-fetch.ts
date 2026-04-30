/**
 * Unauthenticated health checks without axios default headers (e.g. Content-Type: application/json),
 * so the browser can use a simple cross-origin GET with minimal CORS preflight.
 */
import { getResolvedApiBaseUrl } from '@/lib/vite-public-env';
import type { ApiResponse } from '@/types/api-contracts';

/** /health/markdown success payload (minimal) */
type MarkdownHealthPayload = { status: string; [k: string]: unknown };

function base() {
  return getResolvedApiBaseUrl().replace(/\/$/, '');
}

export async function fetchPlainGetHealth(): Promise<{
  ok: boolean;
  data?: { status: string; stage?: string; version?: string };
  status: number;
}> {
  const res = await fetch(`${base()}/health`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const data = (await res.json()) as { status?: string; stage?: string; version?: string };
  return {
    ok: data?.status === 'healthy',
    data: data as { status: string; stage?: string; version?: string },
    status: res.status,
  };
}

export async function fetchPlainHealthMarkdown(): Promise<ApiResponse<MarkdownHealthPayload>> {
  const res = await fetch(`${base()}/health/markdown`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    return { success: false, error: { message: 'Invalid JSON from /health/markdown', code: 'PARSE' } };
  }
  if (!res.ok) {
    return { success: false, error: { message: `HTTP ${res.status}`, code: 'HTTP' } };
  }
  if (body && typeof body === 'object' && 'success' in body) {
    return body as ApiResponse<MarkdownHealthPayload>;
  }
  return { success: false, error: { message: 'Unexpected /health/markdown shape', code: 'SHAPE' } };
}
