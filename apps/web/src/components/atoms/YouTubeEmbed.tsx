import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { parseYouTubeVideoId, toYouTubeEmbedSrc } from '@/lib/markdown/youtube-embed';

interface YouTubeEmbedProps {
  href: string;
  caption?: ReactNode;
  className?: string;
}

export default function YouTubeEmbed({ href, caption, className }: YouTubeEmbedProps) {
  const info = parseYouTubeVideoId(href);
  if (!info) return null;

  const embedSrc = toYouTubeEmbedSrc(info);
  const title =
    typeof caption === 'string' && caption.trim().length > 0 ? caption : 'YouTube video';

  return (
    <figure
      className={cn(
        'my-4 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      data-testid="youtube-embed"
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={embedSrc}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
        {caption ? (
          <span className="font-medium text-gray-800 dark:text-gray-200">{caption}</span>
        ) : null}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Open on YouTube
        </a>
      </figcaption>
    </figure>
  );
}
