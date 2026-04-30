import { AskSunnyChat } from '@/components/chat/AskSunnyChat';
import { MomentumHeatmap } from '@/components/momentum/MomentumHeatmap';
import { VelocityChart } from '@/components/momentum/VelocityChart';
import { ArtifactCard } from '@/components/artifacts/ArtifactCard';
import { getLatestChangelog } from '@/lib/queries/public-changelog';
import { listArtifacts } from '@/lib/queries/public-artifacts';
import { listRecentPublicContent } from '@/lib/queries/public-content';
import { getMomentumLast30Days } from '@/lib/queries/public-momentum';
import PageShell from '@/components/layout/PageShell';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Insights & Proof of Work | Sunny Singh',
};

export default async function InsightsHomePage() {
  const [momentum, changelog, artifacts, recent] = await Promise.all([
    getMomentumLast30Days(),
    getLatestChangelog(),
    listArtifacts(),
    listRecentPublicContent(6),
  ]);

  return (
    <PageShell>
      <div className="space-y-12">
        <section>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900">
            Insights & Proof of Work
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Habits, shipped tasks, and artifacts — synced from my private Personal OS into this
            public library.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-gray-900">30-Day Momentum</h2>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/stack" className="text-primary hover:underline">
                View Stack
              </Link>
              <Link href="/collider" className="text-primary hover:underline">
                Concept Collider
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <MomentumHeatmap days={momentum} />
            <div className="mt-6">
              <VelocityChart days={momentum} />
            </div>
          </div>
        </section>

        {changelog ? (
          <section>
            <h2 className="font-serif text-2xl font-semibold text-gray-900">Latest Changelog</h2>
            <Link
              href={`/changelog/${changelog.slug}`}
              className="mt-4 block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-lg font-medium text-primary">{changelog.title}</p>
              <p className="mt-2 text-sm text-gray-500">{changelog.wordCount} words</p>
            </Link>
          </section>
        ) : null}

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-gray-900">Artifacts</h2>
            {artifacts.length > 4 ? (
              <Link href="/artifacts" className="text-sm font-medium text-primary hover:underline">
                View all →
              </Link>
            ) : null}
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {artifacts.slice(0, 4).map((a) => (
              <ArtifactCard key={a.slug} artifact={a} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold text-gray-900">Recent Notes</h2>
          <ul className="mt-4 space-y-3">
            {recent.map((r) => (
              <li key={r.slug} className="flex items-center gap-3">
                <Link href={`/insights/${r.slug}`} className="text-lg text-primary hover:underline">
                  {r.title}
                </Link>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {r.sourceType}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section id="ask" className="rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <h2 className="font-serif text-2xl font-semibold text-gray-900">Ask My AI Assistant</h2>
          <p className="mt-2 text-gray-600">
            Answers use only public material from this library — not my private assistant.
          </p>
          <div className="mt-6">
            <AskSunnyChat />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
