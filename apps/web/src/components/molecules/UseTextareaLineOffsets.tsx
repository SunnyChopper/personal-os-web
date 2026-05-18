import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from 'react';

export interface TextareaLineOffsetsApi {
  /** 1-based source line → offset from top of scrollable content (px). */
  getOffsetTopForLine: (line: number) => number;
  /** Top visible offset → best 1-based source line at or above that scroll position. */
  getLineAtOffset: (scrollTop: number) => number;
  getTotalHeight: () => number;
  scheduleMeasure: () => void;
}

function copyTextareaMetricsToMirror(textarea: HTMLTextAreaElement): Partial<CSSProperties> {
  const cs = getComputedStyle(textarea);
  return {
    boxSizing: 'border-box',
    width: `${textarea.clientWidth}px`,
    paddingTop: cs.paddingTop,
    paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft,
    border: 'none',
    margin: '0',
    font: cs.font,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    wordSpacing: cs.wordSpacing,
    tabSize: cs.tabSize as unknown as number,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  };
}

/**
 * Hidden per-line mirror layer to map textarea `scrollTop` ↔ 1-based source lines with soft-wrapping.
 */
export function useTextareaLineOffsets(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  enabled: boolean
): {
  apiRef: RefObject<TextareaLineOffsetsApi | null>;
  MirrorLayer: ReactElement | null;
} {
  const mirrorRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<TextareaLineOffsetsApi | null>(null);
  const offsetsRef = useRef<number[]>([]);
  const rafRef = useRef<number | undefined>(undefined);

  const lines = useMemo(() => value.split('\n'), [value]);

  const recomputeOffsets = useCallback(() => {
    if (!enabled) {
      offsetsRef.current = [];
      return;
    }
    const mirror = mirrorRef.current;
    if (!mirror) {
      offsetsRef.current = [];
      return;
    }
    offsetsRef.current = Array.from(mirror.querySelectorAll<HTMLDivElement>('[data-line]')).map(
      (c) => c.offsetTop
    );
  }, [enabled]);

  const scheduleMeasure = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined;
        recomputeOffsets();
      });
    });
  }, [recomputeOffsets]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    Object.assign(mirror.style, copyTextareaMetricsToMirror(textarea));
    scheduleMeasure();
  }, [enabled, textareaRef, value, scheduleMeasure]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const mirror = mirrorRef.current;
      if (mirror && textarea) {
        Object.assign(mirror.style, copyTextareaMetricsToMirror(textarea));
      }
      scheduleMeasure();
    });
    ro.observe(textarea);
    return () => ro.disconnect();
  }, [enabled, textareaRef, scheduleMeasure]);

  useLayoutEffect(() => {
    if (!enabled) {
      apiRef.current = {
        getOffsetTopForLine: () => 0,
        getLineAtOffset: () => 1,
        getTotalHeight: () => 0,
        scheduleMeasure,
      };
      return;
    }
    const buildApi = (): TextareaLineOffsetsApi => ({
      getOffsetTopForLine: (line: number) => {
        if (offsetsRef.current.length === 0) recomputeOffsets();
        const o = offsetsRef.current;
        if (o.length === 0) return 0;
        const idx = Math.min(Math.max(line, 1), o.length) - 1;
        return o[idx] ?? 0;
      },
      getLineAtOffset: (scrollTop: number) => {
        if (offsetsRef.current.length === 0) recomputeOffsets();
        const o = offsetsRef.current;
        if (o.length === 0) return 1;
        let lo = 0;
        let hi = o.length - 1;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (o[mid] <= scrollTop) lo = mid;
          else hi = mid - 1;
        }
        return lo + 1;
      },
      getTotalHeight: () => mirrorRef.current?.scrollHeight ?? 0,
      scheduleMeasure,
    });
    apiRef.current = buildApi();
  }, [enabled, lines.length, recomputeOffsets, scheduleMeasure, value]);

  const MirrorLayer = enabled ? (
    <div
      ref={mirrorRef}
      aria-hidden
      className="absolute inset-0 invisible pointer-events-none z-0 overflow-hidden"
    >
      {lines.map((line, i) => (
        <div key={`${i}-${line.length}`} data-line={i + 1}>
          {line.length > 0 ? line : '\u200b'}
        </div>
      ))}
    </div>
  ) : null;

  return { apiRef, MirrorLayer };
}
