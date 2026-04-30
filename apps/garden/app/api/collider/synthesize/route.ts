import { getConceptNodeContents } from '@/lib/queries/public-collider';
import { checkRateLimit } from '@/lib/rate-limit';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const Body = z.object({
  nodeIds: z.array(z.string().uuid()).min(2).max(3),
});

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const windowSec = Number(process.env.PUBLIC_GARDEN_RATE_LIMIT_WINDOW_SECONDS || 60);
  const maxReq = Number(process.env.PUBLIC_GARDEN_RATE_LIMIT_MAX_REQUESTS || 20);
  const ok = await checkRateLimit('collider-synthesize', ip, windowSec, maxReq);
  if (!ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 });
  }

  const rows = await getConceptNodeContents(parsed.data.nodeIds);
  if (rows.length !== parsed.data.nodeIds.length) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const key = (process.env.OPENAI_API_KEY || '').trim();
  if (!key) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }
  const client = new OpenAI({ apiKey: key });
  const bundle = rows
    .map((r) => r.content)
    .join('\n---\n')
    .slice(0, 8000);
  const completion = await client.chat.completions.create({
    model: process.env.PUBLIC_GARDEN_CHAT_MODEL || 'gpt-4o-mini',
    max_tokens: 600,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content:
          'Synthesize the given public notes into one crisp insight (3-6 sentences). No private claims.',
      },
      { role: 'user', content: bundle },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() || '';
  return NextResponse.json({ text });
}
