import { useQuery } from '@tanstack/react-query';
import { listAgencyArtifacts } from '@/services/agency/agency-artifacts.service';

export default function AgencyArtifactsPage() {
  const q = useQuery({ queryKey: ['agency-artifacts'], queryFn: listAgencyArtifacts });
  if (q.isLoading) return <div className="p-6">Loading…</div>;
  if (q.isError) return <div className="p-6 text-red-400">Failed to load artifacts</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Agency artifacts</h1>
      <p className="text-sm text-gray-400">
        Manage micro-app showcases. Publishing syncs to the public digital garden Postgres schema.
      </p>
      <ul className="space-y-2">
        {q.data?.map((a) => (
          <li key={a.id} className="rounded border border-gray-700 p-3">
            <div className="font-medium">{a.title}</div>
            <div className="text-xs text-gray-500">
              public: {a.isPublic ? 'yes' : 'no'} · order {a.displayOrder}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
