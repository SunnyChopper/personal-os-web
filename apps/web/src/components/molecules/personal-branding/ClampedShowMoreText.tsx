import { useLayoutEffect, useRef, useState } from 'react';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import { splitReconPostQuotedText } from '@/lib/personal-branding/recon-post-quoted-text';
import { linkAccentClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';

const LINE_CLAMP_CLASS: Record<2 | 3 | 4, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
};

export type ClampedShowMoreTextProps = {
  text: string;
  lines?: 2 | 3 | 4;
  className?: string;
};

export function ClampedShowMoreText({ text, lines = 4, className }: ClampedShowMoreTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || expanded) return;

    setNeedsExpand(el.scrollHeight > el.clientHeight + 2);
  }, [text, expanded, lines]);

  if (!text) return null;

  const clampClass = LINE_CLAMP_CLASS[lines];
  const { primary, quoted } = splitReconPostQuotedText(text);

  return (
    <div>
      <div ref={contentRef} className={cn('break-words', !expanded && clampClass, className)}>
        {primary ? <p className="whitespace-pre-wrap">{primary}</p> : null}
        {quoted ? (
          <InsetPanel
            className={cn('p-2', primary ? 'mt-1.5' : undefined)}
            padding="compact"
            tone="neutral"
          >
            <span className="sr-only">Quoted</span>
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{quoted}</p>
          </InsetPanel>
        ) : null}
      </div>
      {needsExpand || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={cn('mt-1 text-sm', linkAccentClassName)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
}
