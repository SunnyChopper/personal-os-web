import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMarkdownAutosave } from '@/hooks/markdown/useMarkdownAutosave';

const saveFileMock = vi.fn();

vi.mock('@/hooks/markdown/useFileSave', () => ({
  useFileSave: () => ({ saveFile: saveFileMock }),
}));

function renderAutosave(overrides: Partial<Parameters<typeof useMarkdownAutosave>[0]> = {}) {
  const onSaved = vi.fn();
  const props = {
    filePath: 'docs/test.md',
    content: 'hello',
    enabled: true,
    lastSavedContent: '',
    onSaved,
    debounceMs: 1500,
    maxIntervalMs: 30_000,
    ...overrides,
  };

  const hook = renderHook((p: typeof props) => useMarkdownAutosave(p), { initialProps: props });

  return { ...hook, onSaved, props };
}

describe('useMarkdownAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    saveFileMock.mockReset();
    saveFileMock.mockResolvedValue({ success: true, local: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid content changes into a single save', async () => {
    const onSaved = vi.fn();
    const baseProps = {
      filePath: 'docs/test.md',
      content: 'hello',
      enabled: true,
      lastSavedContent: '',
      onSaved,
      debounceMs: 1500,
      maxIntervalMs: 30_000,
    };
    const { result, rerender } = renderHook((p) => useMarkdownAutosave(p), {
      initialProps: baseProps,
    });

    rerender({ ...baseProps, content: 'a' });
    rerender({ ...baseProps, content: 'ab' });
    rerender({ ...baseProps, content: 'abc' });

    expect(saveFileMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(saveFileMock).toHaveBeenCalledTimes(1);
    expect(saveFileMock).toHaveBeenCalledWith(
      'docs/test.md',
      'abc',
      false,
      expect.objectContaining({ silent: true, signal: expect.any(AbortSignal) })
    );
    expect(onSaved).toHaveBeenCalledWith('abc');
    expect(result.current.status).toBe('saved');
  });

  it('skips save when content matches lastSavedContent', async () => {
    renderAutosave({ content: 'same', lastSavedContent: 'same' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(saveFileMock).not.toHaveBeenCalled();
  });

  it('flushes on max interval during continuous typing', async () => {
    const base = renderAutosave();
    const { rerender } = base;

    for (let i = 0; i < 40; i++) {
      rerender({
        ...base.props,
        content: `line ${i}`,
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(saveFileMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('queues a trailing save when content changes during in-flight save', async () => {
    let resolveFirst: (value: { success: boolean; local: boolean }) => void = () => {};
    saveFileMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValueOnce({ success: true, local: false });

    const base = renderAutosave({ content: 'v1' });
    const { rerender } = base;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    rerender({ ...base.props, content: 'v2' });

    await act(async () => {
      resolveFirst({ success: true, local: false });
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(saveFileMock).toHaveBeenCalledTimes(2);
    expect(saveFileMock).toHaveBeenLastCalledWith(
      'docs/test.md',
      'v2',
      false,
      expect.objectContaining({ silent: true })
    );
  });

  it('aborts in-flight save on unmount', async () => {
    let capturedSignal: AbortSignal | undefined;
    saveFileMock.mockImplementation((_path, _content, _local, opts) => {
      capturedSignal = opts?.signal;
      return new Promise(() => {});
    });

    const { unmount } = renderAutosave();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(capturedSignal).toBeDefined();
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('applies backoff after save errors', async () => {
    saveFileMock.mockRejectedValueOnce(new Error('network down'));

    const base = renderAutosave();
    const { rerender, result } = base;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(result.current.status).toBe('error');

    saveFileMock.mockResolvedValue({ success: true, local: false });
    rerender({ ...base.props, content: 'retry content' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(saveFileMock).toHaveBeenCalledTimes(2);
  });

  it('does not schedule saves when disabled', async () => {
    renderAutosave({ enabled: false, content: 'dirty', lastSavedContent: '' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(saveFileMock).not.toHaveBeenCalled();
  });
});
