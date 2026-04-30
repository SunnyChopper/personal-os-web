import { useContext } from 'react';
import {
  MarkdownSectionContext,
  type MarkdownSectionContextValue,
} from '@/contexts/MarkdownSectionContext';

export function useMarkdownSectionContext(): MarkdownSectionContextValue {
  const context = useContext(MarkdownSectionContext);
  if (!context) {
    // Fallback that always shows content
    return {
      pushSection: () => {},
      popSection: () => {},
      isContentVisible: () => true,
      isHeadingVisible: () => true,
      getCurrentLevel: () => 1,
      collapsedHeadings: new Set<string>(),
    };
  }
  return context;
}
