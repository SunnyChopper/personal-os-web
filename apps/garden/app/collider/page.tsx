import { PublicConceptCollider } from '@/components/collider/PublicConceptCollider';
import PageShell from '@/components/layout/PageShell';
import { listColliderNodes } from '@/lib/queries/public-collider';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Concept Collider | Sunny Singh',
};

export default async function ColliderPage() {
  const nodes = await listColliderNodes(15);
  return (
    <PageShell>
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="font-sans text-3xl font-bold">Concept collider</h1>
        <p className="text-gray-600">
          Drag two curated public notes together to synthesize a new idea. Uses only public garden
          content.
        </p>
        <div className="h-[560px] rounded-lg border border-gray-200 bg-gray-50">
          <PublicConceptCollider initialNodes={nodes} />
        </div>
      </div>
    </PageShell>
  );
}
