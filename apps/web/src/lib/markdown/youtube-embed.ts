export interface YouTubeEmbedInfo {
  videoId: string;
  listId?: string;
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

function parseYouTubeHost(url: URL): YouTubeEmbedInfo | null {
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const videoId = url.pathname.slice(1).split('/')[0];
    if (!videoId) return null;
    const listId = url.searchParams.get('list') ?? undefined;
    return { videoId, listId };
  }

  if (!YOUTUBE_HOSTS.has(url.hostname) && host !== 'youtube.com') {
    return null;
  }

  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'watch') {
    const videoId = url.searchParams.get('v');
    if (!videoId) return null;
    const listId = url.searchParams.get('list') ?? undefined;
    return { videoId, listId };
  }

  if (pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'v') {
    const videoId = pathParts[1];
    if (!videoId) return null;
    const listId = url.searchParams.get('list') ?? undefined;
    return { videoId, listId };
  }

  return null;
}

/**
 * Parse a YouTube watch, short, embed, or youtu.be URL into embed metadata.
 */
export function parseYouTubeVideoId(href: string): YouTubeEmbedInfo | null {
  if (!href?.trim()) return null;

  try {
    const url = new URL(href, 'https://youtube.com');
    return parseYouTubeHost(url);
  } catch {
    return null;
  }
}

/**
 * Build a privacy-friendly YouTube embed iframe src.
 */
export function toYouTubeEmbedSrc(info: YouTubeEmbedInfo): string {
  const params = new URLSearchParams();
  if (info.listId) {
    params.set('list', info.listId);
  }
  const query = params.toString();
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(info.videoId)}${query ? `?${query}` : ''}`;
}
