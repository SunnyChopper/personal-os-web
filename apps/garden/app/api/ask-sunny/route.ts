import { getBrandProfile } from "@/lib/queries/public-brand";
import { checkRateLimit } from "@/lib/rate-limit";
import { embedQuery, searchPublicRag } from "@/lib/rag";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  message: z.string().min(1).max(2000),
});

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const windowSec = Number(process.env.PUBLIC_GARDEN_RATE_LIMIT_WINDOW_SECONDS || 60);
  const maxReq = Number(process.env.PUBLIC_GARDEN_RATE_LIMIT_MAX_REQUESTS || 20);
  const ok = await checkRateLimit("ask-sunny", ip, windowSec, maxReq);
  if (!ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }
  const message = stripHtml(parsed.data.message);
  if (message.length < 2) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const topK = Math.min(8, Number(process.env.PUBLIC_GARDEN_RAG_TOP_K || 8));
  const minScore = Number(process.env.PUBLIC_GARDEN_RAG_MIN_SCORE || 0.22);

  const vec = await embedQuery(message);
  const hits = await searchPublicRag(vec, topK);
  const good = hits.filter((h) => h.score >= minScore);
  if (!good.length) {
    return NextResponse.json({
      answer: "I only answer from public material in this garden, and nothing matched closely enough.",
    });
  }

  const brand = await getBrandProfile();
  const context = good.map((h) => h.content).join("\n---\n").slice(0, 12_000);
  const voice = brand
    ? `Voice: ${brand.voiceSummary}\nFrameworks: ${brand.frameworks}\n`
    : "";

  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: process.env.PUBLIC_GARDEN_CHAT_MODEL || "gpt-4o-mini",
    max_tokens: 512,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You answer visitors using ONLY the provided CONTEXT. If context is insufficient, say so. " +
          "Do not claim access to private data. Keep answers concise.",
      },
      {
        role: "user",
        content: `${voice}QUESTION:\n${message}\n\nCONTEXT:\n${context}`,
      },
    ],
  });
  const answer = completion.choices[0]?.message?.content?.trim() || "";
  return NextResponse.json({ answer });
}
