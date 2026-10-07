import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { RadarItemSnapshot } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { statusPillClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

const VISIBLE_SOURCE_LINKS = 2;

function snapshotLabel(snapshot: RadarItemSnapshot): string {
  return snapshot.sourceName ? `${snapshot.title} · ${snapshot.sourceName}` : snapshot.title;
}

function SourceLinkChip({
  snapshot,
  className,
}: {
  snapshot: RadarItemSnapshot;
  className?: string;
}) {
  const label = snapshotLabel(snapshot);
  const chipClassName = cn(
    statusPillClassName('neutral', 'inline-flex min-w-0 items-center gap-1'),
    className
  );

  if (snapshot.url) {
    return (
      <a href={snapshot.url} target="_blank" rel="noreferrer" className={chipClassName}>
        <span className="truncate">{label}</span>
        <ExternalLink className="size-3 shrink-0" aria-hidden />
      </a>
    );
  }

  return (
    <span className={cn(chipClassName, 'truncate')} title={label}>
      {label}
    </span>
  );
}

interface TrendIdeaSourceLinksProps {
  snapshots: RadarItemSnapshot[];
}

export function TrendIdeaSourceLinks({ snapshots }: TrendIdeaSourceLinksProps) {
  const [expanded, setExpanded] = useState(false);

  if (snapshots.length === 0) {
    return null;
  }

  const hasOverflow = snapshots.length > VISIBLE_SOURCE_LINKS;
  const hiddenCount = hasOverflow ? snapshots.length - VISIBLE_SOURCE_LINKS : 0;
  const primarySnapshots = hasOverflow ? snapshots.slice(0, VISIBLE_SOURCE_LINKS) : snapshots;
  const overflowSnapshots = hasOverflow && expanded ? snapshots.slice(VISIBLE_SOURCE_LINKS) : [];

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex flex-nowrap items-center gap-2">
        {primarySnapshots.map((snapshot) => (
          <SourceLinkChip
            key={snapshot.id}
            snapshot={snapshot}
            className={hasOverflow && !expanded ? 'max-w-[45%]' : 'max-w-full'}
          />
        ))}
        {hasOverflow ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="shrink-0 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {expanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        ) : null}
      </div>
      {overflowSnapshots.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {overflowSnapshots.map((snapshot) => (
            <SourceLinkChip key={snapshot.id} snapshot={snapshot} className="max-w-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
