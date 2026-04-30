/**
 * Centralized logging service
 * Automatically handles DEV mode checks - logs only in development
 * Use this instead of console.log/warn/error throughout the codebase
 */

import { pushDevLog, type FrontendLogEntry, type FrontendLogLevel } from '@/lib/dev-log-sink';

const isDev = import.meta.env.DEV;
const consoleMethods: Record<FrontendLogLevel, typeof console.log> = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

type LoggerArgs = unknown[];

/**
 * Logger interface matching console methods
 */
interface Logger {
  log: (...args: LoggerArgs) => void;
  warn: (...args: LoggerArgs) => void;
  error: (...args: LoggerArgs) => void;
  info: (...args: LoggerArgs) => void;
  debug: (...args: LoggerArgs) => void;
}

function serializeLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeLogValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, serializeLogValue(entryValue)])
    );
  }

  return value;
}

function createLogEntry(
  level: FrontendLogLevel,
  context: string | undefined,
  args: LoggerArgs
): FrontendLogEntry {
  const [firstArg, ...restArgs] = args;
  const message =
    firstArg === undefined
      ? ''
      : typeof firstArg === 'string'
        ? firstArg
        : String(serializeLogValue(firstArg));

  let meta: unknown;
  if (restArgs.length === 1) {
    meta = serializeLogValue(restArgs[0]);
  } else if (restArgs.length > 1) {
    meta = restArgs.map(serializeLogValue);
  }

  return {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };
}

function emit(level: FrontendLogLevel, context: string | undefined, args: LoggerArgs): void {
  const prefix = context ? `[${context}]` : '';
  const consoleMethod = consoleMethods[level];

  if (level === 'error' || isDev) {
    if (prefix) {
      consoleMethod(prefix, ...args);
    } else {
      consoleMethod(...args);
    }
  }

  if (isDev) {
    pushDevLog(createLogEntry(level, context, args));
  }
}

/**
 * Create a logger with optional context prefix
 * @param context - Optional prefix for all log messages (e.g., '[ApiClient]')
 * @returns Logger instance
 */
export function createLogger(context?: string): Logger {
  return {
    log: (...args: LoggerArgs) => emit('log', context, args),
    warn: (...args: LoggerArgs) => emit('warn', context, args),
    error: (...args: LoggerArgs) => emit('error', context, args),
    info: (...args: LoggerArgs) => emit('info', context, args),
    debug: (...args: LoggerArgs) => emit('debug', context, args),
  };
}

/**
 * Default logger (no context prefix)
 */
export const logger = createLogger();

/**
 * Common logger instances with context
 * Import these directly for common use cases
 */
export const apiLogger = createLogger('ApiClient');
export const authLogger = createLogger('Auth');
export const llmLogger = createLogger('LLM');
export const wsLogger = createLogger('WebSocket');
export const queryLogger = createLogger('ReactQuery');
export const routeLogger = createLogger('Routing');
