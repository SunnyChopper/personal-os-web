import "server-only";

import { withClient, getPublicGardenOwnerUserId } from "@/lib/db";

export async function getBrandProfile(): Promise<{
  voiceSummary: string;
  frameworks: string;
} | null> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT voice_summary AS "voiceSummary", frameworks
       FROM public_garden.public_brand_profiles
       WHERE user_id = $1 AND published = true AND archived_at IS NULL`,
      [userId],
    );
    return (r.rows[0] as { voiceSummary: string; frameworks: string }) || null;
  });
}
