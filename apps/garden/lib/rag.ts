import 'server-only';

import OpenAI from 'openai';

import { withClient, getPublicGardenOwnerUserId } from '@/lib/db';

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

export async function embedQuery(text: string): Promise<number[]> {
  const key = (process.env.OPENAI_API_KEY || '').trim();
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const client = new OpenAI({ apiKey: key });
  const res = await client.embeddings.create({
    model: process.env.PUBLIC_GARDEN_EMBEDDING_MODEL || 'text-embedding-3-small',
    input: text.slice(0, 8000),
    dimensions: 1536,
  });
  const v = res.data[0]?.embedding;
  if (!v) throw new Error('embedding empty');
  return v;
}

export type RagHit = { content: string; score: number };

export async function searchPublicRag(queryEmbedding: number[], topK: number): Promise<RagHit[]> {
  const userId = getPublicGardenOwnerUserId();
  const literal = toVectorLiteral(queryEmbedding);
  return withClient(async (c) => {
    const r = await c.query(
      `SELECT content, 1 - (embedding <=> $1::vector) AS score
       FROM public_garden.public_rag_chunks
       WHERE user_id = $2 AND published = true AND archived_at IS NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [literal, userId, topK]
    );
    return r.rows as RagHit[];
  });
}
