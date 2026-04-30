import PageShell from '@/components/layout/PageShell';
import { getChangelogBySlug } from '@/lib/queries/public-changelog';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { notFound } from 'next/navigation';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getChangelogBySlug(slug);
  if (!row) return { title: 'Not found' };
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  return {
    title: `${row.title} | Changelog`,
    description: `Weekly changelog — ${row.wordCount} words`,
    alternates: { canonical: `${base}/changelog/${slug}` },
  };
}

export default async function ChangelogSlugPage({ params }: Props) {
  const { slug } = await params;
  const row = await getChangelogBySlug(slug);
  if (!row) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: row.title,
    wordCount: row.wordCount,
    dateModified: row.updatedAt,
  };

  return (
    <PageShell>
      <article className="rounded-xl bg-white p-6 shadow-sm">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="font-sans text-3xl font-bold text-gray-900">{row.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{row.wordCount} words</p>
        <div
          className="prose prose-slate mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: marked(row.bodyMarkdown) as string }}
        />
      </article>
    </PageShell>
  );
}
