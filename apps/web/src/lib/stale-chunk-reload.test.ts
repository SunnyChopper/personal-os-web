import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isStaleChunkLoadError,
  resetStaleChunkReloadForTests,
  tryReloadOnceForStaleChunk,
  wasStaleChunkReloadedRecently,
} from './stale-chunk-reload';

describe('stale-chunk-reload', () => {
  afterEach(() => {
    resetStaleChunkReloadForTests();
    vi.restoreAllMocks();
  });

  it('detects Vite/Chrome dynamic import failures (cff8d4784a67, 3965856e5637)', () => {
    expect(
      isStaleChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://sunnysingh.tech/admin/assets/ContentStreamPage-B9wRIBgh.js'
        )
      )
    ).toBe(true);
    expect(
      isStaleChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://sunnysingh.tech/admin/assets/ProjectsPage-a3niJyFt.js'
        )
      )
    ).toBe(true);
    expect(isStaleChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isStaleChunkLoadError(new Error('Loading chunk 5 failed.'))).toBe(true);
    expect(isStaleChunkLoadError(new Error('ChunkLoadError: Loading chunk failed'))).toBe(true);
    expect(isStaleChunkLoadError(new Error('Network timeout'))).toBe(false);
  });

  it('reloads once then blocks a second reload inside the cooldown', () => {
    const reload = vi.fn();
    const t0 = 1_000_000;
    expect(
      tryReloadOnceForStaleChunk(
        new TypeError('Failed to fetch dynamically imported module: /admin/assets/x.js'),
        reload,
        t0
      )
    ).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(wasStaleChunkReloadedRecently(t0 + 100)).toBe(true);

    expect(
      tryReloadOnceForStaleChunk(
        new TypeError('Failed to fetch dynamically imported module: /admin/assets/y.js'),
        reload,
        t0 + 100
      )
    ).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('allows another reload after the cooldown window', () => {
    const reload = vi.fn();
    const t0 = 2_000_000;
    expect(
      tryReloadOnceForStaleChunk(
        new TypeError('Failed to fetch dynamically imported module: /admin/assets/a.js'),
        reload,
        t0
      )
    ).toBe(true);
    expect(
      tryReloadOnceForStaleChunk(
        new TypeError('Failed to fetch dynamically imported module: /admin/assets/b.js'),
        reload,
        t0 + 10_001
      )
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('ignores non-chunk errors', () => {
    const reload = vi.fn();
    expect(tryReloadOnceForStaleChunk(new Error('boom'), reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
