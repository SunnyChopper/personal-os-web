import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PREVIEW_MAX_CHARS,
  normalizePreviewText,
  previewNeedsExpansion,
  smartTruncatePreview,
} from '@/lib/personal-branding/smart-text-preview';

export type ExpandablePlainTextPreviewProps = {
  text: string;
  maxChars?: number;
  className?: string;
  expandedMaxHeightClassName?: string;
};

export function ExpandablePlainTextPreview({
  text,
  maxChars = DEFAULT_PREVIEW_MAX_CHARS,
  className,
  expandedMaxHeightClassName = 'max-h-48',
}: ExpandablePlainTextPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const normalized = normalizePreviewText(text);

  if (!normalized) return null;

  const canExpand = previewNeedsExpansion(text, maxChars);
  const displayText = expanded ? normalized : smartTruncatePreview(text, maxChars);

  return (
    <div className="space-y-1">
      <p className={cn(className, expanded && cn('overflow-y-auto', expandedMaxHeightClassName))}>
        {displayText}
      </p>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
}
