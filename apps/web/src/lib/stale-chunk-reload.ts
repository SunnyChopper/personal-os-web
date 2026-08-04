/**
 * Post-deploy SPA recovery: hashed Vite chunks disappear after a new release while an
 * open tab still holds the previous entry shell. Detect those import failures and
 * hard-reload once (cooldown) so the browser picks up the fresh index.html.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const STALE_CHUNK_RELOAD_STORAGE_KEY = 'pos:stale-chunk-reload-at';

/** Ignore a second auto-reload within this window to avoid infinite loops. */
export const STALE_CHUNK_RELOAD_COOLDOWN_MS = 10_000;

type ModuleDefault<T> = { default: T };

/** In-memory fallback when sessionStorage is unavailable (tests / private mode). */
let _memoryLastReloadAt: number | null = null;

export function isStaleChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error ?? '');
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch dynamically imported module') ||
    lower.includes('error loading dynamically imported module') ||
    lower.includes('importing a module script failed') ||
    lower.includes('loading chunk') ||
    lower.includes('chunkloaderror')
  );
}

function readLastReloadAt(): number | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(STALE_CHUNK_RELOAD_STORAGE_KEY);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) return n;
      }
    } catch {
      // Private mode / blocked storage
    }
  }
  return _memoryLastReloadAt;
}

function writeLastReloadAt(at: number): void {
  _memoryLastReloadAt = at;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STALE_CHUNK_RELOAD_STORAGE_KEY, String(at));
  } catch {
    // Private mode / blocked storage — memory fallback still applies.
  }
}

/** True when a reload for a stale chunk already happened within the cooldown window. */
export function wasStaleChunkReloadedRecently(now = Date.now()): boolean {
  const last = readLastReloadAt();
  if (last == null) return false;
  return now - last < STALE_CHUNK_RELOAD_COOLDOWN_MS;
}

/**
 * Hard-reload once when `error` looks like a missing/hashed chunk after deploy.
 * Returns true when reload was initiated (caller should not report telemetry).
 * Pass a custom `reload` in tests (no `window` required).
 */
export function tryReloadOnceForStaleChunk(
  error: unknown,
  reload?: () => void,
  now = Date.now()
): boolean {
  if (!isStaleChunkLoadError(error)) return false;
  const doReload =
    reload ??
    (() => {
      window.location.reload();
    });
  if (!reload && typeof window === 'undefined') return false;
  if (wasStaleChunkReloadedRecently(now)) return false;
  writeLastReloadAt(now);
  doReload();
  return true;
}

/** Test helper */
export function resetStaleChunkReloadForTests(): void {
  _memoryLastReloadAt = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * React.lazy wrapper that reloads the page once on stale hashed-chunk failures
 * instead of leaving the route Suspense forever rejected.
 */
// ComponentType<any>: mirrors React.lazy's factory typing for pages with mixed props.
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<ModuleDefault<T>>
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error: unknown) => {
      if (tryReloadOnceForStaleChunk(error)) {
        // Keep Suspense pending while the document unloads.
        return new Promise<ModuleDefault<T>>(() => {});
      }
      throw error;
    })
  );
}
