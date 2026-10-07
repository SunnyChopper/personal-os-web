import { RECON_POST_QUOTED_MARKER } from '@/lib/personal-branding/recon-post-quoted-text';

/** Matches backend `creator_text_quality.SPARSE_SUBSTANTIVE_CHAR_THRESHOLD`. */
export const SPARSE_SUBSTANTIVE_CHAR_THRESHOLD = 40;

const TCO_URL_RE = /https?:\/\/t\.co\/\S+/gi;
const X_STATUS_URL_RE = /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/\S+\/status\/\d+/gi;

function stripCreatorTextUrls(text: string): string {
  return text.replace(TCO_URL_RE, '').replace(X_STATUS_URL_RE, '');
}

function substantiveCharCount(text: string): number {
  const cleaned = stripCreatorTextUrls(text);
  let count = 0;
  for (const char of cleaned) {
    if (/[A-Za-z0-9]/.test(char)) {
      count += 1;
    }
  }
  return count;
}

function bodiesForSparseCheck(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [''];
  }
  const markerIndex = trimmed.indexOf(RECON_POST_QUOTED_MARKER);
  if (markerIndex === -1) {
    return [trimmed];
  }
  const primary = trimmed.slice(0, markerIndex);
  const quoted = trimmed.slice(markerIndex + RECON_POST_QUOTED_MARKER.length).trimEnd();
  if (!quoted) {
    return [trimmed];
  }
  if (!primary.trim()) {
    return [quoted];
  }
  return [primary, quoted];
}

export function substantiveCreatorTextLength(text: string): number {
  return bodiesForSparseCheck(text).reduce((sum, body) => sum + substantiveCharCount(body), 0);
}

export function isSparseCreatorText(text: string): boolean {
  return substantiveCreatorTextLength(text) < SPARSE_SUBSTANTIVE_CHAR_THRESHOLD;
}
