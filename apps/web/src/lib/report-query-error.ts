/**
 * Throttled React Query / mutation failure reporting to the client-error pipeline.
 */
import { reportClientError } from '@/lib/client-telemetry';

const THROTTLE_MS = 60_000;
const MAX_KEY_CHARS = 500;

const _lastSentAt = new Map<string, number>();

const SKIP_CODES = new Set([
  'HTTP_401',
  'HTTP_403',
  'SESSION_EXPIRED',
  'UNAUTHORIZED',
  'ERR_CANCELED',
]);

export function resetQueryErrorReporterForTests(): void {
  _lastSentAt.clear();
}

function serializeKey(key: unknown): string {
  try {
    const raw = JSON.stringify(key);
    return raw.length > MAX_KEY_CHARS ? `${raw.slice(0, MAX_KEY_CHARS)}…` : raw;
  } catch {
    return String(key);
  }
}

function extractErrorDetails(error: unknown): { message: string; code?: string; stack?: string } {
  if (error instanceof Error) {
    const code =
      typeof (error as Error & { code?: string }).code === 'string'
        ? (error as Error & { code?: string }).code
        : undefined;
    return { message: error.message || 'Query error', code, stack: error.stack };
  }

  if (error && typeof error === 'object') {
    const obj = error as {
      message?: string;
      code?: string;
      error?: { message?: string; code?: string };
      response?: { status?: number };
    };
    const nested = obj.error;
    const code = obj.code || nested?.code;
    const status = obj.response?.status;
    const statusCode = status ? `HTTP_${status}` : undefined;
    const message =
      nested?.message ||
      obj.message ||
      (status ? `Request failed with status ${status}` : 'Query error');
    return { message, code: code || statusCode };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'Query error' };
}

function isTimeoutError(code?: string, message?: string): boolean {
  if (code === 'ETIMEDOUT') return true;
  const lower = (message || '').toLowerCase();
  return lower.includes('timeout') || lower.includes('timed out');
}

function isContextUsageQueryKey(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey)) return false;
  return queryKey.some((segment) => segment === 'context-usage');
}

/** Admin shell badge polls — fail-open UX; timeouts are connectivity noise, not product defects. */
function isShellBadgeQueryKey(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey)) return false;
  if (queryKey.includes('unread-summary')) return true;
  return queryKey.includes('interventions') && queryKey.includes('unread-count');
}

/** Static platform-rule catalog — SPA may still have cached query observers; timeouts are not defects. */
function isPlatformRuleCatalogQueryKey(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey)) return false;
  return queryKey.includes('platform-rules') && queryKey.includes('catalog');
}

export type QueryCacheErrorReportOptions = {
  /** Active React Query observers; 0 means the page unmounted mid-flight. */
  observerCount?: number;
};

export function shouldSkipQueryErrorReport(code?: string, message?: string): boolean {
  if (code && SKIP_CODES.has(code)) return true;
  const lower = (message || '').toLowerCase();
  if (lower.includes('session expired') || lower.includes('not authenticated')) return true;
  return false;
}

export function shouldSkipQueryCacheErrorReport(
  queryKey: unknown,
  code?: string,
  message?: string,
  options?: QueryCacheErrorReportOptions
): boolean {
  if (shouldSkipQueryErrorReport(code, message)) return true;
  if (!isTimeoutError(code, message)) return false;
  // Navigating away cancels observers but Axios may still hit 30s timeout (a98591bd8564).
  if ((options?.observerCount ?? 1) === 0) return true;
  if (isContextUsageQueryKey(queryKey)) return true;
  if (isShellBadgeQueryKey(queryKey)) return true;
  if (isPlatformRuleCatalogQueryKey(queryKey)) return true;
  return false;
}

function fingerprint(kind: string, key: string, message: string, code?: string): string {
  return `${kind}|${key}|${message}|${code ?? ''}`;
}

function shouldThrottle(fp: string): boolean {
  const last = _lastSentAt.get(fp);
  const now = Date.now();
  if (last != null && now - last < THROTTLE_MS) return true;
  _lastSentAt.set(fp, now);
  return false;
}

export function reportQueryCacheError(
  error: unknown,
  queryKey: unknown,
  options?: QueryCacheErrorReportOptions
): void {
  const key = serializeKey(queryKey);
  const { message, code, stack } = extractErrorDetails(error);
  if (shouldSkipQueryCacheErrorReport(queryKey, code, message, options)) return;
  const fp = fingerprint('react-query', key, message, code);
  if (shouldThrottle(fp)) return;

  void reportClientError({
    message: `React Query failed: ${message}`,
    source: 'web',
    stack,
    metadata: {
      kind: 'react-query',
      queryKey: key,
      code,
    },
  });
}

export function reportMutationCacheError(error: unknown, mutationKey: unknown): void {
  const key = serializeKey(mutationKey ?? 'unknown');
  const { message, code, stack } = extractErrorDetails(error);
  if (shouldSkipQueryErrorReport(code, message)) return;
  const fp = fingerprint('react-mutation', key, message, code);
  if (shouldThrottle(fp)) return;

  void reportClientError({
    message: `React Mutation failed: ${message}`,
    source: 'web',
    stack,
    metadata: {
      kind: 'react-mutation',
      mutationKey: key,
      code,
    },
  });
}
