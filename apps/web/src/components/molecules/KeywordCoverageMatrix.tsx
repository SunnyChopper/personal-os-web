import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KeywordCoverageMatrixProps = {
  mandatory: string[];
  matched: string[];
  missing: string[];
  className?: string;
};

export function KeywordCoverageMatrix({
  mandatory,
  matched,
  missing,
  className,
}: KeywordCoverageMatrixProps) {
  const total = mandatory.length;
  const matchedCount = matched.length;
  const missingSet = new Set(missing.map((k) => k.toLowerCase()));
  const matchedSet = new Set(matched.map((k) => k.toLowerCase()));

  if (total === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 text-sm text-gray-500',
          className
        )}
      >
        <p className="font-medium text-gray-800 dark:text-gray-200">Mandatory keyword coverage</p>
        <p className="mt-1 text-xs">
          Analyze a job posting or add job text before generating to populate the keyword matrix.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3',
        className
      )}
      role="region"
      aria-label="Mandatory keyword coverage"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
          Mandatory keyword coverage
        </h5>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            missing.length === 0
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          )}
        >
          {matchedCount} / {total}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Exact string match (case-insensitive). Fix missing terms before export.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {mandatory.map((keyword) => {
          const key = keyword.toLowerCase();
          const isMatched = matchedSet.has(key);
          const isMissing = missingSet.has(key);
          const status: 'matched' | 'missing' | 'unknown' = isMatched
            ? 'matched'
            : isMissing
              ? 'missing'
              : 'unknown';

          return (
            <li key={keyword}>
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium ring-1',
                  status === 'matched' &&
                    'bg-green-50 text-green-800 ring-green-200 dark:bg-green-950/40 dark:text-green-200 dark:ring-green-900/60',
                  status === 'missing' &&
                    'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60',
                  status === 'unknown' &&
                    'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:ring-gray-700'
                )}
              >
                {status === 'matched' ? (
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : status === 'missing' ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : null}
                <span className="min-w-0 truncate">{keyword}</span>
                {status === 'missing' ? (
                  <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide">
                    Missing
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
