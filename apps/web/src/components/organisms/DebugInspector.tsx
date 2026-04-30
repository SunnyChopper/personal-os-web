import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Query } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Bug,
  RefreshCcw,
  Trash2,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  Camera,
  Split,
} from 'lucide-react';
import { useAuth } from '@/contexts/Auth';
import { useMode } from '@/contexts/Mode';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { buildDebugSnapshot } from '@/lib/debug/snapshot';
import { sanitizeForSnapshot } from '@/lib/debug/redact';
import { getZustandStores, getZustandStoreStates } from '@/lib/debug/zustand-registry';
import { JsonViewer } from '../molecules/JsonViewer';

type TabKey = 'query' | 'zustand' | 'app' | 'export';

const isDev = import.meta.env.DEV;

const DEBUG_FAB_STORAGE_KEY = 'personal-os-debug-fab-corner';

type DebugFabCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

function readStoredDebugFabCorner(): DebugFabCorner {
  try {
    const v = localStorage.getItem(DEBUG_FAB_STORAGE_KEY);
    if (v === 'top-left' || v === 'top-right' || v === 'bottom-left' || v === 'bottom-right') {
      return v;
    }
  } catch {
    /* ignore */
  }
  return 'bottom-right';
}

function computeDebugFabPosition(
  corner: DebugFabCorner,
  fabWidth: number,
  fabHeight: number
): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isLg = vw >= 1024;
  const insetX = isLg ? 24 : 12;
  const insetTop = isLg ? 24 : 12;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const insetBottom = isLg ? 24 : 5.25 * rem;

  switch (corner) {
    case 'top-left':
      return { left: insetX, top: insetTop };
    case 'top-right':
      return { left: vw - fabWidth - insetX, top: insetTop };
    case 'bottom-left':
      return { left: insetX, top: vh - fabHeight - insetBottom };
    case 'bottom-right':
    default:
      return { left: vw - fabWidth - insetX, top: vh - fabHeight - insetBottom };
  }
}

function cornerFromDragRelease(
  left: number,
  top: number,
  fabWidth: number,
  fabHeight: number
): DebugFabCorner {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = left + fabWidth / 2;
  const cy = top + fabHeight / 2;
  if (cx < vw / 2) {
    return cy < vh / 2 ? 'top-left' : 'bottom-left';
  }
  return cy < vh / 2 ? 'top-right' : 'bottom-right';
}

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'query', label: 'TanStack Query' },
  { id: 'zustand', label: 'Zustand' },
  { id: 'app', label: 'App State' },
  { id: 'export', label: 'Export' },
];

const formatTimestamp = (value: number) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const stringifyKey = (key: unknown) => {
  try {
    return JSON.stringify(key);
  } catch {
    return String(key);
  }
};

const getQueryGroup = (query: Query) => {
  const key = query.queryKey;
  if (Array.isArray(key) && typeof key[0] === 'string') {
    return key[0];
  }
  return 'other';
};

const truncateJson = (value: unknown, maxLength = 20000) => {
  const json = JSON.stringify(sanitizeForSnapshot(value), null, 2);
  if (json.length <= maxLength) return json;
  return `${json.slice(0, maxLength)}\n... (truncated)`;
};

function extractProjectCandidates(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.projects)) return obj.projects;

    if ('data' in obj && obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.projects)) return inner.projects;
      if (Array.isArray(inner.data)) return inner.data;
    }

    if (Array.isArray(obj.data)) return obj.data;
  }

  return [];
}

function getProjectDateDiagnostics(queries: Query[]) {
  const legacyEndDatePresent: Array<{ id: string; endDate: string | null }> = [];
  const seenIds = new Set<string>();

  queries.forEach((query) => {
    const candidates = extractProjectCandidates(query.state.data);
    candidates.forEach((candidate) => {
      if (!candidate || typeof candidate !== 'object') return;
      const project = candidate as Record<string, unknown>;
      const id = typeof project.id === 'string' ? project.id : null;
      if (!id || seenIds.has(id)) return;

      const endDate = (project.endDate as string | null | undefined) ?? null;
      const targetEndDate =
        (project.targetEndDate as string | null | undefined) ??
        (project.target_end_date as string | null | undefined) ??
        null;

      // Backend now uses targetEndDate; endDate is legacy.
      if (endDate && (!targetEndDate || targetEndDate.trim?.() === '')) {
        legacyEndDatePresent.push({ id, endDate });
        seenIds.add(id);
      }
    });
  });

  return {
    missingEndDateCount: legacyEndDatePresent.length,
    examples: legacyEndDatePresent.slice(0, 5),
  };
}

export function DebugInspector() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, loading: authLoading, error: authError } = useAuth();
  const { isLeisureMode } = useMode();
  const { status: backendStatus } = useBackendStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('query');
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonSearchTerm, setJsonSearchTerm] = useState('');
  const [selectedQueryHash, setSelectedQueryHash] = useState<string | null>(null);
  const [selectedMutationIndex, setSelectedMutationIndex] = useState<number | null>(null);
  const [includeQueryData, setIncludeQueryData] = useState(true);
  const [includeMutationData, setIncludeMutationData] = useState(true);
  const [liveZustand, setLiveZustand] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hideEmptyQueries, setHideEmptyQueries] = useState(false);
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [showErrorOnly, setShowErrorOnly] = useState(false);
  const [pinnedSnapshot, setPinnedSnapshot] = useState<{
    queryHash: string;
    data: unknown;
    capturedAt: number;
  } | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const debugFabButtonRef = useRef<HTMLButtonElement | null>(null);
  const [debugFabCorner, setDebugFabCorner] = useState<DebugFabCorner>(readStoredDebugFabCorner);
  const [debugFabDrag, setDebugFabDrag] = useState<{ left: number; top: number } | null>(null);
  const [debugFabDragging, setDebugFabDragging] = useState(false);
  const [debugFabLayoutTick, setDebugFabLayoutTick] = useState(0);
  const [debugFabSize, setDebugFabSize] = useState({ w: 120, h: 44 });
  const debugFabDragSessionRef = useRef<{
    pointerId: number;
    originLeft: number;
    originTop: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const debugFabDragPixelRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  const suppressDebugFabClickRef = useRef(false);

  useEffect(() => {
    if (!isDev) return;
    try {
      localStorage.setItem(DEBUG_FAB_STORAGE_KEY, debugFabCorner);
    } catch {
      /* ignore */
    }
  }, [debugFabCorner]);

  useEffect(() => {
    if (!isDev) return;
    const onResize = () => {
      if (debugFabDragSessionRef.current) return;
      setDebugFabLayoutTick((n) => n + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isDev]);

  useLayoutEffect(() => {
    if (!isDev) return;
    const el = debugFabButtonRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    setDebugFabSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, [isDev, debugFabCorner, debugFabLayoutTick, debugFabDrag, isOpen]);

  useEffect(() => {
    if (!isDev) return;

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    const onPointerMove = (e: PointerEvent) => {
      const d = debugFabDragSessionRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const btn = debugFabButtonRef.current;
      const bw = btn?.offsetWidth ?? 0;
      const bh = btn?.offsetHeight ?? 0;
      let left = d.originLeft + (e.clientX - d.startX);
      let top = d.originTop + (e.clientY - d.startY);
      left = clamp(left, 0, window.innerWidth - bw);
      top = clamp(top, 0, window.innerHeight - bh);
      if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 6) {
        d.moved = true;
      }
      debugFabDragPixelRef.current = { left, top };
      setDebugFabDrag({ left, top });
    };

    const onPointerUp = (e: PointerEvent) => {
      const d = debugFabDragSessionRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      debugFabDragSessionRef.current = null;
      try {
        debugFabButtonRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore if not captured */
      }
      const btn = debugFabButtonRef.current;
      const bw = btn?.offsetWidth ?? 0;
      const bh = btn?.offsetHeight ?? 0;
      const { left, top } = debugFabDragPixelRef.current;
      const nextCorner = cornerFromDragRelease(left, top, bw, bh);
      if (d.moved) {
        suppressDebugFabClickRef.current = true;
      }
      setDebugFabCorner(nextCorner);
      setDebugFabDrag(null);
      setDebugFabDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDev]);

  useEffect(() => {
    if (!isDev) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isDev) return;
    const handleToggleEvent = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggleDebugInspector', handleToggleEvent);
    return () => window.removeEventListener('toggleDebugInspector', handleToggleEvent);
  }, []);

  useEffect(() => {
    if (!isDev) return;
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isDev || !isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (!isDev) return;
    const queryUnsubscribe = queryClient.getQueryCache().subscribe(() => {
      setCacheVersion((prev) => prev + 1);
    });
    const mutationUnsubscribe = queryClient.getMutationCache().subscribe(() => {
      setCacheVersion((prev) => prev + 1);
    });
    return () => {
      queryUnsubscribe();
      mutationUnsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!liveZustand) return;
    const stores = getZustandStores();
    const unsubscribers = stores.map(({ store }) =>
      store.subscribe(() => setCacheVersion((prev) => prev + 1))
    );
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [liveZustand]);

  const queries = useMemo(() => {
    void cacheVersion;
    return queryClient.getQueryCache().getAll();
  }, [queryClient, cacheVersion]);

  const mutations = useMemo(() => {
    void cacheVersion;
    return queryClient.getMutationCache().getAll();
  }, [queryClient, cacheVersion]);

  const diagnostics = useMemo(() => getProjectDateDiagnostics(queries), [queries]);

  const groupedQueries = useMemo(() => {
    const groups = new Map<string, Query[]>();
    queries.forEach((query) => {
      const group = getQueryGroup(query);
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(query);
    });
    return groups;
  }, [queries]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedQueries;

    const term = searchTerm.toLowerCase();
    const filtered = new Map<string, Query[]>();
    groupedQueries.forEach((items, group) => {
      const matches = items.filter((query) =>
        stringifyKey(query.queryKey).toLowerCase().includes(term)
      );
      if (matches.length) {
        filtered.set(group, matches);
      }
    });
    return filtered;
  }, [groupedQueries, searchTerm]);

  const visibleGroups = useMemo(() => {
    const filtered = new Map<string, Query[]>();
    filteredGroups.forEach((items, group) => {
      const matches = items.filter((query) => {
        const hasData = query.state.data !== undefined && query.state.data !== null;
        const hasError = query.state.error !== undefined && query.state.error !== null;
        return (
          (!hideEmptyQueries || hasData || hasError) &&
          (!showStaleOnly || query.isStale()) &&
          (!showErrorOnly || hasError || query.state.status === 'error')
        );
      });
      if (matches.length) {
        filtered.set(group, matches);
      }
    });
    return filtered;
  }, [filteredGroups, hideEmptyQueries, showStaleOnly, showErrorOnly]);

  const selectedQuery = useMemo(() => {
    if (!selectedQueryHash) return null;
    return queries.find((query) => query.queryHash === selectedQueryHash) || null;
  }, [queries, selectedQueryHash]);

  const sanitizedSelectedData = useMemo(() => {
    if (!selectedQuery) return null;
    return sanitizeForSnapshot(selectedQuery.state.data);
  }, [selectedQuery]);

  const sanitizedSelectedError = useMemo(() => {
    if (!selectedQuery) return null;
    return sanitizeForSnapshot(selectedQuery.state.error);
  }, [selectedQuery]);

  const observerSummaries = useMemo(() => {
    if (!selectedQuery) return [];
    return selectedQuery.observers.map((observer, index) => {
      const observerAny = observer as unknown as { options?: Record<string, unknown> };
      const options = observerAny.options ?? {};
      return {
        index,
        enabled: options.enabled ?? 'unknown',
        staleTime: options.staleTime ?? 'default',
        gcTime: options.gcTime ?? 'default',
        refetchOnWindowFocus: options.refetchOnWindowFocus ?? 'default',
        refetchOnMount: options.refetchOnMount ?? 'default',
        refetchOnReconnect: options.refetchOnReconnect ?? 'default',
        retry: options.retry ?? 'default',
      };
    });
  }, [selectedQuery]);

  const isPinnedForSelected =
    !!selectedQuery && pinnedSnapshot?.queryHash === selectedQuery.queryHash;

  const selectedMutation = useMemo(() => {
    if (selectedMutationIndex === null) return null;
    return mutations[selectedMutationIndex] || null;
  }, [mutations, selectedMutationIndex]);

  const debugFabDisplayPos = useMemo(() => {
    if (!isDev) return { left: 0, top: 0 };
    if (debugFabDrag) return debugFabDrag;
    return computeDebugFabPosition(debugFabCorner, debugFabSize.w, debugFabSize.h);
  }, [isDev, debugFabDrag, debugFabCorner, debugFabSize.w, debugFabSize.h, debugFabLayoutTick]);

  const onDebugFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const btn = debugFabButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    debugFabDragSessionRef.current = {
      pointerId: e.pointerId,
      originLeft: rect.left,
      originTop: rect.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    debugFabDragPixelRef.current = { left: rect.left, top: rect.top };
    setDebugFabDragging(true);
    setDebugFabDrag({ left: rect.left, top: rect.top });
    btn.setPointerCapture(e.pointerId);
  };

  const handleCopySnapshot = async () => {
    const snapshot = buildDebugSnapshot({
      queryClient,
      zustandStores: getZustandStoreStates(),
      appState: {
        route: location.pathname,
        auth: {
          hasUser: !!user,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          loading: authLoading,
          error: authError,
        },
        mode: {
          isLeisureMode,
        },
        backendStatus,
      },
      diagnostics,
      options: {
        includeQueryData,
        includeMutationData,
      },
    });

    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
  };

  const handleDownloadSnapshot = () => {
    const snapshot = buildDebugSnapshot({
      queryClient,
      zustandStores: getZustandStoreStates(),
      appState: {
        route: location.pathname,
        auth: {
          hasUser: !!user,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          loading: authLoading,
          error: authError,
        },
        mode: {
          isLeisureMode,
        },
        backendStatus,
      },
      diagnostics,
      options: {
        includeQueryData,
        includeMutationData,
      },
    });

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `debug-snapshot-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!isDev) {
    return null;
  }

  return (
    <>
      <button
        ref={debugFabButtonRef}
        type="button"
        onPointerDown={onDebugFabPointerDown}
        onClick={() => {
          if (suppressDebugFabClickRef.current) {
            suppressDebugFabClickRef.current = false;
            return;
          }
          setIsOpen(true);
        }}
        style={{
          left: debugFabDisplayPos.left,
          top: debugFabDisplayPos.top,
          right: 'auto',
          bottom: 'auto',
          touchAction: debugFabDragging ? 'none' : undefined,
          transition: debugFabDragging
            ? undefined
            : 'left 0.28s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.28s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
        className="fixed z-50 flex cursor-grab select-none items-center gap-2 rounded-full bg-gray-900 px-2.5 py-2 text-white shadow-lg active:cursor-grabbing hover:opacity-90 lg:px-3 dark:bg-gray-100 dark:text-gray-900"
        aria-label="Open debug inspector (drag to move)"
      >
        <Bug className="h-4 w-4 shrink-0" />
        <span className="hidden text-sm font-medium sm:inline">Debug</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close debug inspector"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div
            className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Debug Inspector
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ctrl+Shift+D to toggle • {location.pathname}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close debug inspector"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700 px-5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-300'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden h-full">
              {activeTab === 'query' && (
                <div className="grid grid-cols-12 gap-4 h-full min-h-0">
                  <div className="col-span-5 min-h-0 h-full border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Filter query keys..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300 mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hideEmptyQueries}
                          onChange={(event) => setHideEmptyQueries(event.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        Hide empty
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showStaleOnly}
                          onChange={(event) => setShowStaleOnly(event.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        Only stale
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showErrorOnly}
                          onChange={(event) => setShowErrorOnly(event.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        Only errors
                      </label>
                    </div>
                    {Array.from(visibleGroups.entries()).map(([group, groupQueries]) => {
                      const isCollapsed = collapsedGroups.has(group);
                      return (
                        <div key={group} className="mb-4">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedGroups((prev) => {
                                const next = new Set(prev);
                                if (next.has(group)) {
                                  next.delete(group);
                                } else {
                                  next.add(group);
                                }
                                return next;
                              })
                            }
                            className="w-full flex items-center justify-between text-xs uppercase tracking-wide text-gray-400 mb-2"
                          >
                            <span>{group}</span>
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {!isCollapsed && (
                            <div className="space-y-2">
                              {groupQueries.map((query) => {
                                const isSelected = query.queryHash === selectedQueryHash;
                                return (
                                  <button
                                    key={query.queryHash}
                                    type="button"
                                    onClick={() => setSelectedQueryHash(query.queryHash)}
                                    className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {query.state.status} • {query.state.fetchStatus}
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-white break-words">
                                      {stringifyKey(query.queryKey)}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="col-span-7 min-h-0 h-full p-4 overflow-y-auto">
                    {!selectedQuery && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Select a query to inspect its cache details.
                      </div>
                    )}
                    {selectedQuery && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            type="button"
                            onClick={() =>
                              queryClient.invalidateQueries({ queryKey: selectedQuery.queryKey })
                            }
                            className="px-3 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                          >
                            Invalidate
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              queryClient.refetchQueries({ queryKey: selectedQuery.queryKey })
                            }
                            className="px-3 py-2 text-xs rounded-lg bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 transition"
                          >
                            <span className="inline-flex items-center gap-1">
                              <RefreshCcw className="w-3 h-3" />
                              Refetch
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              queryClient.removeQueries({ queryKey: selectedQuery.queryKey })
                            }
                            className="px-3 py-2 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500 transition"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPinnedSnapshot({
                                queryHash: selectedQuery.queryHash,
                                data: sanitizeForSnapshot(selectedQuery.state.data),
                                capturedAt: Date.now(),
                              })
                            }
                            className="px-3 py-2 text-xs rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              Pin Snapshot
                            </span>
                          </button>
                          {isPinnedForSelected && (
                            <button
                              type="button"
                              onClick={() => setShowDiff((prev) => !prev)}
                              className="px-3 py-2 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Split className="w-3 h-3" />
                                {showDiff ? 'Hide Diff' : 'Show Diff'}
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {selectedQuery.state.status} • {selectedQuery.state.fetchStatus}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Observers
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {selectedQuery.getObserversCount()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Data Updated
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatTimestamp(selectedQuery.state.dataUpdatedAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Error Updated
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatTimestamp(selectedQuery.state.errorUpdatedAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Is Stale</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {selectedQuery.isStale() ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Query Key
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words">
                            {stringifyKey(selectedQuery.queryKey)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Data (sanitized)
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="text"
                              value={jsonSearchTerm}
                              onChange={(event) => setJsonSearchTerm(event.target.value)}
                              placeholder="Search in JSON..."
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                            />
                            {jsonSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setJsonSearchTerm('')}
                                className="text-xs text-gray-500 dark:text-gray-300"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          {showDiff && isPinnedForSelected ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  Snapshot{' '}
                                  {pinnedSnapshot?.capturedAt
                                    ? new Date(pinnedSnapshot.capturedAt).toLocaleTimeString()
                                    : ''}
                                </div>
                                <JsonViewer
                                  data={pinnedSnapshot?.data ?? null}
                                  initialExpanded
                                  searchTerm={jsonSearchTerm}
                                />
                              </div>
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  Current
                                </div>
                                <JsonViewer
                                  data={sanitizedSelectedData}
                                  initialExpanded
                                  searchTerm={jsonSearchTerm}
                                />
                              </div>
                            </div>
                          ) : (
                            <JsonViewer
                              data={sanitizedSelectedData}
                              initialExpanded
                              searchTerm={jsonSearchTerm}
                            />
                          )}
                        </div>

                        {selectedQuery.state.error && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Error (sanitized)
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-3 rounded-lg">
                              <JsonViewer
                                data={sanitizedSelectedError}
                                initialExpanded
                                searchTerm={jsonSearchTerm}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Observers ({observerSummaries.length})
                          </div>
                          {observerSummaries.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              No observers attached.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {observerSummaries.map((observer) => (
                                <div
                                  key={`observer-${observer.index}`}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                >
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Observer {observer.index + 1}
                                  </div>
                                  <JsonViewer data={observer} initialExpanded />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Data Mismatch Hints
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Projects containing legacy `endDate` but missing `targetEndDate`:
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {diagnostics.missingEndDateCount} affected
                      </div>
                      {diagnostics.examples.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Examples:{' '}
                          {diagnostics.examples
                            .map((example) => `${example.id} (${example.endDate})`)
                            .join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Mutations
                      </h3>
                      {mutations.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          No cached mutations.
                        </div>
                      )}
                      {mutations.length > 0 && (
                        <div className="space-y-2">
                          {mutations.map((mutation, index) => {
                            const isSelected = index === selectedMutationIndex;
                            return (
                              <button
                                key={`${mutation.state.submittedAt}-${index}`}
                                type="button"
                                onClick={() => setSelectedMutationIndex(index)}
                                className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                              >
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {mutation.state.status}
                                </div>
                                <div className="text-sm text-gray-900 dark:text-white break-words">
                                  {mutation.options.mutationKey
                                    ? stringifyKey(mutation.options.mutationKey)
                                    : 'Unnamed mutation'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedMutation && (
                        <div className="mt-4">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Mutation Detail
                          </div>
                          <JsonViewer
                            data={sanitizeForSnapshot({
                              key: selectedMutation.options.mutationKey,
                              status: selectedMutation.state.status,
                              submittedAt: selectedMutation.state.submittedAt,
                              data: selectedMutation.state.data,
                              error: selectedMutation.state.error,
                            })}
                            initialExpanded
                            searchTerm={jsonSearchTerm}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'zustand' && (
                <div className="p-6 space-y-4 overflow-y-auto h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Registered Stores
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Use registerZustandStore/createDebuggableStore to populate this list.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={liveZustand}
                        onChange={(event) => setLiveZustand(event.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      Live updates
                    </label>
                  </div>

                  {getZustandStores().length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No Zustand stores registered.
                    </div>
                  )}

                  {getZustandStores().length > 0 && (
                    <div className="space-y-4">
                      {getZustandStoreStates().map((store) => (
                        <div
                          key={store.name}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            {store.name}
                          </div>
                          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                            {truncateJson(store.state)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'app' && (
                <div className="p-6 space-y-6 overflow-y-auto h-full">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Route</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {location.pathname}
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mode</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {isLeisureMode ? 'Leisure' : 'Work'}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Auth
                    </div>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {truncateJson({
                        hasUser: !!user,
                        userId: user?.id ?? null,
                        userEmail: user?.email ?? null,
                        loading: authLoading,
                        error: authError,
                      })}
                    </pre>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Backend Status
                    </div>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {truncateJson(backendStatus)}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="p-6 space-y-6 overflow-y-auto h-full">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Snapshot Options
                    </h3>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={includeQueryData}
                        onChange={(event) => setIncludeQueryData(event.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      Include query data/error payloads
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={includeMutationData}
                        onChange={(event) => setIncludeMutationData(event.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      Include mutation data/error payloads
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCopySnapshot}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Copy snapshot
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSnapshot}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download JSON
                      </span>
                    </button>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Preview (sanitized)
                    </div>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words max-h-[40vh]">
                      {truncateJson(
                        buildDebugSnapshot({
                          queryClient,
                          zustandStores: getZustandStoreStates(),
                          appState: {
                            route: location.pathname,
                            auth: {
                              hasUser: !!user,
                              userEmail: user?.email ?? null,
                              loading: authLoading,
                              error: authError,
                            },
                            mode: {
                              isLeisureMode,
                            },
                            backendStatus,
                          },
                          diagnostics,
                          options: {
                            includeQueryData,
                            includeMutationData,
                          },
                        })
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
