import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';

function headingIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('h1, h2, h3, h4'))
    .map((el) => el.id)
    .filter(Boolean);
}

function codeIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('code[id]')).map((el) => el.id);
}

describe('MarkdownRenderer heading ids', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('numbers headings per level in document order', () => {
    const { container } = render(
      <MarkdownRenderer
        content={[
          '# Title',
          '## Alpha',
          '## Beta',
          '### Deep',
          '## Gamma',
          '### Deeper',
          '#### Leaf',
        ].join('\n\n')}
      />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-1-title-0",
        "heading-2-alpha-0",
        "heading-2-beta-1",
        "heading-3-deep-0",
        "heading-2-gamma-2",
        "heading-3-deeper-1",
        "heading-4-leaf-0",
      ]
    `);
  });

  it('suffixes duplicate headings by occurrence and keeps the per-level counter', () => {
    const { container } = render(
      <MarkdownRenderer
        content={[
          '## Intro',
          '## Other',
          '## Intro',
          '### Intro',
          '## Intro',
          '### Intro',
          '## Other',
        ].join('\n\n')}
      />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-intro-0",
        "heading-2-other-1",
        "heading-2-intro-2-1",
        "heading-3-intro-0",
        "heading-2-intro-3-2",
        "heading-3-intro-1-1",
        "heading-2-other-4-1",
      ]
    `);
  });

  it('slugifies special characters, unicode, long text and empty text', () => {
    const long = 'Word '.repeat(20).trim();
    const { container } = render(
      <MarkdownRenderer
        content={[
          '## C++ & Rust: *Tips*!',
          '## Café ☕ résumé',
          '## !!!',
          '## `inline_code` and **bold** [link text](https://example.com)',
          `## ${long}`,
          '## Snake_case-and--dashes',
          '## 123 Numbers 456',
          '## Mixed   spacing\tand tabs',
        ].join('\n\n')}
      />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-c-rust-tips-0",
        "heading-2-caf-r-sum-1",
        "heading-2-untitled-2",
        "heading-2-inline-code-and-bold-link-text-3",
        "heading-2-word-word-word-word-word-word-word-word-word-word--4",
        "heading-2-snake-case-and-dashes-5",
        "heading-2-123-numbers-456-6",
        "heading-2-mixed-spacing-and-tabs-7",
      ]
    `);
  });

  it('derives slugs from rendered text for images, entities, line breaks and nested emphasis', () => {
    const { container } = render(
      <MarkdownRenderer
        content={[
          '## ![alt text](https://example.com/a.png) After image',
          '## Fish &amp; Chips &copy; 2024',
          '## Line<br>break',
          '## ***Bold italic*** and ~~struck~~',
          '## <span>Span</span> <em>html</em>',
          '### 日本語 heading',
        ].join('\n\n')}
      />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-after-image-0",
        "heading-2-fish-chips-2024-1",
        "heading-2-linebreak-2",
        "heading-2-bold-italic-and-struck-3",
        "heading-2-span-html-4",
        "heading-3-heading-0",
      ]
    `);
  });

  it('keeps ids canonical while content streams in under a stable contentKey', () => {
    const { container, rerender } = render(
      <MarkdownRenderer content={'## Plan'} contentKey="stream" variant="chat" />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-plan-0",
      ]
    `);
    rerender(
      <MarkdownRenderer
        content={'## Plan\n\n## Plan\n\n```ts\nx\n```'}
        contentKey="stream"
        variant="chat"
      />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-plan-0",
        "heading-2-plan-1-1",
      ]
    `);
    expect(codeIds(container)).toMatchInlineSnapshot(`
      [
        "code-0",
      ]
    `);
  });

  it('assigns ids to headings nested in lists and blockquotes and to raw html headings', () => {
    const { container } = render(
      <MarkdownRenderer
        content={['> ## Quoted', '', '- ### In list', '', '<h2>Raw html</h2>', '', '## After'].join(
          '\n'
        )}
      />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-quoted-0",
        "heading-3-in-list-0",
        "heading-2-raw-html-1",
        "heading-2-after-2",
      ]
    `);
  });

  it('does not assign ids to h5 and h6', () => {
    const { container } = render(
      <MarkdownRenderer content={'##### Five\n\n###### Six\n\n## Two'} />
    );
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-two-0",
      ]
    `);
    expect(container.querySelector('h5')?.id ?? '').toBe('');
  });

  it('keeps heading ids when the component re-renders with the same content', () => {
    const content = '## Same\n\n## Same\n\n### Child';
    const { container, rerender } = render(<MarkdownRenderer content={content} />);
    const first = headingIds(container);
    rerender(<MarkdownRenderer content={content} className="x" />);
    rerender(<MarkdownRenderer content={content} className="y" />);
    expect(headingIds(container)).toEqual(first);
    expect(first).toMatchInlineSnapshot(`
      [
        "heading-2-same-0",
        "heading-2-same-1-1",
        "heading-3-child-0",
      ]
    `);
  });

  it('keeps heading ids after toggling collapse, and collapse state survives re-renders', async () => {
    const user = userEvent.setup();
    const content = '## First\n\nbody one\n\n## Second\n\nbody two';
    const { container, rerender } = render(<MarkdownRenderer content={content} filePath="a.md" />);
    const before = headingIds(container);

    const toggle = container.querySelector('button[aria-controls]') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await user.click(toggle);

    expect(headingIds(container)).toEqual(before);
    const toggleAfter = container.querySelector('button[aria-controls]') as HTMLButtonElement;
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('false');
    expect(toggleAfter.getAttribute('aria-controls')).toBe(`section-${before[0]}`);

    rerender(<MarkdownRenderer content={content} filePath="a.md" className="z" />);
    expect(headingIds(container)).toEqual(before);
    expect(
      (container.querySelector('button[aria-controls]') as HTMLButtonElement).getAttribute(
        'aria-expanded'
      )
    ).toBe('false');
  });

  it('derives ids from the new content when the content changes', () => {
    const { container, rerender } = render(<MarkdownRenderer content={'## One\n\n## Two'} />);
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-one-0",
        "heading-2-two-1",
      ]
    `);
    rerender(<MarkdownRenderer content={'## Zero\n\n## One\n\n## One\n\n# Top'} />);
    expect(headingIds(container)).toMatchInlineSnapshot(`
      [
        "heading-2-zero-0",
        "heading-2-one-1",
        "heading-2-one-2-1",
        "heading-1-top-0",
      ]
    `);
  });

  it('restores collapsed headings from localStorage by id', () => {
    const content = '## Alpha\n\n## Alpha\n\n## Beta';
    const probe = render(<MarkdownRenderer content={content} />);
    const ids = headingIds(probe.container);
    probe.unmount();

    window.localStorage.setItem(
      'markdown-collapse-state-b.md',
      JSON.stringify({ collapsedHeadings: [ids[1]], collapsedCodeBlocks: [] })
    );
    const { container } = render(<MarkdownRenderer content={content} filePath="b.md" />);
    const states = Array.from(container.querySelectorAll('button[aria-controls]')).map((b) =>
      b.getAttribute('aria-expanded')
    );
    expect(states).toEqual(['true', 'false', 'true']);
  });

  it('collapseAll and expandAll through the imperative handle target every heading', () => {
    const content = '# One\n\n## Two\n\n## Two\n\n### Three';
    const handle: { current: { expandAll: () => void; collapseAll: () => void } | null } = {
      current: null,
    };
    const { container, rerender } = render(
      <MarkdownRenderer content={content} filePath="c.md" collapseActionsRef={handle} />
    );
    rerender(
      <MarkdownRenderer
        content={content}
        filePath="c.md"
        collapseActionsRef={handle}
        className="r"
      />
    );
    act(() => handle.current?.collapseAll());
    const collapsed = Array.from(container.querySelectorAll('button[aria-controls]')).map((b) =>
      b.getAttribute('aria-expanded')
    );
    expect(collapsed).toEqual(['false', 'false', 'false', 'false']);
    act(() => handle.current?.expandAll());
    const expanded = Array.from(container.querySelectorAll('button[aria-controls]')).map((b) =>
      b.getAttribute('aria-expanded')
    );
    expect(expanded).toEqual(['true', 'true', 'true', 'true']);
  });
});

describe('MarkdownRenderer code block ids', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('numbers fenced code blocks with a language in document order and skips inline code', () => {
    const content = [
      'Some `inline` code.',
      '',
      '```ts',
      'const a = 1;',
      '```',
      '',
      '```',
      'no language',
      '```',
      '',
      '```python',
      'print(1)',
      '```',
    ].join('\n');
    const { container } = render(<MarkdownRenderer content={content} />);
    expect(codeIds(container)).toMatchInlineSnapshot(`
      [
        "code-0",
        "code-1",
      ]
    `);
  });

  it('keeps code block ids stable across re-renders', () => {
    const content = '```ts\na\n```\n\n```js\nb\n```';
    const { container, rerender } = render(<MarkdownRenderer content={content} />);
    const first = codeIds(container);
    rerender(<MarkdownRenderer content={content} className="x" />);
    rerender(<MarkdownRenderer content={content} className="y" />);
    expect(codeIds(container)).toEqual(first);
    expect(first).toMatchInlineSnapshot(`
      [
        "code-0",
        "code-1",
      ]
    `);
  });

  it('collapses a code block by id and keeps it collapsed across re-renders', async () => {
    const user = userEvent.setup();
    const content = '```ts\nline1\nline2\nline3\nline4\n```\n\n```js\nother\n```';
    const { container, rerender } = render(<MarkdownRenderer content={content} filePath="d.md" />);
    const ids = codeIds(container);
    const buttons = screen.getAllByRole('button', { name: /collapse|expand/i });
    await user.click(buttons[0]);
    expect(codeIds(container)).toEqual(ids);
    expect(container.querySelector(`code[id="${ids[0]}"]`)?.textContent).toContain('more lines');
    expect(container.querySelector(`code[id="${ids[1]}"]`)?.textContent).not.toContain(
      'more lines'
    );
    rerender(<MarkdownRenderer content={content} filePath="d.md" className="q" />);
    expect(codeIds(container)).toEqual(ids);
    expect(container.querySelector(`code[id="${ids[0]}"]`)?.textContent).toContain('more lines');
  });
});

describe('MarkdownRenderer rendered markup', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders headings, inline code and code blocks with the same markup', () => {
    const content = [
      '# Title with `code`',
      '',
      'Paragraph with `inline` code and a [link](https://example.com).',
      '',
      '## Section',
      '',
      '```ts',
      'const a = 1;',
      '```',
      '',
      '## Section',
      '',
      '- item',
      '',
      '```',
      'plain fence',
      '```',
    ].join('\n');
    const { container } = render(<MarkdownRenderer content={content} />);
    expect(container.innerHTML).toMatchSnapshot();
  });
});

describe('MarkdownRenderer under React StrictMode', () => {
  afterEach(() => {
    cleanup();
  });

  it('produces the same ids as a plain render despite double rendering', () => {
    const content = '## Dup\n\n## Dup\n\n### Child\n\n```ts\nx\n```\n\n```js\ny\n```';
    const plain = render(<MarkdownRenderer content={content} />);
    const expectedHeadings = headingIds(plain.container);
    const expectedCode = codeIds(plain.container);
    plain.unmount();

    const strict = render(
      <StrictMode>
        <MarkdownRenderer content={content} />
      </StrictMode>
    );
    expect(headingIds(strict.container)).toEqual(expectedHeadings);
    expect(codeIds(strict.container)).toEqual(expectedCode);
  });
});
