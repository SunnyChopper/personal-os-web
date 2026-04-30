import 'server-only';

import { Pool, type PoolClient } from 'pg';

/** Placeholder `user_id` when `PUBLIC_GARDEN_USER_ID` is unset in development only (queries return no rows). */
const DEV_FALLBACK_PUBLIC_GARDEN_USER_ID = '00000000-0000-4000-8000-000000000001';

let pool: Pool | null = null;
let warnedMissingPublicGardenUserId = false;
let warnedMissingPublicGardenDatabaseUrl = false;

/** In dev without `PUBLIC_GARDEN_DATABASE_URL`, all `c.query` calls return no rows (UI renders empty). */
const devNoDsnStubClient = {
  query: async (_text: string, _values?: unknown[]) => ({ rows: [], rowCount: 0 }),
} as unknown as PoolClient;

function requireDsn(): string {
  const dsn = (process.env.PUBLIC_GARDEN_DATABASE_URL || '').trim();
  if (!dsn) {
    throw new Error('PUBLIC_GARDEN_DATABASE_URL is required (use public_garden_reader role DSN)');
  }
  return dsn;
}

export function getPublicGardenPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: requireDsn(), max: 4, idleTimeoutMillis: 10_000 });
  }
  return pool;
}

export async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const dsn = (process.env.PUBLIC_GARDEN_DATABASE_URL || '').trim();
  if (!dsn) {
    if (process.env.NODE_ENV === 'development') {
      if (!warnedMissingPublicGardenDatabaseUrl) {
        warnedMissingPublicGardenDatabaseUrl = true;
        console.warn(
          '[public-garden] PUBLIC_GARDEN_DATABASE_URL is unset; using empty DB stub in dev. ' +
            'Set PUBLIC_GARDEN_DATABASE_URL (public_garden_reader DSN) in .env.local for real data.'
        );
      }
      return fn(devNoDsnStubClient);
    }
    throw new Error('PUBLIC_GARDEN_DATABASE_URL is required (use public_garden_reader role DSN)');
  }
  const p = getPublicGardenPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export function getPublicGardenOwnerUserId(): string {
  const id = (process.env.PUBLIC_GARDEN_USER_ID || '').trim();
  if (id) {
    return id;
  }
  if (process.env.NODE_ENV === 'development') {
    if (!warnedMissingPublicGardenUserId) {
      warnedMissingPublicGardenUserId = true;
      console.warn(
        '[public-garden] PUBLIC_GARDEN_USER_ID is unset; using a dev placeholder (no tenant data). ' +
          'Set PUBLIC_GARDEN_USER_ID to your Cognito sub in .env.local for real data.'
      );
    }
    return DEV_FALLBACK_PUBLIC_GARDEN_USER_ID;
  }
  throw new Error('PUBLIC_GARDEN_USER_ID (Cognito sub) is required for single-tenant queries');
}
