import "server-only";

import { withClient, getPublicGardenOwnerUserId } from "@/lib/db";

export type ChangelogRow = {
  slug: string;
  title: string;
  bodyMarkdown: string;
  wordCount: number;
  updatedAt: string;
};

export async function getLatestChangelog(): Promise<ChangelogRow | null> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT slug, title, body_markdown AS "bodyMarkdown", word_count AS "wordCount",
              updated_at AS "updatedAt"
       FROM public_garden.public_changelog_posts
       WHERE user_id = $1 AND published = true AND archived_at IS NULL
       ORDER BY week_start DESC
       LIMIT 1`,
      [userId],
    );
    return (r.rows[0] as ChangelogRow) || null;
  });
}

export async function getChangelogBySlug(slug: string): Promise<ChangelogRow | null> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT slug, title, body_markdown AS "bodyMarkdown", word_count AS "wordCount",
              updated_at AS "updatedAt"
       FROM public_garden.public_changelog_posts
       WHERE user_id = $1 AND slug = $2 AND published = true AND archived_at IS NULL`,
      [userId, slug],
    );
    return (r.rows[0] as ChangelogRow) || null;
  });
}
