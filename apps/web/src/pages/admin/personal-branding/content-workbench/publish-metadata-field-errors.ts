export type PublishMetadataFieldErrors = {
  platform?: string;
  canonicalUrl?: string;
};

const CANONICAL_URL_MAX_LENGTH = 2000;

export { CANONICAL_URL_MAX_LENGTH };

export function publishMetadataFieldErrors(error: unknown): PublishMetadataFieldErrors {
  const out: PublishMetadataFieldErrors = {};
  if (!error || typeof error !== 'object') return out;

  const details = (error as { details?: unknown }).details;

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const fields = (details as Record<string, unknown>).fields;
    if (fields && typeof fields === 'object') {
      const rec = fields as Record<string, unknown>;
      if (typeof rec.platform === 'string') out.platform = rec.platform;
      if (typeof rec.canonicalUrl === 'string') out.canonicalUrl = rec.canonicalUrl;
    }
  }

  if (Array.isArray(details)) {
    for (const item of details) {
      if (!item || typeof item !== 'object') continue;
      const loc = (item as { loc?: unknown }).loc;
      const msg = (item as { msg?: unknown }).msg;
      if (!Array.isArray(loc) || typeof msg !== 'string') continue;
      const field = loc[loc.length - 1];
      if (field === 'platform' && !out.platform) out.platform = msg;
      if (field === 'canonicalUrl' && !out.canonicalUrl) out.canonicalUrl = msg;
    }
  }

  return out;
}

export function clientCanonicalUrlError(url: string, urlTouched: boolean): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.length > CANONICAL_URL_MAX_LENGTH) {
    return `Canonical URL must be at most ${CANONICAL_URL_MAX_LENGTH} characters.`;
  }
  if (urlTouched) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'Canonical URL must start with http:// or https://';
      }
    } catch {
      return 'Enter a valid http:// or https:// URL';
    }
  }
  return null;
}

export function isValidCanonicalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > CANONICAL_URL_MAX_LENGTH) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
