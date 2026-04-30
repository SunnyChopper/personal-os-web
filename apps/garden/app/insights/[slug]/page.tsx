import PageShell from "@/components/layout/PageShell";
import { getPublicContentBySlug } from "@/lib/queries/public-content";
import type { Metadata } from "next";
import { marked } from "marked";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPublicContentBySlug(slug);
  if (!row) return { title: "Not found" };
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return {
    title: `${row.title} | Insights`,
    description: row.summary.slice(0, 160),
    alternates: { canonical: `${base}/insights/${slug}` },
  };
}

export default async function InsightSlugPage({ params }: Props) {
  const { slug } = await params;
  const row = await getPublicContentBySlug(slug);
  if (!row) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: row.title,
    description: row.summary,
    dateModified: row.updatedAt,
  };

  return (
    <PageShell>
      <article className="rounded-xl bg-white p-6 shadow-sm md:p-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="font-serif text-3xl font-bold text-gray-900 md:text-4xl">{row.title}</h1>
        <p className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {row.sourceType}
        </p>
        <div
          className="prose prose-slate mt-8 max-w-none prose-headings:font-serif prose-a:text-primary hover:prose-a:text-primary-dark"
          dangerouslySetInnerHTML={{ __html: marked(row.content || row.summary) as string }}
        />
      </article>
    </PageShell>
  );
}
