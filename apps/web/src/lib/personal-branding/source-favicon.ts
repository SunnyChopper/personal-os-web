export function getSourceHostname(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getFaviconUrl(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSourceLetterAvatar(label: string): { letter: string; backgroundColor: string } {
  const trimmed = label.trim();
  const letter = (trimmed.charAt(0) || '?').toUpperCase();
  const hue = hashString(trimmed || 'source') % 360;
  return {
    letter,
    backgroundColor: `hsl(${hue} 55% 42%)`,
  };
}
