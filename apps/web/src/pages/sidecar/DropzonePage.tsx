import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import { householdService } from '@/services/household/household.service';

const PRESETS = [
  { id: 'honey-do', label: 'Honey-Do' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'reminder', label: 'Reminder' },
] as const;

export default function DropzonePage() {
  const [text, setText] = useState('');
  const [preset, setPreset] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await householdService.listCaptures();
    if (res.success && res.data) {
      setItems(res.data);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await householdService.submitDropzone(text.trim(), preset);
    setBusy(false);
    if (res.success) {
      setText('');
      setMsg('Sent — triage running in the background.');
      await load();
    } else {
      setMsg(res.error?.message || 'Submit failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id === preset ? undefined : p.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
              preset === p.id
                ? 'bg-slate-100 text-slate-900 border-slate-100'
                : 'border-slate-700 text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        className="w-full min-h-[140px] rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600"
        placeholder="What do we need? (e.g. cat food, print silk filament, trash night)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <Button type="button" onClick={() => void submit()} disabled={busy || !text.trim()}>
        {busy ? 'Sending…' : 'Submit'}
      </Button>

      {msg && <p className="text-sm text-slate-400">{msg}</p>}

      <div>
        <h2 className="text-sm font-medium text-slate-300 mb-2">Recent</h2>
        <ul className="space-y-3">
          {items.map((c) => (
            <li
              key={String(c.id)}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-2 text-sm"
            >
              <div className="flex justify-between text-xs text-slate-500">
                <span>{String(c.captureStatus || '')}</span>
                <span className="line-clamp-1">{String(c.preset || '')}</span>
              </div>
              <p className="text-slate-200 mt-1">{String(c.rawContent || '')}</p>
              {c.ownerSummary ? (
                <p className="text-xs text-slate-500 mt-1">{String(c.ownerSummary)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
