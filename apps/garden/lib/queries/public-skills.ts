import "server-only";

import { withClient, getPublicGardenOwnerUserId } from "@/lib/db";

export type SkillNodeRow = {
  id: string;
  sourceSkillId: string;
  name: string;
  category: string;
  level: string;
  progressPercentage: number;
};

export type SkillEdgeRow = {
  parentSourceSkillId: string;
  childSourceSkillId: string;
};

export async function getPublicSkillGraph(): Promise<{
  nodes: SkillNodeRow[];
  edges: SkillEdgeRow[];
}> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const nodes = await c.query(
      `SELECT id::text AS id, source_skill_id AS "sourceSkillId", name, category, level,
              progress_percentage AS "progressPercentage"
       FROM public_garden.public_skill_nodes
       WHERE user_id = $1 AND published = true AND archived_at IS NULL`,
      [userId],
    );
    const edges = await c.query(
      `SELECT parent_source_skill_id AS "parentSourceSkillId",
              child_source_skill_id AS "childSourceSkillId"
       FROM public_garden.public_skill_edges
       WHERE user_id = $1 AND published = true AND archived_at IS NULL`,
      [userId],
    );
    return { nodes: nodes.rows as SkillNodeRow[], edges: edges.rows as SkillEdgeRow[] };
  });
}
