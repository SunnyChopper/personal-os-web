import { useEffect, useState } from 'react';

const IDLE_TIMEOUT_MS = 2_000;
const FALLBACK_MS = 500;

/**
 * Becomes true after the browser is idle (or a short fallback timeout).
 * Used to defer non-critical layout queries on cold start.
 */
export function useDeferredIdleReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setReady(true), FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return ready;
}
