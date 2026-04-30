import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VaultItem } from '@/types/knowledge-vault';

/** Max seeds for subgraph loading (raised from legacy 3). */
export const CONCEPT_COLLIDER_MAX_SEEDS = 8;

export type ConceptColliderState = {
  seeds: VaultItem[];
  selectedNodeIds: string[];
  synthesisOpen: boolean;
  synthesisMarkdown: string;
  /** Sorted-node key for which `synthesisMarkdown` was produced (skip re-stream when reopening). */
  lastSynthesisNodeKey: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setSeeds: (seeds: VaultItem[] | ((prev: VaultItem[]) => VaultItem[])) => void;
  addSeed: (item: VaultItem) => void;
  removeSeed: (id: string) => void;
  setSelectedNodeIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  toggleSelectedNodeId: (id: string) => void;
  clearSelectedNodes: () => void;
  setSynthesisOpen: (open: boolean) => void;
  setSynthesisMarkdown: (md: string) => void;
  appendSynthesisMarkdown: (delta: string) => void;
  resetSynthesisMarkdown: () => void;
  setLastSynthesisNodeKey: (key: string | null) => void;
};

export const useConceptColliderStore = create<ConceptColliderState>()(
  persist(
    (set, get) => ({
      seeds: [],
      selectedNodeIds: [],
      synthesisOpen: false,
      synthesisMarkdown: '',
      lastSynthesisNodeKey: null,
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSeeds: (seeds) =>
        set((s) => ({
          seeds: typeof seeds === 'function' ? seeds(s.seeds) : seeds,
        })),
      addSeed: (item) => {
        const { seeds } = get();
        if (seeds.some((x) => x.id === item.id)) {
          set((s) => ({
            selectedNodeIds: s.selectedNodeIds.includes(item.id)
              ? s.selectedNodeIds
              : [...s.selectedNodeIds, item.id],
          }));
          return;
        }
        const next =
          seeds.length >= CONCEPT_COLLIDER_MAX_SEEDS ? [...seeds.slice(1), item] : [...seeds, item];
        set((s) => ({
          seeds: next,
          selectedNodeIds: s.selectedNodeIds.includes(item.id)
            ? s.selectedNodeIds
            : [...s.selectedNodeIds, item.id],
        }));
      },
      removeSeed: (id) =>
        set((s) => ({
          seeds: s.seeds.filter((x) => x.id !== id),
          selectedNodeIds: s.selectedNodeIds.filter((x) => x !== id),
        })),
      setSelectedNodeIds: (ids) =>
        set((s) => ({
          selectedNodeIds: typeof ids === 'function' ? ids(s.selectedNodeIds) : ids,
        })),
      toggleSelectedNodeId: (id) =>
        set((s) => {
          const has = s.selectedNodeIds.includes(id);
          return {
            selectedNodeIds: has
              ? s.selectedNodeIds.filter((x) => x !== id)
              : [...s.selectedNodeIds, id],
          };
        }),
      clearSelectedNodes: () => set({ selectedNodeIds: [] }),
      setSynthesisOpen: (open) => set({ synthesisOpen: open }),
      setSynthesisMarkdown: (md) => set({ synthesisMarkdown: md }),
      appendSynthesisMarkdown: (delta) =>
        set((s) => ({ synthesisMarkdown: s.synthesisMarkdown + delta })),
      resetSynthesisMarkdown: () => set({ synthesisMarkdown: '' }),
      setLastSynthesisNodeKey: (key) => set({ lastSynthesisNodeKey: key }),
    }),
    {
      name: 'concept-collider-storage',
      partialize: (s) => ({
        seeds: s.seeds,
        selectedNodeIds: s.selectedNodeIds,
        synthesisOpen: s.synthesisOpen,
        synthesisMarkdown: s.synthesisMarkdown,
        lastSynthesisNodeKey: s.lastSynthesisNodeKey,
        searchQuery: s.searchQuery,
      }),
    }
  )
);
