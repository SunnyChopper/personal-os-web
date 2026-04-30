import "server-only";

import { createHash } from "crypto";

import { Pool } from "pg";

let writerPool: Pool | null = null;

function getWriterPool(): Pool | null {
  const dsn = (process.env.PUBLIC_GARDEN_WRITER_DATABASE_URL || "").trim();
  if (!dsn) return null;
  if (!writerPool) {
    writerPool = new Pool({ connectionString: dsn, max: 2 });
  }
  return writerPool;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Returns true if request is allowed. Uses public_garden.public_rate_limits when
 * PUBLIC_GARDEN_WRITER_DATABASE_URL is set; otherwise allows all (dev-only fallback).
 */
export async function checkRateLimit(
  routeKey: string,
  ip: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<boolean> {
  const pool = getWriterPool();
  if (!pool) return true;
  const bucket = hashIp(ip);
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE public_garden_writer");
    const r = await client.query(
      `INSERT INTO public_garden.public_rate_limits (route_key, bucket_id, window_start, request_count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (route_key, bucket_id, window_start) DO UPDATE
       SET request_count = public_garden.public_rate_limits.request_count + 1
       RETURNING request_count`,
      [routeKey, bucket, windowStart.toISOString()],
    );
    await client.query("COMMIT");
    const count = Number(r.rows[0]?.request_count ?? 0);
    return count <= maxRequests;
  } catch {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    return false;
  } finally {
    client.release();
  }
}
