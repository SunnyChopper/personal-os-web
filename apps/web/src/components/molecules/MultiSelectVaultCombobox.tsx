import { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { vaultItemsService } from '@/services/knowledge-vault/vault-items.service';
import type { VaultItem } from '@/types/knowledge-vault';
import { cn } from '@/lib/utils';

export interface MultiSelectVaultComboboxProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  minItems?: number;
  maxItems?: number;
  /** Optional map id -> title for pills when item not in hits */
  labelLookup?: Record<string, string>;
}

export function MultiSelectVaultCombobox({
  selectedIds,
  onSelectionChange,
  minItems = 2,
  maxItems = 5,
  labelLookup = {},
}: MultiSelectVaultComboboxProps) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<VaultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /** Titles learned from search picks so pills stay readable after the hit list clears */
  const [pickedTitles, setPickedTitles] = useState<Record<string, string>>({});

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const mergedLabels = useMemo(
    () => ({ ...labelLookup, ...pickedTitles }),
    [labelLookup, pickedTitles]
  );

  const selectedItems = useMemo(() => {
    const byId = new Map(hits.map((h) => [h.id, h]));
    return selectedIds.map(
      (id) => byId.get(id) ?? ({ id, title: mergedLabels[id] || id, type: 'note' } as VaultItem)
    );
  }, [selectedIds, hits, mergedLabels]);

  const runSearch = useCallback(async (query: string) => {
    const t = query.trim();
    if (t.length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    try {
      const res = await vaultItemsService.search(t);
      if (res.success && res.data) {
        const notesDocs = res.data.filter((i) => i.type === 'note' || i.type === 'document');
        setHits(notesDocs.slice(0, 20));
      } else setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const h = window.setTimeout(() => void runSearch(q), 300);
    return () => window.clearTimeout(h);
  }, [q, runSearch]);

  useEffect(() => {
    setPickedTitles((prev) => {
      const sel = new Set(selectedIds);
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!sel.has(k)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedIds]);

  const add = (item: VaultItem) => {
    if (selectedSet.has(item.id)) return;
    if (selectedIds.length >= maxItems) return;
    setPickedTitles((prev) => ({ ...prev, [item.id]: item.title }));
    onSelectionChange([...selectedIds, item.id]);
    setQ('');
    setOpen(false);
  };

  const remove = (id: string) => {
    setPickedTitles((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onSelectionChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Select {minItems}–{maxItems} documents ({selectedIds.length} selected)
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((it) => (
          <span
            key={it.id}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-sm"
          >
            <span className="truncate max-w-[200px]">{it.title}</span>
            <button
              type="button"
              className="p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
              aria-label={`Remove ${it.title}`}
              onClick={() => remove(it.id)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search vault by title or content…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
        />
        {open && q.trim().length >= 2 && (
          <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg text-sm">
            {loading && <li className="px-3 py-2 text-gray-500">Searching…</li>}
            {!loading &&
              hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    disabled={selectedSet.has(h.id)}
                    onClick={() => add(h)}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
                      selectedSet.has(h.id) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="font-medium">{h.title}</span>
                    <span className="text-xs text-gray-500 ml-2">{h.type}</span>
                  </button>
                </li>
              ))}
            {!loading && hits.length === 0 && (
              <li className="px-3 py-2 text-gray-500">No matches</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
