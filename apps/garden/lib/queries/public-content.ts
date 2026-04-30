import 'server-only';

import { withClient, getPublicGardenOwnerUserId } from '@/lib/db';

export type PublicContentRow = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  sourceType: string;
  updatedAt: string;
};

export async function getPublicContentBySlug(slug: string): Promise<PublicContentRow | null> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT slug, title, summary, content, source_type AS "sourceType", updated_at AS "updatedAt"
       FROM public_garden.public_content_items
       WHERE user_id = $1 AND slug = $2 AND published = true AND archived_at IS NULL`,
      [userId, slug]
    );
    return (r.rows[0] as PublicContentRow) || null;
  });
}

export async function listRecentPublicContent(limit = 8): Promise<PublicContentRow[]> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT slug, title, summary, content, source_type AS "sourceType", updated_at AS "updatedAt"
       FROM public_garden.public_content_items
       WHERE user_id = $1 AND published = true AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return r.rows as PublicContentRow[];
  });
}
