import { AskSunnyChat } from '@/components/chat/AskSunnyChat';
import PageShell from '@/components/layout/PageShell';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ask Sunny | AI (public library) | Sunny Singh',
  description:
    'Ask questions about public notes, changelog, and artifacts on this site. Uses only published material, not a private assistant.',
};

export default function AskSunnyPage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <p>
          <Link href="/insights" className="text-sm font-medium text-primary hover:underline">
            ← Back to Insights
          </Link>
        </p>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900">
          Ask (public library)
        </h1>
        <p className="text-lg text-gray-600">
          Answers are grounded in public content from this site only — not my private Personal OS
          assistant.
        </p>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <AskSunnyChat />
        </div>
      </div>
    </PageShell>
  );
}
