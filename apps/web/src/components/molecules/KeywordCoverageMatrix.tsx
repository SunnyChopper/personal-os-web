import { AlertTriangle, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CareerKeywordCoverageItem } from '@/types/api/career.types';

export type KeywordCoverageMatrixResumeProps = {
  mode?: 'resume';
  mandatory: string[];
  matched: string[];
  missing: string[];
  className?: string;
};

export type KeywordCoverageMatrixExperienceProps = {
  mode: 'experience';
  items: CareerKeywordCoverageItem[];
  className?: string;
};

export type KeywordCoverageMatrixProps =
  | KeywordCoverageMatrixResumeProps
  | KeywordCoverageMatrixExperienceProps;

function ExperienceKeywordRow({ item }: { item: CareerKeywordCoverageItem }) {
  const status = item.status;
  return (
    <li>
      <div
        className={cn(
          'rounded-md px-2 py-1.5 text-xs ring-1 space-y-1',
          status === 'matched' &&
            'bg-green-50 text-green-800 ring-green-200 dark:bg-green-950/40 dark:text-green-200 dark:ring-green-900/60',
          status === 'partial' &&
            'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60',
          status === 'missing' &&
            'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60'
        )}
      >
        <div className="flex items-center gap-1.5 font-medium">
          {status === 'matched' ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : status === 'partial' ? (
            <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 truncate">{item.keyword}</span>
          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide capitalize">
            {status}
          </span>
        </div>
        {item.rationale ? <p className="text-[10px] opacity-90 pl-5">{item.rationale}</p> : null}
        {item.evidenceSnippets?.length ? (
          <ul className="text-[10px] opacity-80 pl-5 list-disc">
            {item.evidenceSnippets.slice(0, 2).map((s) => (
              <li key={s.slice(0, 40)} className="truncate">
                {s}
              </li>
            ))}
          </ul>
        ) : null}
        {item.matchedAchievementIds?.length ? (
          <p className="text-[10px] pl-5 opacity-70">
            Achievements: {item.matchedAchievementIds.join(', ')}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function ExperienceKeywordGroup({
  title,
  level,
  items,
}: {
  title: string;
  level: 'mandatory' | 'niceToHave';
  items: CareerKeywordCoverageItem[];
}) {
  const filtered = items.filter((i) => i.requirementLevel === level);
  if (!filtered.length) return null;
  return (
    <div className="space-y-2">
      <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</h6>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((item) => (
          <ExperienceKeywordRow key={`${level}-${item.keyword}`} item={item} />
        ))}
      </ul>
    </div>
  );
}

export function KeywordCoverageMatrix(props: KeywordCoverageMatrixProps) {
  if (props.mode === 'experience') {
    const { items, className } = props;
    if (!items.length) {
      return (
        <div
          className={cn(
            'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 text-sm text-gray-500',
            className
          )}
        >
          <p className="font-medium text-gray-800 dark:text-gray-200">
            Experience keyword coverage
          </p>
          <p className="mt-1 text-xs">No keywords to compare against your achievement bank.</p>
        </div>
      );
    }
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 space-y-3',
          className
        )}
        role="region"
        aria-label="Experience keyword coverage"
      >
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
            Experience keyword coverage
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Matched = achievement bullets; partial = profile/job metadata only; missing = no
            grounded evidence. Export gate still uses deterministic resume diff separately.
          </p>
        </div>
        <ExperienceKeywordGroup title="Mandatory" level="mandatory" items={items} />
        <ExperienceKeywordGroup title="Nice to have" level="niceToHave" items={items} />
      </div>
    );
  }

  const { mandatory, matched, missing, className } = props;
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
