import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssistantToolApprovalMode, AssistantToolRegistryEntry } from '@/types/api-contracts';

const MODE_OPTIONS: { value: AssistantToolApprovalMode; label: string; hint: string }[] = [
  {
    value: 'dangerousOnly',
    label: 'Confirm dangerous tools only',
    hint: 'Only tools you mark below require an in-chat approval before they run.',
  },
  {
    value: 'allWrites',
    label: 'Confirm all write actions',
    hint: 'Every tool that changes data needs your approval in the assistant chat.',
  },
  {
    value: 'none',
    label: 'Auto-approve everything',
    hint: 'No approval prompts; the assistant runs write tools as soon as the model plans them.',
  },
];

export type AssistantToolApprovalFormProps = {
  mode: AssistantToolApprovalMode;
  dangerousSet: Set<string>;
  registry: AssistantToolRegistryEntry[];
  onModeChange: (mode: AssistantToolApprovalMode) => void;
  onDangerousSetChange: (next: Set<string>) => void;
  onFormInteraction?: () => void;
};

export function AssistantToolApprovalForm({
  mode,
  dangerousSet,
  registry,
  onModeChange,
  onDangerousSetChange,
  onFormInteraction,
}: AssistantToolApprovalFormProps) {
  const [toolSearch, setToolSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const didSeedExpanded = useRef(false);

  const writeToolsByCategory = useMemo(() => {
    const m = new Map<string, AssistantToolRegistryEntry[]>();
    for (const t of registry.filter((x) => !x.safeRead)) {
      const list = m.get(t.category) ?? [];
      list.push(t);
      m.set(t.category, list);
    }
    for (const [, list] of m) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [registry]);

  const filteredCategories = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    if (!q) return writeToolsByCategory;
    return writeToolsByCategory
      .map(([category, tools]) => {
        const filtered = tools.filter(
          (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
        return [category, filtered] as const;
      })
      .filter(([, tools]) => tools.length > 0);
  }, [writeToolsByCategory, toolSearch]);

  useEffect(() => {
    if (didSeedExpanded.current || mode !== 'dangerousOnly') return;
    const initial = new Set<string>();
    for (const [cat, tools] of writeToolsByCategory) {
      if (tools.some((t) => dangerousSet.has(t.name))) {
        initial.add(cat);
      }
    }
    if (initial.size > 0) {
      didSeedExpanded.current = true;
      setExpandedCategories(initial);
    }
  }, [mode, writeToolsByCategory, dangerousSet]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const expandAllFiltered = useCallback(() => {
    setExpandedCategories(new Set(filteredCategories.map(([c]) => c)));
  }, [filteredCategories]);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  const toggleTool = useCallback(
    (name: string) => {
      const next = new Set(dangerousSet);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      onDangerousSetChange(next);
      onFormInteraction?.();
    },
    [dangerousSet, onDangerousSetChange, onFormInteraction]
  );

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Approval mode
        </legend>
        {MODE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer gap-3 rounded-lg border-2 p-3 transition ${
              mode === opt.value
                ? 'border-blue-500 bg-blue-50/80 dark:border-blue-600 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <input
              type="radio"
              name="assistant-hitl-mode"
              value={opt.value}
              checked={mode === opt.value}
              onChange={() => {
                onModeChange(opt.value);
                onFormInteraction?.();
              }}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{opt.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{opt.hint}</div>
            </div>
          </label>
        ))}
      </fieldset>

      {mode === 'dangerousOnly' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Tools that require approval
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
                Checked write tools trigger an in-chat approve / reject step. Read-only tools are
                not listed.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={expandAllFiltered}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Collapse all
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/40 px-3 py-2">
            <Search size={16} className="text-gray-500 shrink-0" aria-hidden />
            <input
              type="search"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder="Filter tools by name or description…"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 outline-none"
              autoComplete="off"
            />
          </label>

          <div className="space-y-2 max-h-[min(28rem,55vh)] overflow-y-auto pr-1 -mr-1">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No tools match your filter.
              </p>
            ) : (
              filteredCategories.map(([category, tools]) => {
                const approvedCount = tools.filter((t) => dangerousSet.has(t.name)).length;
                const isOpen = expandedCategories.has(category);
                return (
                  <div
                    key={category}
                    className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left bg-gray-50/90 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/80 transition"
                      aria-expanded={isOpen}
                    >
                      <ChevronRight
                        size={18}
                        className={cn(
                          'shrink-0 text-gray-500 transition-transform',
                          isOpen && 'rotate-90'
                        )}
                        aria-hidden
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-100 flex-1">
                        {category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                        {approvedCount > 0 ? (
                          <>
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              {approvedCount}
                            </span>
                            {' / '}
                          </>
                        ) : null}
                        {tools.length} write{tools.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="border-t border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700/80 bg-white dark:bg-gray-800/40">
                        {tools.map((t) => (
                          <li key={t.name} className="px-3 py-2">
                            <label className="flex items-start gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={dangerousSet.has(t.name)}
                                onChange={() => toggleTool(t.name)}
                                className="mt-0.5 rounded border-gray-300 dark:border-gray-600"
                              />
                              <span>
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                                  {t.name}
                                </code>
                                <span className="text-gray-600 dark:text-gray-400 ml-2">
                                  {t.description}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
