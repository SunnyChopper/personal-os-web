import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { vaultItemsService } from '@/services/knowledge-vault/vault-items.service';
import type { VaultItem, VaultItemType } from '@/types/knowledge-vault';
import { formatApiError } from '@/utils/api-error-formatter';
import { cn } from '@/lib/utils';

export interface MultiSelectVaultComboboxProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  minItems?: number;
  maxItems?: number;
  /** Optional map id -> title for pills when item not in hits */
  labelLookup?: Record<string, string>;
  /** Vault item types shown in search results (default: notes + documents) */
  allowedTypes?: VaultItemType[];
  /** Label for the selection hint, e.g. "documents" or "sources" */
  itemLabel?: string;
  /** Fires when resolved pill labels change (e.g. after search picks). */
  onLabelLookupChange?: (labels: Record<string, string>) => void;
}

const DEFAULT_ALLOWED_TYPES: VaultItemType[] = ['note', 'document'];
const DEBOUNCE_MS = 300;
const MAX_HITS = 20;
const MIN_SEARCH_LENGTH = 2;

function formatVaultSearchError(
  apiError: import('@/types/api-contracts').ApiError | null | undefined,
  fallbackMessage: string | null | undefined
): string {
  if (apiError) return formatApiError(apiError);
  if (fallbackMessage?.trim()) return fallbackMessage;
  return 'Failed to search Knowledge Vault. Please try again.';
}

export function MultiSelectVaultCombobox({
  selectedIds,
  onSelectionChange,
  minItems = 2,
  maxItems = 5,
  labelLookup = {},
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  itemLabel = 'documents',
  onLabelLookupChange,
}: MultiSelectVaultComboboxProps) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<VaultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  /** Titles learned from search picks so pills stay readable after the hit list clears */
  const [pickedTitles, setPickedTitles] = useState<Record<string, string>>({});
  const requestGenerationRef = useRef(0);

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

  const allowedSet = useMemo(() => new Set(allowedTypes), [allowedTypes]);

  const trimmedQuery = q.trim();
  const showDropdown =
    open && (trimmedQuery.length === 0 || trimmedQuery.length >= MIN_SEARCH_LENGTH);

  const runFetch = useCallback(
    async (query: string) => {
      const t = query.trim();
      if (t.length === 1) {
        setHits([]);
        setSearchError(null);
        setLoading(false);
        return;
      }

      const generation = ++requestGenerationRef.current;
      setLoading(true);
      setSearchError(null);

      try {
        const res =
          t.length >= MIN_SEARCH_LENGTH
            ? await vaultItemsService.search(t)
            : await vaultItemsService.getAll({ pageSize: MAX_HITS });

        if (generation !== requestGenerationRef.current) return;

        if (res.success && res.data) {
          const filtered = res.data.filter((i) => allowedSet.has(i.type));
          setHits(filtered.slice(0, MAX_HITS));
          setSearchError(null);
        } else {
          setHits([]);
          setSearchError(formatVaultSearchError(res.apiError, res.error));
        }
      } catch {
        if (generation !== requestGenerationRef.current) return;
        setHits([]);
        setSearchError('Failed to search Knowledge Vault. Please try again.');
      } finally {
        if (generation === requestGenerationRef.current) {
          setLoading(false);
        }
      }
    },
    [allowedSet]
  );

  useEffect(() => {
    if (!open) return;
    const h = window.setTimeout(() => void runFetch(q), DEBOUNCE_MS);
    return () => window.clearTimeout(h);
  }, [q, open, runFetch]);

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

  useEffect(() => {
    onLabelLookupChange?.(mergedLabels);
  }, [mergedLabels, onLabelLookupChange]);

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
        Select {minItems}–{maxItems} {itemLabel} ({selectedIds.length} selected)
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
            setSearchError(null);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Search vault by title or content…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
          aria-invalid={searchError ? true : undefined}
          aria-describedby={searchError ? 'vault-combobox-search-error' : undefined}
        />
        {searchError ? (
          <p
            id="vault-combobox-search-error"
            className="mt-1 text-sm text-red-600 dark:text-red-400 whitespace-pre-line"
          >
            {searchError}
          </p>
        ) : null}
        {showDropdown && (
          <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg text-sm">
            {loading && <li className="px-3 py-2 text-gray-500">Searching…</li>}
            {!loading && trimmedQuery.length === 0 && hits.length > 0 && (
              <li className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                Recent vault items
              </li>
            )}
            {!loading &&
              hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    disabled={selectedSet.has(h.id)}
                    onMouseDown={(e) => e.preventDefault()}
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
            {!loading && !searchError && hits.length === 0 && (
              <li className="px-3 py-2 text-gray-500">
                {trimmedQuery.length >= MIN_SEARCH_LENGTH ? 'No matches' : 'No recent items'}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
