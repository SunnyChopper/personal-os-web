import LinearProgressBar from '@/components/atoms/LinearProgressBar';
import {
  contentStreamProgressPercent,
  contentStreamStatusLabel,
} from '@/lib/personal-branding/content-stream-progress';
import { cn } from '@/lib/utils';
import type { ContentStreamJob } from '@/types/api/personal-branding.dto';

interface ContentStreamProgressStripProps {
  job: ContentStreamJob | null | undefined;
  className?: string;
}

export default function ContentStreamProgressStrip({
  job,
  className,
}: ContentStreamProgressStripProps) {
  if (!job || (job.status !== 'queued' && job.status !== 'running' && job.status !== 'failed')) {
    return null;
  }

  const percent = contentStreamProgressPercent(job);
  const isTerminalFailed = job.status === 'failed';
  const statusLabel = contentStreamStatusLabel(job);

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/40',
        isTerminalFailed && 'border-red-200/80 dark:border-red-900/50',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={!isTerminalFailed}
      aria-label="Content stream progress"
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'min-w-0 text-sm font-medium',
            isTerminalFailed ? 'text-red-800 dark:text-red-200' : 'text-gray-900 dark:text-white'
          )}
        >
          {statusLabel}
        </p>
        <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {percent}%
        </span>
      </div>
      <LinearProgressBar
        value={percent}
        max={100}
        label="Content stream progress"
        variant={isTerminalFailed ? 'danger' : 'default'}
        className="mt-2.5"
      />
    </div>
  );
}
