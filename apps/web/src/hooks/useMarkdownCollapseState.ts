import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface CollapseState {
  collapsedHeadings: Set<string>;
  collapsedCodeBlocks: Set<string>;
}

const STORAGE_PREFIX = 'markdown-collapse-state-';

/**
 * Manages collapsed markdown headings and code blocks, persisting state per file in localStorage.
 * Only collapsed items are tracked; all others are expanded by default.
 */
export function useMarkdownCollapseState(filePath?: string) {
  // [Purpose] Defines where Markdown collapse state is saved for local storage
  const storageKey = filePath ? `${STORAGE_PREFIX}${filePath}` : null;

  // [Purpose] Manages collapsed headings/code blocks, loading from localStorage if present
  const [state, setState] = useState<CollapseState>(() => {
    // [Constraint] No storage/load if missing storageKey or not running in browser
    if (!storageKey || typeof window === 'undefined') {
      return {
        collapsedHeadings: new Set<string>(),
        collapsedCodeBlocks: new Set<string>(),
      };
    }

    // [Behavior] Load and parse collapse state from localStorage if it exists
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // [Behavior] Handle new format: collapsedHeadings + collapsedCodeBlocks as arrays
        if (parsed.collapsedHeadings) {
          return {
            collapsedHeadings: new Set(parsed.collapsedHeadings || []),
            collapsedCodeBlocks: new Set(parsed.collapsedCodeBlocks || []),
          };
        } else if (parsed.expandedHeadings) {
          // [Behavior] Old format detected—migrate by ignoring and using fresh, all-expanded state
          return {
            collapsedHeadings: new Set<string>(),
            collapsedCodeBlocks: new Set<string>(),
          };
        }
      }
    } catch (error) {
      // [Constraint] Fail gracefully if corrupted state or JSON error
      logger.warn('Failed to load collapse state', error);
    }

    // [Purpose] Default state: all headings/code expanded
    return {
      collapsedHeadings: new Set<string>(),
      collapsedCodeBlocks: new Set<string>(),
    };
  });

  // Debounced save to localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const saveToStorage = useCallback(
    (newState: CollapseState) => {
      if (!storageKey || typeof window === 'undefined') return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid excessive localStorage writes
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              collapsedHeadings: Array.from(newState.collapsedHeadings),
              collapsedCodeBlocks: Array.from(newState.collapsedCodeBlocks),
            })
          );
        } catch (error) {
          logger.warn('Failed to save collapse state to localStorage', error);
        }
      }, 100);
    },
    [storageKey]
  );

  const toggleHeading = useCallback(
    (id: string) => {
      setState((prev) => {
        const newCollapsedHeadings = new Set(prev.collapsedHeadings);
        // Check if currently collapsed (in the set)
        const isCurrentlyCollapsed = newCollapsedHeadings.has(id);

        if (isCurrentlyCollapsed) {
          // Expanding: remove from collapsed set
          newCollapsedHeadings.delete(id);
        } else {
          // Collapsing: add to collapsed set
          newCollapsedHeadings.add(id);
        }

        const newState = {
          ...prev,
          collapsedHeadings: newCollapsedHeadings,
        };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const toggleCodeBlock = useCallback(
    (id: string) => {
      setState((prev) => {
        const newCollapsedCodeBlocks = new Set(prev.collapsedCodeBlocks);
        // Check if currently collapsed (in the set)
        const isCurrentlyCollapsed = newCollapsedCodeBlocks.has(id);

        if (isCurrentlyCollapsed) {
          // Expanding: remove from collapsed set
          newCollapsedCodeBlocks.delete(id);
        } else {
          // Collapsing: add to collapsed set
          newCollapsedCodeBlocks.add(id);
        }

        const newState = {
          ...prev,
          collapsedCodeBlocks: newCollapsedCodeBlocks,
        };
        saveToStorage(newState);
        return newState;
      });
    },
    [saveToStorage]
  );

  const resetState = useCallback(() => {
    const newState: CollapseState = {
      collapsedHeadings: new Set<string>(),
      collapsedCodeBlocks: new Set<string>(),
    };
    setState(newState);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        logger.warn('Failed to clear collapse state from localStorage', error);
      }
    }
  }, [storageKey]);

  // Check if an item is collapsed
  // Logic: item is collapsed if it's in the collapsed set
  // Default: all items are expanded (empty collapsed set)
  const isHeadingCollapsed = useCallback(
    (id: string): boolean => {
      // Item is collapsed if it's in the collapsed set
      return state.collapsedHeadings.has(id);
    },
    [state.collapsedHeadings]
  );

  const isCodeBlockCollapsed = useCallback(
    (id: string): boolean => {
      // Item is collapsed if it's in the collapsed set
      return state.collapsedCodeBlocks.has(id);
    },
    [state.collapsedCodeBlocks]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Expose collapsed sets for re-render tracking
    collapsedHeadings: state.collapsedHeadings,
    collapsedCodeBlocks: state.collapsedCodeBlocks,
    toggleHeading,
    toggleCodeBlock,
    resetState,
    isHeadingCollapsed,
    isCodeBlockCollapsed,
  };
}
