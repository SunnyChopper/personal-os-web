import PageShell from "@/components/layout/PageShell";
import { getArtifactBySlug } from "@/lib/queries/public-artifacts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArtifactBySlug(slug);
  if (!a) return { title: "Not found" };
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return {
    title: `${a.title} | Artifact`,
    description: a.summary.slice(0, 160),
    alternates: { canonical: `${base}/artifacts/${slug}` },
  };
}

export default async function ArtifactDetailPage({ params }: Props) {
  const { slug } = await params;
  const a = await getArtifactBySlug(slug);
  if (!a) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: a.title,
    description: a.summary,
    applicationCategory: "DeveloperApplication",
  };

  return (
    <PageShell>
      <article className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Link href="/artifacts" className="text-sm text-primary hover:underline">
          ← Artifacts
        </Link>
        <h1 className="font-sans text-3xl font-bold text-gray-900">{a.title}</h1>
        <p className="text-gray-600">{a.summary}</p>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-gray-500">API capital burned (USD)</dt>
            <dd className="font-medium text-gray-900">{a.apiCapitalBurnedUsd ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Human time saved (hrs)</dt>
            <dd className="font-medium text-gray-900">{a.humanTimeSavedHours ?? "—"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-gray-500">ROI summary</dt>
            <dd className="font-medium text-gray-900">{a.roiSummary || "—"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-gray-500">Stack</dt>
            <dd className="font-medium text-gray-900">{a.stack?.join(", ") || "—"}</dd>
          </div>
        </dl>
        <div className="flex gap-4">
          {a.demoUrl ? (
            <a href={a.demoUrl} className="text-primary hover:underline" rel="noreferrer" target="_blank">
              Demo
            </a>
          ) : null}
          {a.repoUrl ? (
            <a href={a.repoUrl} className="text-primary hover:underline" rel="noreferrer" target="_blank">
              Repo
            </a>
          ) : null}
        </div>
      </article>
    </PageShell>
  );
}
