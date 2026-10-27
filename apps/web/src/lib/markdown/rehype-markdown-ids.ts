import { visit } from 'unist-util-visit';
import type { Element, ElementContent, Root } from 'hast';
import { generateHeadingId } from '@/lib/markdown/heading-utils';

declare module 'hast' {
  interface ElementData {
    /** Stable id assigned by `rehypeAssignMarkdownIds` to h1-h4 headings and fenced code blocks. */
    markdownId?: string;
  }
}

const HEADING_LEVELS: Record<string, 1 | 2 | 3 | 4 | undefined> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
};

function hastTextContent(nodes: ElementContent[]): string {
  let text = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      text += node.value;
    } else if (node.type === 'element') {
      text += hastTextContent(node.children);
    }
  }
  return text;
}

function classNameToString(className: unknown): string {
  if (Array.isArray(className)) return className.join(' ');
  return typeof className === 'string' ? className : '';
}

/**
 * Rehype plugin: assigns deterministic ids to h1-h4 headings (`heading-<level>-<slug>-<n>[-<dup>]`)
 * and fenced code blocks (`code-<n>`) in document order. Counters live inside each transform run,
 * so the same content always yields the same ids regardless of how often or in what order React
 * renders the resulting components.
 */
export default function rehypeAssignMarkdownIds() {
  return (tree: Root) => {
    const headingIdMap = new Map<string, string>();
    const headingCounters: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const headingOccurrenceMap = new Map<string, number>();
    let codeBlockCount = 0;

    visit(tree, 'element', (node: Element) => {
      const level = HEADING_LEVELS[node.tagName];
      if (level !== undefined) {
        const id = generateHeadingId(
          level,
          hastTextContent(node.children),
          headingIdMap,
          headingCounters,
          headingOccurrenceMap
        );
        node.data = { ...node.data, markdownId: id };
        return;
      }

      if (
        node.tagName === 'code' &&
        classNameToString(node.properties.className).includes('language-')
      ) {
        node.data = { ...node.data, markdownId: `code-${codeBlockCount}` };
        codeBlockCount += 1;
      }
    });
  };
}
