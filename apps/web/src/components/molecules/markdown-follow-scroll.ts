import type { TextareaLineOffsetsApi } from '@/components/molecules/UseTextareaLineOffsets';

export type PreviewBlock = { line: number; top: number };

/** Offset from scroll root's content origin (works with nested offsetParents). */
export function getOffsetTopRelativeToScrollRoot(root: HTMLElement, el: HTMLElement): number {
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.top - rootRect.top + root.scrollTop;
}

export function readPreviewBlocks(root: HTMLElement): PreviewBlock[] {
  const out: PreviewBlock[] = [];
  root.querySelectorAll<HTMLElement>('[data-source-line]').forEach((el) => {
    const raw = el.dataset.sourceLine;
    const line = raw ? Number(raw) : Number.NaN;
    if (!Number.isNaN(line)) {
      out.push({ line, top: getOffsetTopRelativeToScrollRoot(root, el) });
    }
  });

  const byLine = new Map<number, number>();
  for (const b of out) {
    const prev = byLine.get(b.line);
    if (prev === undefined || b.top < prev) {
      byLine.set(b.line, b.top);
    }
  }
  return Array.from(byLine.entries())
    .map(([line, top]) => ({ line, top }))
    .sort((a, b) => a.line - b.line);
}

export function syncTextareaScrollToPreview(
  textarea: HTMLTextAreaElement,
  preview: HTMLElement,
  mirror: TextareaLineOffsetsApi,
  blocks: PreviewBlock[]
): void {
  if (blocks.length === 0) return;
  const topLine = mirror.getLineAtOffset(textarea.scrollTop);

  if (topLine <= blocks[0].line) {
    preview.scrollTop = 0;
    return;
  }

  const last = blocks.at(-1)!;
  if (topLine >= last.line) {
    preview.scrollTop = Math.max(0, preview.scrollHeight - preview.clientHeight);
    return;
  }

  let i = 0;
  while (i + 1 < blocks.length && blocks[i + 1].line <= topLine) {
    i += 1;
  }

  const b0 = blocks[i];
  const b1 = blocks[i + 1];
  if (!b1) {
    preview.scrollTop = b0.top;
    return;
  }

  const denom = b1.line - b0.line;
  const t = denom > 0 ? (topLine - b0.line) / denom : 0;
  preview.scrollTop = b0.top + t * (b1.top - b0.top);
}

export function syncPreviewScrollToTextarea(
  textarea: HTMLTextAreaElement,
  preview: HTMLElement,
  mirror: TextareaLineOffsetsApi,
  blocks: PreviewBlock[]
): void {
  if (blocks.length === 0) return;
  const st = preview.scrollTop;
  const maxSt = Math.max(0, preview.scrollHeight - preview.clientHeight);

  if (st >= maxSt - 0.5) {
    const maxTa = Math.max(0, mirror.getTotalHeight() - textarea.clientHeight);
    textarea.scrollTop = maxTa;
    return;
  }

  if (st <= blocks[0].top) {
    textarea.scrollTop = Math.max(0, mirror.getOffsetTopForLine(blocks[0].line));
    return;
  }

  let i = 0;
  while (i + 1 < blocks.length && blocks[i + 1].top <= st) {
    i += 1;
  }

  const b0 = blocks[i];
  const b1 = blocks[i + 1];
  if (!b1 || b1.top === b0.top) {
    textarea.scrollTop = mirror.getOffsetTopForLine(b0.line);
    return;
  }

  const t = (st - b0.top) / (b1.top - b0.top);
  const line = b0.line + t * (b1.line - b0.line);
  const lineLow = Math.floor(line);
  const lineHigh = Math.min(lineLow + 1, blocks.at(-1)!.line);
  const frac = line - lineLow;

  const y0 = mirror.getOffsetTopForLine(lineLow);
  const y1 = mirror.getOffsetTopForLine(lineHigh);
  textarea.scrollTop = y0 + frac * (y1 - y0);
}
