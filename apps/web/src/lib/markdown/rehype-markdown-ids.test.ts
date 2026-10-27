import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import rehypeAssignMarkdownIds from '@/lib/markdown/rehype-markdown-ids';

function run(markdown: string): Root {
  const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeAssignMarkdownIds);
  return processor.runSync(processor.parse(markdown)) as Root;
}

function assignedIds(tree: Root): Array<[string, string | undefined]> {
  const rows: Array<[string, string | undefined]> = [];
  visit(tree, 'element', (node: Element) => {
    if (node.data?.markdownId !== undefined) rows.push([node.tagName, node.data.markdownId]);
  });
  return rows;
}

describe('rehypeAssignMarkdownIds', () => {
  it('numbers headings per level and suffixes duplicates by occurrence', () => {
    const ids = assignedIds(run('# A\n\n## B\n\n## B\n\n### B\n\n## B\n\n# A'));
    expect(ids).toEqual([
      ['h1', 'heading-1-a-0'],
      ['h2', 'heading-2-b-0'],
      ['h2', 'heading-2-b-1-1'],
      ['h3', 'heading-3-b-0'],
      ['h2', 'heading-2-b-2-2'],
      ['h1', 'heading-1-a-1-1'],
    ]);
  });

  it('numbers fenced code blocks that carry a language class and skips the rest', () => {
    const ids = assignedIds(run('`inline`\n\n```ts\na\n```\n\n```\nplain\n```\n\n```js\nb\n```'));
    expect(ids).toEqual([
      ['code', 'code-0'],
      ['code', 'code-1'],
    ]);
  });

  it('does not touch h5 and h6', () => {
    expect(assignedIds(run('##### Five\n\n###### Six'))).toEqual([]);
  });

  it('is deterministic: running the same content repeatedly yields identical ids', () => {
    const markdown = '## Same\n\n## Same\n\n```ts\nx\n```';
    const first = assignedIds(run(markdown));
    expect(assignedIds(run(markdown))).toEqual(first);
    expect(assignedIds(run(markdown))).toEqual(first);
  });

  it('derives the slug from the text of nested inline nodes', () => {
    const ids = assignedIds(run('## Hello **bold** `code` [link](https://example.com)'));
    expect(ids).toEqual([['h2', 'heading-2-hello-bold-code-link-0']]);
  });
});
