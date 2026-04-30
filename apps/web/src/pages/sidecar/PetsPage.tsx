import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import { householdService } from '@/services/household/household.service';

export default function PetsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [itemName, setItemName] = useState('');
  const [onHand, setOnHand] = useState('');
  const [burn, setBurn] = useState('');
  const [threshold, setThreshold] = useState('');

  const load = async () => {
    const res = await householdService.listPetSupplies();
    if (res.success && res.data) {
      setRows(res.data);
      setError(null);
    } else {
      setError(res.error?.message || 'Could not load supplies');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addOrUpdate = async () => {
    if (!petName.trim() || !itemName.trim()) return;
    const res = await householdService.upsertPetSupply({
      petName: petName.trim(),
      itemName: itemName.trim(),
      onHandQuantity: onHand === '' ? undefined : Number(onHand),
      dailyBurnRate: burn === '' ? undefined : Number(burn),
      reorderThreshold: threshold === '' ? undefined : Number(threshold),
    });
    if (res.success) {
      setPetName('');
      setItemName('');
      setOnHand('');
      setBurn('');
      setThreshold('');
      await load();
    } else {
      setError(res.error?.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2 text-sm">
        <h2 className="text-slate-300 text-sm font-medium">Add / update item</h2>
        <input
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5"
          placeholder="Pet name"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5"
          placeholder="Item (e.g. dry food)"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5"
            placeholder="On hand"
            value={onHand}
            onChange={(e) => setOnHand(e.target.value)}
          />
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5"
            placeholder="Daily burn"
            value={burn}
            onChange={(e) => setBurn(e.target.value)}
          />
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5"
            placeholder="Reorder ≤"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
        <Button type="button" onClick={() => void addOrUpdate()}>
          Save
        </Button>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={String(r.id)} className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-sm">
            <div className="font-medium text-slate-200">
              {String(r.petName)} — {String(r.itemName)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              On hand: {String(r.onHandQuantity ?? '—')} · Burn: {String(r.dailyBurnRate ?? '—')} / day
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200"
                onClick={() =>
                  householdService.adjustPetSupply(String(r.id), 1, 'restock').then(() => load())
                }
              >
                +1 restock
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200"
                onClick={() =>
                  householdService.adjustPetSupply(String(r.id), -1, 'use').then(() => load())
                }
              >
                −1 use
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
