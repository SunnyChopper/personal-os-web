import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

/** Tags we annotate so scroll sync maps source lines to rendered blocks without noise on every inline node. */
const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'table',
  'hr',
  'div',
]);

/**
 * Rehype plugin: copy mdast/hast `position.start.line` onto block elements as `data-source-line`
 * for editor ↔ preview scroll sync. Lines are 1-based (same as unified positions).
 */
export default function rehypeAddSourceLine() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!BLOCK_TAGS.has(node.tagName)) return;
      const line = node.position?.start?.line;
      if (typeof line !== 'number' || line < 1) return;
      node.properties ??= {};
      node.properties['data-source-line'] = line;
    });
  };
}
