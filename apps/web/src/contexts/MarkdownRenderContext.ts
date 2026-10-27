import { createContext } from 'react';
import type { UseMarkdownPluginsReturn } from '@/hooks/useMarkdownPlugins';

export interface MarkdownHeadingCollapseContextValue {
  collapsedHeadings: Set<string>;
  toggleHeading: (headingId: string) => void;
}

export interface MarkdownCodeBlockContextValue {
  collapsedCodeBlocks: Set<string>;
  toggleCodeBlock: (codeId: string) => void;
  prismLoaded: boolean;
  Prism: UseMarkdownPluginsReturn['Prism'];
  codeRefs: React.MutableRefObject<Map<string, HTMLPreElement>>;
}

export const MarkdownHeadingCollapseContext =
  createContext<MarkdownHeadingCollapseContextValue | null>(null);

export const MarkdownCodeBlockContext = createContext<MarkdownCodeBlockContextValue | null>(null);
