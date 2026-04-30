import 'server-only';

import { withClient, getPublicGardenOwnerUserId } from '@/lib/db';

export type ConceptNodeRow = {
  id: string;
  sourceVaultId: string;
  label: string;
  publicSummary: string;
};

export async function listColliderNodes(limit = 15): Promise<ConceptNodeRow[]> {
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT id::text AS id, source_vault_id AS "sourceVaultId", label,
              public_summary AS "publicSummary"
       FROM public_garden.public_concept_nodes
       WHERE user_id = $1 AND published = true AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return r.rows as ConceptNodeRow[];
  });
}

export async function getConceptNodeContents(
  ids: string[]
): Promise<{ id: string; content: string }[]> {
  if (!ids.length) return [];
  const userId = getPublicGardenOwnerUserId();
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT id::text AS id, public_content AS content
       FROM public_garden.public_concept_nodes
       WHERE user_id = $1 AND id = ANY($2::uuid[]) AND published = true AND archived_at IS NULL`,
      [userId, ids]
    );
    return r.rows as { id: string; content: string }[];
  });
}
