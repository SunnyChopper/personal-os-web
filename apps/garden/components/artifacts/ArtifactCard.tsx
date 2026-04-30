import Link from 'next/link';
import type { ArtifactRow } from '@/lib/queries/public-artifacts';

export function ArtifactCard({ artifact: a }: { artifact: ArtifactRow }) {
  return (
    <Link
      href={`/artifacts/${a.slug}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="font-semibold text-primary">{a.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.summary}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>
          <dt>API burn ($)</dt>
          <dd className="font-medium text-gray-900">{a.apiCapitalBurnedUsd ?? '—'}</dd>
        </div>
        <div>
          <dt>Time saved (h)</dt>
          <dd className="font-medium text-gray-900">{a.humanTimeSavedHours ?? '—'}</dd>
        </div>
      </dl>
    </Link>
  );
}
