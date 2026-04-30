import { useEffect, useState } from 'react';
import { householdService, type HouseholdDashboard } from '@/services/household/household.service';

export default function HouseholdHomePage() {
  const [data, setData] = useState<HouseholdDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await householdService.getDashboard();
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Could not load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500 text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
        <h2 className="text-sm font-medium text-slate-300">Dropzone</h2>
        <p className="text-2xl font-semibold">{data.pendingDropzoneCount}</p>
        <p className="text-xs text-slate-500">pending / triaging captures</p>
      </section>

      {!data.logisticsConfigured && (
        <p className="text-xs text-amber-300/90">
          Meal & pet logistics need Postgres (`DATABASE_URL` + migration 010). Dropzone still works.
        </p>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
        <h2 className="text-sm font-medium text-slate-300 mb-2">Recent captures</h2>
        <ul className="space-y-2 text-sm">
          {data.recentCaptures.slice(0, 5).map((c) => (
            <li key={String(c.id)} className="border-b border-slate-800/80 pb-2 last:border-0">
              <span className="text-slate-400 text-xs">{String(c.captureStatus || '')}</span>
              <p className="text-slate-200 line-clamp-2">{String(c.rawContent || '')}</p>
            </li>
          ))}
          {data.recentCaptures.length === 0 && <li className="text-slate-500">No captures yet.</li>}
        </ul>
      </section>

      {data.lowStockPets.length > 0 && (
        <section className="rounded-xl border border-amber-900/40 bg-amber-950/30 p-3">
          <h2 className="text-sm font-medium text-amber-200">Low stock</h2>
          <ul className="text-sm text-amber-100/90 mt-1 space-y-1">
            {data.lowStockPets.map((p) => (
              <li key={String(p.id)}>
                {String(p.petName)} — {String(p.itemName)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
