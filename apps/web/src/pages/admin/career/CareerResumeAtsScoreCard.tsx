import type { CareerResumeAtsScoreBreakdown } from '@/types/api/career.types';

type Props = {
  atsScore: number | null | undefined;
  atsScoreBefore?: number | null;
  atsScoreDelta?: number | null;
  llmAtsScore?: number | null;
  breakdown?: CareerResumeAtsScoreBreakdown | null;
  mode?: 'preview' | 'draft';
  className?: string;
};

function formatDelta(delta: number | null | undefined): string {
  if (delta == null || delta === 0) return '±0';
  return delta > 0 ? `+${delta}` : String(delta);
}

export function CareerResumeAtsScoreCard({
  atsScore,
  atsScoreBefore,
  atsScoreDelta,
  llmAtsScore,
  breakdown,
  mode = 'draft',
  className = '',
}: Props) {
  const score = atsScore ?? breakdown?.totalScore ?? 0;
  const suggestions = breakdown?.suggestions ?? [];
  const components = breakdown?.components ?? [];

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-4 space-y-3 ${className}`}
      data-testid="career-resume-ats-card"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">
            {mode === 'preview' ? 'ATS preview (deterministic)' : 'ATS score (deterministic)'}
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{score}</div>
        </div>
        {mode === 'draft' && atsScoreBefore != null ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Before generate: <span className="font-medium">{atsScoreBefore}</span>
            {atsScoreDelta != null ? (
              <>
                {' '}
                · Δ <span className="font-medium">{formatDelta(atsScoreDelta)}</span>
              </>
            ) : null}
          </div>
        ) : null}
        {llmAtsScore != null ? (
          <div className="text-xs text-gray-500">
            LLM self-rated ATS: {llmAtsScore} (not used for export gate)
          </div>
        ) : null}
      </div>

      {components.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Breakdown
          </div>
          <ul className="space-y-1.5 text-sm">
            {components.map((c) => (
              <li key={c.componentId} className="flex flex-col gap-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-800 dark:text-gray-200">{c.label}</span>
                  <span className="text-gray-600 dark:text-gray-400 shrink-0">
                    {c.earnedPoints}/{c.maxPoints}
                  </span>
                </div>
                {c.detail ? <span className="text-xs text-gray-500">{c.detail}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Suggestions
          </div>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
            {suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
