import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import { householdService } from '@/services/household/household.service';

function mondayOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function MealsPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOfWeek(new Date()).toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await householdService.getMealsWeek(weekStart);
    if (res.success && res.data) {
      setEntries(res.data);
      setError(null);
    } else {
      setError(res.error?.message || 'Could not load meals');
    }
  };

  useEffect(() => {
    void load();
  }, [weekStart]);

  const slots = useMemo(() => ['breakfast', 'lunch', 'dinner'], []);

  const grid = useMemo(() => {
    const byDay: Record<number, Record<string, Record<string, unknown>>> = {};
    for (const e of entries) {
      const dow = Number(e.dayOfWeek);
      const slot = String(e.mealSlot);
      if (!byDay[dow]) byDay[dow] = {};
      byDay[dow][slot] = e;
    }
    return byDay;
  }, [entries]);

  const setCell = (day: number, slot: string, dishName: string) => {
    const next = [...entries.filter((e) => !(Number(e.dayOfWeek) === day && String(e.mealSlot) === slot))];
    next.push({ dayOfWeek: day, mealSlot: slot, dishName });
    setEntries(next);
  };

  const save = async () => {
    const res = await householdService.putMealsWeek(weekStart, entries);
    if (res.success && res.data) {
      setEntries(res.data);
      setError(null);
    } else {
      setError(res.error?.message || 'Save failed');
    }
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      <label className="block text-xs text-slate-500">
        Week starts (Monday)
        <input
          type="date"
          className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-left text-slate-500" />
              {dayLabels.map((l) => (
                <th key={l} className="p-1 text-slate-400 font-medium">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot}>
                <td className="p-1 text-slate-500 capitalize align-top">{slot}</td>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                  const cell = grid[d]?.[slot];
                  const val = String((cell?.dishName as string) || '');
                  return (
                    <td key={`${d}-${slot}`} className="p-0.5 align-top">
                      <input
                        className="w-full min-w-[72px] rounded border border-slate-800 bg-slate-900 px-1 py-1 text-[11px]"
                        value={val}
                        placeholder="—"
                        onChange={(e) => setCell(d, slot, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" onClick={() => void save()}>
        Save week
      </Button>
    </div>
  );
}
