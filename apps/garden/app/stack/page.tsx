import { PublicSkillTree } from '@/components/skills/PublicSkillTree';
import PageShell from '@/components/layout/PageShell';
import { getPublicSkillGraph } from '@/lib/queries/public-skills';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Stack | Sunny Singh',
};

export default async function StackPage() {
  const graph = await getPublicSkillGraph();
  return (
    <PageShell>
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="font-sans text-3xl font-bold">Public skill graph</h1>
        <p className="text-gray-600">Read-only view of published skills and dependencies.</p>
        <div className="h-[520px] rounded-lg border border-gray-200 bg-gray-50">
          <PublicSkillTree nodes={graph.nodes} edges={graph.edges} />
        </div>
      </div>
    </PageShell>
  );
}
