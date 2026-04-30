import { ArtifactCard } from "@/components/artifacts/ArtifactCard";
import PageShell from "@/components/layout/PageShell";
import { listArtifacts } from "@/lib/queries/public-artifacts";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Artifacts | Sunny Singh",
};

export default async function ArtifactsPage() {
  const artifacts = await listArtifacts();
  return (
    <PageShell>
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="font-sans text-3xl font-bold">Agency artifacts</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {artifacts.map((a) => (
            <ArtifactCard key={a.slug} artifact={a} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
