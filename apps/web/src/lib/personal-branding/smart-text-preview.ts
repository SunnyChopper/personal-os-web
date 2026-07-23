export const DEFAULT_PREVIEW_MAX_CHARS = 280;

const ELLIPSIS = '…';

const SENTENCE_END_REGEX = /[.!?]["']?(?=\s|$)/g;
const CLAUSE_END_CHARS = new Set([',', ';', ':', '—', '–']);

export function normalizePreviewText(body: string): string {
  return body.replace(/\s+/g, ' ').trim();
}

export function previewNeedsExpansion(body: string, maxChars = DEFAULT_PREVIEW_MAX_CHARS): boolean {
  const normalized = normalizePreviewText(body);
  return normalized.length > maxChars;
}

function findSentenceBreak(text: string, minIndex: number, maxIndex: number): number {
  const window = text.slice(0, maxIndex + 1);
  const matches = [...window.matchAll(SENTENCE_END_REGEX)];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const endIndex = (match.index ?? 0) + match[0].length;
    if (endIndex >= minIndex) {
      return endIndex;
    }
  }
  return -1;
}

function findClauseBreak(text: string, minIndex: number, maxIndex: number): number {
  for (let index = maxIndex; index >= minIndex; index -= 1) {
    if (CLAUSE_END_CHARS.has(text[index] ?? '')) {
      return index + 1;
    }
  }
  return -1;
}

function findWordBreak(text: string, minIndex: number, maxIndex: number): number {
  for (let index = maxIndex; index >= minIndex; index -= 1) {
    if (/\s/.test(text[index] ?? '')) {
      return index;
    }
  }
  return -1;
}

export function smartTruncatePreview(body: string, maxChars = DEFAULT_PREVIEW_MAX_CHARS): string {
  const normalized = normalizePreviewText(body);
  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;

  const minIndex = Math.floor(maxChars * 0.55);
  const searchEnd = maxChars - 1;

  const sentenceBreak = findSentenceBreak(normalized, minIndex, searchEnd);
  if (sentenceBreak > minIndex) {
    return `${normalized.slice(0, sentenceBreak).trimEnd()}${ELLIPSIS}`;
  }

  const clauseBreak = findClauseBreak(normalized, minIndex, searchEnd);
  if (clauseBreak > minIndex) {
    return `${normalized.slice(0, clauseBreak).trimEnd()}${ELLIPSIS}`;
  }

  const wordBreak = findWordBreak(normalized, minIndex, searchEnd);
  if (wordBreak > minIndex) {
    return `${normalized.slice(0, wordBreak).trimEnd()}${ELLIPSIS}`;
  }

  return `${normalized.slice(0, maxChars).trimEnd()}${ELLIPSIS}`;
}
