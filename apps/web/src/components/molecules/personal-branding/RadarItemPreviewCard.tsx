import { ExternalLink } from 'lucide-react';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import { linkAccentClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import {
  RADAR_ITEM_TYPE_LABELS,
  type RadarSourcePreviewItem,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

function formatDate(value?: string | null): string {
  if (!value) return '';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(parsed));
}

export function RadarItemPreviewCard({ item }: { item: RadarSourcePreviewItem }) {
  const link = item.url ?? item.repositoryUrl;

  return (
    <article className={cn(gridItemCardClassName, 'p-3')}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-gray-900 dark:text-white">
          {item.title}
        </h3>
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
          {RADAR_ITEM_TYPE_LABELS[item.itemType]}
        </span>
      </div>
      {item.summary ? (
        <p className="mt-1.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
          {item.summary}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
        {item.publishedAt ? <span>{formatDate(item.publishedAt)}</span> : null}
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            linkAccentClassName
          )}
        >
          Open
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </article>
  );
}
