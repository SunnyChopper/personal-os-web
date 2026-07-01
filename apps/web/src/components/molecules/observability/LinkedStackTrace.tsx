import { Fragment, useMemo, useState } from 'react';
import {
  groupStackTraceLines,
  parseStackTrace,
  type EditorLinkSettings,
  type ParsedStackTraceFrameLine,
} from '@/lib/editor-links';
import { cn } from '@/lib/utils';

export interface LinkedStackTraceProps {
  text: string;
  className?: string;
  settings: EditorLinkSettings;
  /** When true (default), contiguous third-party frames render collapsed until expanded. */
  collapseExternalFramesByDefault?: boolean;
}

function frameLineKey(frame: ParsedStackTraceFrameLine, suffix: string): string {
  return `${frame.rawPath}:${frame.lineNumber}:${suffix}`;
}

function StackTraceFrameLine({ line }: { line: ParsedStackTraceFrameLine }) {
  if (line.kind !== 'frame') return null;
  return (
    <>
      {line.prefix}
      {line.href ? (
        <a
          href={line.href}
          className="text-violet-700 dark:text-violet-300 underline underline-offset-2 hover:text-violet-900 dark:hover:text-violet-100"
          title={`Open in editor: ${line.rawPath}`}
        >
          {line.rawPath}
        </a>
      ) : (
        line.rawPath
      )}
      {line.middle}
      {line.lineNumber}
      {line.suffix}
    </>
  );
}

function externalFramesLabel(count: number, expanded: boolean): string {
  const noun = count === 1 ? 'external frame' : 'external frames';
  return expanded ? `Hide ${count} ${noun}` : `Show ${count} ${noun}`;
}

export default function LinkedStackTrace({
  text,
  className,
  settings,
  collapseExternalFramesByDefault = true,
}: LinkedStackTraceProps) {
  const lines = useMemo(() => parseStackTrace(text, settings), [text, settings]);
  const segments = useMemo(
    () =>
      collapseExternalFramesByDefault
        ? groupStackTraceLines(lines, settings)
        : lines.map((line, lineIndex) => ({ kind: 'line' as const, lineIndex, line })),
    [collapseExternalFramesByDefault, lines, settings]
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const toggleGroup = (groupIndex: number) => {
    setExpandedGroups((prev) => ({ ...prev, [groupIndex]: !prev[groupIndex] }));
  };

  let segmentRenderIndex = 0;
  const lastSegmentIndex = segments.length - 1;

  return (
    <pre className={cn('text-xs whitespace-pre-wrap', className)}>
      {segments.map((segment) => {
        const isLastSegment = segmentRenderIndex === lastSegmentIndex;
        segmentRenderIndex += 1;

        if (segment.kind === 'line') {
          const { line } = segment;
          return (
            <Fragment key={`line-${segment.lineIndex}`}>
              {line.kind === 'plain' ? line.text : <StackTraceFrameLine line={line} />}
              {!isLastSegment ? '\n' : null}
            </Fragment>
          );
        }

        const expanded = expandedGroups[segment.groupIndex] === true;
        const count = segment.frames.length;

        return (
          <Fragment key={`ext-${segment.groupIndex}-${segment.startLineIndex}`}>
            <button
              type="button"
              className="my-0.5 block w-full rounded border border-dashed border-gray-300 bg-gray-100/80 px-2 py-1 text-left font-mono text-[11px] text-gray-600 hover:bg-gray-200/80 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-400 dark:hover:bg-gray-800/80"
              aria-expanded={expanded}
              onClick={() => toggleGroup(segment.groupIndex)}
            >
              {externalFramesLabel(count, expanded)}
            </button>
            {expanded ? (
              <>
                {segment.frames.map((frame, frameIdx) => (
                  <Fragment key={frameLineKey(frame, String(frameIdx))}>
                    {'\n'}
                    <StackTraceFrameLine line={frame} />
                  </Fragment>
                ))}
              </>
            ) : null}
            {!isLastSegment ? '\n' : null}
          </Fragment>
        );
      })}
    </pre>
  );
}
