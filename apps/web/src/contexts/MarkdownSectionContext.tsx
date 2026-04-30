import { createContext } from 'react';

export interface SectionInfo {
  headingId: string;
  level: number;
}

export interface MarkdownSectionContextValue {
  pushSection: (headingId: string, level: number) => void;
  popSection: (level: number) => void;
  isContentVisible: (headingId: string) => boolean;
  isHeadingVisible: (headingId: string, level: number) => boolean;
  getCurrentLevel: () => number;
  collapsedHeadings: Set<string>;
}

export const MarkdownSectionContext = createContext<MarkdownSectionContextValue | null>(null);
