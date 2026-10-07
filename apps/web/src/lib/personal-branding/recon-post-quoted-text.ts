/** Matches ingest format from `twitter_x_api_client._tweet_text_from_row`. */
export const RECON_POST_QUOTED_MARKER = '\n\nQuoted:\n';

export type ReconPostQuotedSplit = {
  primary: string;
  quoted: string | null;
};

export function splitReconPostQuotedText(text: string): ReconPostQuotedSplit {
  const markerIndex = text.indexOf(RECON_POST_QUOTED_MARKER);
  if (markerIndex === -1) {
    return { primary: text, quoted: null };
  }

  const primary = text.slice(0, markerIndex);
  const quoted = text.slice(markerIndex + RECON_POST_QUOTED_MARKER.length).trimEnd();

  if (!quoted) {
    return { primary: text, quoted: null };
  }

  if (!primary.trim()) {
    return { primary: '', quoted };
  }

  return { primary, quoted };
}
