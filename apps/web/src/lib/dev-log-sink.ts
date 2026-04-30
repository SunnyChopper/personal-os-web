export type FrontendLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface FrontendLogEntry {
  timestamp: string;
  level: FrontendLogLevel;
  context?: string;
  message: string;
  meta?: unknown;
}

const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER_SIZE = 20;
const DEV_LOG_ENDPOINT = '/___dev_log';

const buffer: FrontendLogEntry[] = [];
let flushTimer: number | null = null;
let flushInFlight: Promise<void> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function scheduleFlush(): void {
  if (!isBrowser() || flushTimer !== null) {
    return;
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushDevLogs();
  }, FLUSH_INTERVAL_MS);
}

function clearFlushTimer(): void {
  if (flushTimer !== null && isBrowser()) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function takeBufferedLogs(): FrontendLogEntry[] {
  return buffer.splice(0, buffer.length);
}

async function postLogs(entries: FrontendLogEntry[], keepalive: boolean): Promise<void> {
  if (!entries.length) {
    return;
  }

  await fetch(DEV_LOG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entries),
    keepalive,
  });
}

export async function flushDevLogs(options?: { keepalive?: boolean }): Promise<void> {
  if (import.meta.env.PROD || !buffer.length) {
    return;
  }

  if (flushInFlight) {
    await flushInFlight;
    return;
  }

  clearFlushTimer();
  const keepalive = options?.keepalive ?? false;
  const entries = takeBufferedLogs();

  flushInFlight = postLogs(entries, keepalive)
    .catch(() => {
      buffer.unshift(...entries);
    })
    .finally(() => {
      flushInFlight = null;
      if (buffer.length) {
        scheduleFlush();
      }
    });

  await flushInFlight;
}

export function pushDevLog(entry: FrontendLogEntry): void {
  if (import.meta.env.PROD) {
    return;
  }

  buffer.push(entry);
  if (buffer.length >= MAX_BUFFER_SIZE) {
    void flushDevLogs();
    return;
  }

  scheduleFlush();
}

if (isBrowser()) {
  window.addEventListener('beforeunload', () => {
    void flushDevLogs({ keepalive: true });
  });
}
