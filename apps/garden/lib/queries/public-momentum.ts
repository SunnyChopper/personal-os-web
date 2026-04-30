import 'server-only';

import { withClient, getPublicGardenOwnerUserId } from '@/lib/db';

export type MomentumDay = {
  day: string;
  habitCompletions: number;
  storyPointsCompleted: number;
};

export async function getMomentumLast30Days(): Promise<MomentumDay[]> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT day::text AS "day", habit_completions AS "habitCompletions",
              story_points_completed AS "storyPointsCompleted"
       FROM public_garden.public_momentum_daily
       WHERE user_id = $1 AND published = true AND archived_at IS NULL
       ORDER BY day ASC`,
      [userId]
    );
    return r.rows as MomentumDay[];
  });
}
