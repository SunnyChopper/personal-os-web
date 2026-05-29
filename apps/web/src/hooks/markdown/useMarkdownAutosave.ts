import { useCallback, useEffect, useRef, useState } from 'react';
import { useFileSave } from '@/hooks/markdown/useFileSave';
import { extractErrorMessage } from '@/lib/react-query/error-utils';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const DEFAULT_DEBOUNCE_MS = 1500;
const DEFAULT_MAX_INTERVAL_MS = 30_000;
const BACKOFF_STEPS_MS = [5000, 15_000, 30_000] as const;

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'ERR_CANCELED') {
    return true;
  }
  return false;
}

export interface UseMarkdownAutosaveArgs {
  filePath: string | null;
  content: string;
  enabled: boolean;
  lastSavedContent: string;
  onSaved: (savedContent: string) => void;
  debounceMs?: number;
  maxIntervalMs?: number;
}

export interface UseMarkdownAutosaveReturn {
  status: AutosaveStatus;
  lastSavedAt: number | null;
  errorMessage: string | null;
  flushNow: () => Promise<void>;
  resetBackoff: () => void;
}

export function useMarkdownAutosave({
  filePath,
  content,
  enabled,
  lastSavedContent,
  onSaved,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  maxIntervalMs = DEFAULT_MAX_INTERVAL_MS,
}: UseMarkdownAutosaveArgs): UseMarkdownAutosaveReturn {
  const { saveFile } = useFileSave();

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxIntervalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const trailingRef = useRef(false);
  const backoffStepRef = useRef(0);
  const contentRef = useRef(content);
  const lastSavedContentRef = useRef(lastSavedContent);
  const enabledRef = useRef(enabled);
  const filePathRef = useRef(filePath);
  const statusRef = useRef<AutosaveStatus>('idle');
  const onSavedRef = useRef(onSaved);

  contentRef.current = content;
  lastSavedContentRef.current = lastSavedContent;
  enabledRef.current = enabled;
  filePathRef.current = filePath;
  statusRef.current = status;
  onSavedRef.current = onSaved;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearMaxIntervalTimer = useCallback(() => {
    if (maxIntervalTimerRef.current !== null) {
      clearTimeout(maxIntervalTimerRef.current);
      maxIntervalTimerRef.current = null;
    }
  }, []);

  const getScheduleDelayMs = useCallback(() => {
    const step = backoffStepRef.current;
    if (step <= 0) return debounceMs;
    return BACKOFF_STEPS_MS[Math.min(step - 1, BACKOFF_STEPS_MS.length - 1)];
  }, [debounceMs]);

  const resetBackoff = useCallback(() => {
    backoffStepRef.current = 0;
    setErrorMessage(null);
    if (statusRef.current === 'error') {
      setStatus(contentRef.current !== lastSavedContentRef.current ? 'pending' : 'idle');
    }
  }, []);

  const performSave = useCallback(async (): Promise<void> => {
    const path = filePathRef.current;
    if (!path || !enabledRef.current) return;

    const snapshot = contentRef.current;
    if (snapshot === lastSavedContentRef.current) {
      setStatus('idle');
      return;
    }

    if (inFlightRef.current) {
      trailingRef.current = true;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    inFlightRef.current = true;
    setStatus('saving');
    setErrorMessage(null);

    try {
      const result = await saveFile(path, snapshot, false, {
        silent: true,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!result.success) {
        throw new Error('Autosave failed');
      }

      lastSavedContentRef.current = snapshot;
      setLastSavedAt(Date.now());
      setStatus('saved');
      backoffStepRef.current = 0;
      onSavedRef.current(snapshot);

      if (trailingRef.current) {
        trailingRef.current = false;
        if (contentRef.current !== snapshot) {
          void performSave();
        }
      }
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) {
        trailingRef.current = false;
        return;
      }

      backoffStepRef.current = Math.min(backoffStepRef.current + 1, BACKOFF_STEPS_MS.length);
      setErrorMessage(extractErrorMessage(err, 'Could not autosave'));
      setStatus('error');
      trailingRef.current = false;
    } finally {
      inFlightRef.current = false;
      if (!controller.signal.aborted && abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [saveFile]);

  const scheduleFlush = useCallback(
    (delayMs?: number) => {
      clearIdleTimer();
      const delay = delayMs ?? getScheduleDelayMs();
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        void performSave();
      }, delay);
    },
    [clearIdleTimer, getScheduleDelayMs, performSave]
  );

  const startMaxIntervalTimer = useCallback(() => {
    if (maxIntervalTimerRef.current !== null) return;

    maxIntervalTimerRef.current = setTimeout(() => {
      maxIntervalTimerRef.current = null;
      void performSave().finally(() => {
        if (enabledRef.current && contentRef.current !== lastSavedContentRef.current) {
          startMaxIntervalTimer();
        }
      });
    }, maxIntervalMs);
  }, [maxIntervalMs, performSave]);

  const flushNow = useCallback(async () => {
    clearIdleTimer();
    await performSave();
  }, [clearIdleTimer, performSave]);

  const onContentDirty = useCallback(() => {
    if (!enabledRef.current || !filePathRef.current) return;

    if (contentRef.current === lastSavedContentRef.current) {
      setStatus('idle');
      clearIdleTimer();
      clearMaxIntervalTimer();
      return;
    }

    if (statusRef.current !== 'saving') {
      setStatus(statusRef.current === 'error' ? 'error' : 'pending');
    }

    scheduleFlush();
    startMaxIntervalTimer();
  }, [clearIdleTimer, clearMaxIntervalTimer, scheduleFlush, startMaxIntervalTimer]);

  useEffect(() => {
    if (!enabled) {
      clearIdleTimer();
      clearMaxIntervalTimer();
      abortRef.current?.abort();
      abortRef.current = null;
      trailingRef.current = false;
      if (content === lastSavedContent) {
        setStatus('idle');
      }
      return;
    }

    onContentDirty();
  }, [content, enabled, lastSavedContent, onContentDirty, clearIdleTimer, clearMaxIntervalTimer]);

  useEffect(() => {
    return () => {
      clearIdleTimer();
      clearMaxIntervalTimer();
      abortRef.current?.abort();
    };
  }, [clearIdleTimer, clearMaxIntervalTimer]);

  return {
    status,
    lastSavedAt,
    errorMessage,
    flushNow,
    resetBackoff,
  };
}
