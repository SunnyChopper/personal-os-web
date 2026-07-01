import type {
  CareerResumeProvenanceItem,
  CareerResumeQualityWarning,
} from '@/types/api/career.types';

type Props = {
  exportReady?: boolean;
  qualityStatus?: string;
  provenance?: CareerResumeProvenanceItem[];
  qualityWarnings?: CareerResumeQualityWarning[];
  className?: string;
};

export function CareerResumeProvenancePanel({
  exportReady = true,
  qualityStatus = 'ok',
  provenance = [],
  qualityWarnings = [],
  className = '',
}: Props) {
  const unsupported = provenance.filter((p) => !p.supported);
  const blocked = exportReady === false || qualityStatus === 'blocked';

  if (!blocked && unsupported.length === 0 && qualityWarnings.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        blocked
          ? 'border-amber-500/60 bg-amber-50/80 dark:bg-amber-950/30'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
      } ${className}`}
      data-testid="career-resume-provenance-panel"
    >
      {blocked ? (
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Export blocked: one or more bullets are not backed by selected achievements. Fix or
          regenerate unsupported sections before exporting.
        </p>
      ) : null}

      {qualityWarnings.length > 0 ? (
        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          {qualityWarnings.map((w, i) => (
            <li key={`${w.code}-${w.sectionId ?? i}`}>
              {w.message}
              {w.sectionId ? (
                <span className="text-xs text-gray-500 ml-1">({w.sectionId})</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {unsupported.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Unsupported bullets
          </div>
          <ul className="text-sm space-y-2">
            {unsupported.map((p) => (
              <li
                key={`${p.sectionId}-${p.bulletText.slice(0, 40)}`}
                className="rounded-md border border-amber-200/80 dark:border-amber-800/60 px-2 py-1.5"
              >
                <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                  {p.bulletText}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{p.message}</div>
                {p.sourceAchievementIds?.length ? (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Cited: {p.sourceAchievementIds.join(', ')}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
