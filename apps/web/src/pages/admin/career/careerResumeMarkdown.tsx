import { Fragment, type ReactNode } from 'react';
import type { Components } from 'react-markdown';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitHighlights(text: string, terms: string[]): ReactNode {
  const uniq = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length > 1))].sort(
    (a, b) => b.length - a.length
  );
  if (!uniq.length) return text;

  const patternParts = uniq.map((t) =>
    /\s/.test(t) ? escapeRegExp(t) : `\\b${escapeRegExp(t)}\\b`
  );
  const re = new RegExp(`(${patternParts.join('|')})`, 'gi');
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const copy = new RegExp(re.source, re.flags);
  let k = 0;
  while ((m = copy.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <mark
        key={`career-hl-${k++}`}
        className="bg-amber-200/90 dark:bg-amber-600/35 text-inherit rounded px-0.5"
      >
        {m[0]}
      </mark>
    );
    last = m.index + m[0].length;
    if (m[0].length === 0) copy.lastIndex += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function highlightChildren(children: ReactNode, terms: string[]): ReactNode {
  if (typeof children === 'string') {
    return splitHighlights(children, terms);
  }
  if (Array.isArray(children)) {
    return children.map((c, i) => <Fragment key={i}>{highlightChildren(c, terms)}</Fragment>);
  }
  return children;
}

/** ATS keyword highlighting for resume preview (paragraphs and list items only). */
export function getCareerResumeMarkdownComponents(keywords: string[]): Partial<Components> {
  const terms = keywords ?? [];
  const li: Components['li'] = ({ children, ...props }) => (
    <li {...props}>{highlightChildren(children, terms)}</li>
  );
  const p: Components['p'] = ({ children, ...props }) => (
    <p {...props}>{highlightChildren(children, terms)}</p>
  );
  return { li, p };
}
