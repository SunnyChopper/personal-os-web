import { useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { MarkdownSectionContext, type SectionInfo } from '@/contexts/MarkdownSectionContext';

interface MarkdownSectionProviderProps {
  children: React.ReactNode;
  collapsedHeadings: Set<string>;
}

/**
 * Section context provider component for markdown rendering.
 * Tracks the current section stack to determine content visibility based on collapsed headings.
 *
 * The section stack is built during each render as headings call pushSection().
 * Content visibility is determined by checking if any parent section is collapsed.
 *
 * Note: The parent component (MarkdownRenderer) should be memoized to prevent
 * unnecessary re-renders from scroll events or other parent state changes.
 */
export default function MarkdownSectionProvider({
  children,
  collapsedHeadings,
}: MarkdownSectionProviderProps) {
  // Use a ref to track the current section stack during render
  const sectionStackRef = useRef<SectionInfo[]>([]);

  // Reset stack at the start of every render to ensure clean state
  // This is safe because the stack is rebuilt during each render as headings call pushSection()
  // Using useLayoutEffect to reset before children render, satisfying React's ref mutation rules
  useLayoutEffect(() => {
    sectionStackRef.current = [];
  });

  const pushSection = useCallback((headingId: string, level: number) => {
    // Filter out sections at same or deeper level, then add new section
    // This automatically handles the case where we encounter a heading at a higher level
    sectionStackRef.current = sectionStackRef.current.filter((s) => s.level < level);
    sectionStackRef.current.push({ headingId, level });
  }, []);

  const popSection = useCallback((level: number) => {
    // Remove sections at this level or deeper
    sectionStackRef.current = sectionStackRef.current.filter((s) => s.level < level);
  }, []);

  const isContentVisible = useCallback(
    (_headingId: string): boolean => {
      // Content is visible if no parent sections are collapsed
      const stack = sectionStackRef.current;
      if (stack.length === 0) return true;

      // Check if any parent section is collapsed
      return !stack.some((section) => collapsedHeadings.has(section.headingId));
    },
    [collapsedHeadings]
  );

  /**
   * Determines whether a heading should be visible.
   *
   * [Behavior] A heading is considered visible if none of its parent sections are collapsed.
   * [Constraint] A heading should NEVER hide itself - only hide if a PARENT is collapsed.
   * [Constraint] Uses the section stack to check ancestors against collapsedHeadings.
   *
   * @param headingId - The unique ID of the heading being checked
   * @param _level - The heading level (currently unused, stack used for hierarchy context)
   * @returns {boolean} True if the heading (and its section) is visible
   *
   * [Tagged] @markdown-visibility @section-collapsed @stack-traversal
   */
  const isHeadingVisible = useCallback(
    (headingId: string, _level: number): boolean => {
      const stack = sectionStackRef.current;
      // [Semantics] If no parent stack, heading is top-level and always visible
      if (stack.length === 0) return true;
      // [Core Logic] If any ancestor in stack (not this heading itself) is collapsed, heading is hidden
      // [Safety] Explicitly exclude the current heading to ensure it never hides itself
      return !stack.some(
        (section) => section.headingId !== headingId && collapsedHeadings.has(section.headingId)
      );
    },
    [collapsedHeadings]
  );

  const getCurrentLevel = useCallback((): number => {
    // Get the current deepest section level from the stack
    const stack = sectionStackRef.current;
    if (stack.length === 0) return 1;
    return stack[stack.length - 1].level;
  }, []);

  // Memoize context value - recreate when any callback changes
  const contextValue = useMemo(
    () => ({
      pushSection,
      popSection,
      isContentVisible,
      isHeadingVisible,
      getCurrentLevel,
      collapsedHeadings,
    }),
    [
      pushSection,
      popSection,
      isContentVisible,
      isHeadingVisible,
      getCurrentLevel,
      collapsedHeadings,
    ]
  );

  return (
    <MarkdownSectionContext.Provider value={contextValue}>
      {children}
    </MarkdownSectionContext.Provider>
  );
}
