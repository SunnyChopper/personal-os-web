import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import rehypeAddSourceLine from './rehype-add-source-line';

function collectAnnotatedLines(tree: Root): Array<{ tag: string; line: number }> {
  const rows: Array<{ tag: string; line: number }> = [];
  visit(tree, 'element', (node: Element) => {
    const raw = node.properties['data-source-line'];
    const line = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
    if (!Number.isNaN(line)) {
      rows.push({ tag: node.tagName, line });
    }
  });
  return rows;
}

describe('rehypeAddSourceLine', () => {
  it('annotates block-level elements with 1-based source lines', () => {
    const md = '# Title line\n\nParagraph text.\n\n- list item\n\n```js\nx\n```';
    const file = new VFile(md);
    const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeAddSourceLine);
    const mdast = processor.parse(file);
    const tree = processor.runSync(mdast, file) as Root;

    const annotated = collectAnnotatedLines(tree);
    const h1 = annotated.find((a) => a.tag === 'h1');
    const p = annotated.find((a) => a.tag === 'p');
    const li = annotated.find((a) => a.tag === 'li');
    const pre = annotated.find((a) => a.tag === 'pre');

    expect(h1?.line).toBe(1);
    expect(p?.line).toBe(3);
    expect(li?.line).toBe(5);
    expect(pre?.line).toBe(7);
  });
});
