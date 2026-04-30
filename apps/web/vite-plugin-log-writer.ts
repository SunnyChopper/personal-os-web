import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { IncomingMessage } from 'node:http';
import type { Plugin } from 'vite';

const MAX_LOG_BYTES = 5 * 1024 * 1024;
const BACKUP_COUNT = 3;

interface FrontendLogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  meta?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toEntries(value: unknown): FrontendLogEntry[] {
  const rawEntries = Array.isArray(value) ? value : [value];
  return rawEntries.filter(
    (entry): entry is FrontendLogEntry =>
      isObject(entry) &&
      typeof entry.timestamp === 'string' &&
      typeof entry.level === 'string' &&
      typeof entry.message === 'string'
  );
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function rotateLogs(logFilePath: string): Promise<void> {
  try {
    const fileStats = await stat(logFilePath);
    if (fileStats.size < MAX_LOG_BYTES) {
      return;
    }
  } catch {
    return;
  }

  for (let index = BACKUP_COUNT; index >= 1; index -= 1) {
    const source = index === 1 ? logFilePath : `${logFilePath}.${index - 1}`;
    const destination = `${logFilePath}.${index}`;
    try {
      await rm(destination, { force: true });
      await rename(source, destination);
    } catch {
      // Ignore missing backups while rotating.
    }
  }
}

export function createFrontendLogWriterPlugin(): Plugin {
  const logFilePath = resolve(process.cwd(), '..', 'logs', 'frontend', 'app.jsonl');
  const logDir = dirname(logFilePath);

  return {
    name: 'frontend-log-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/___dev_log', async (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        try {
          const body = await readRequestBody(request);
          const entries = toEntries(JSON.parse(body));
          if (entries.length) {
            await mkdir(logDir, { recursive: true });
            await rotateLogs(logFilePath);
            const serialized = entries.map((entry) => JSON.stringify(entry)).join('\n');
            await writeFile(logFilePath, `${serialized}\n`, { flag: 'a' });
          }
          response.statusCode = 204;
          response.end();
        } catch (error) {
          response.statusCode = 500;
          response.setHeader('Content-Type', 'application/json');
          response.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Failed to write frontend logs',
            })
          );
        }
      });
    },
  };
}
