import 'server-only';

import { withClient, getPublicGardenOwnerUserId } from '@/lib/db';

export type ArtifactRow = {
  slug: string;
  title: string;
  summary: string;
  apiCapitalBurnedUsd: number | null;
  humanTimeSavedHours: number | null;
  roiSummary: string;
  stack: string[];
  demoUrl: string;
  repoUrl: string;
  displayOrder: number;
};

export async function listArtifacts(): Promise<ArtifactRow[]> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT slug, title, summary,
              api_capital_burned_usd AS "apiCapitalBurnedUsd",
              human_time_saved_hours AS "humanTimeSavedHours",
              roi_summary AS "roiSummary",
              stack, demo_url AS "demoUrl", repo_url AS "repoUrl",
              display_order AS "displayOrder"
       FROM public_garden.public_artifacts
       WHERE user_id = $1 AND published = true AND archived_at IS NULL
       ORDER BY display_order ASC, updated_at DESC`,
      [userId]
    );
    return r.rows as ArtifactRow[];
  });
}

export async function getArtifactBySlug(slug: string): Promise<ArtifactRow | null> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT slug, title, summary,
              api_capital_burned_usd AS "apiCapitalBurnedUsd",
              human_time_saved_hours AS "humanTimeSavedHours",
              roi_summary AS "roiSummary",
              stack, demo_url AS "demoUrl", repo_url AS "repoUrl",
              display_order AS "displayOrder"
       FROM public_garden.public_artifacts
       WHERE user_id = $1 AND slug = $2 AND published = true AND archived_at IS NULL`,
      [userId, slug]
    );
    return (r.rows[0] as ArtifactRow) || null;
  });
}
