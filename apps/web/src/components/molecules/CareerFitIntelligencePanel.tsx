import { cn } from '@/lib/utils';
import type { CareerApplicationRecommendation } from '@/types/api/career.types';
import { KeywordCoverageMatrix } from '@/components/molecules/KeywordCoverageMatrix';
import {
  fitRecommendationLabel,
  reachClassificationLabel,
} from '@/pages/admin/career/application-tracking-labels';

function FitChipList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'blue' | 'amber' | 'rose' | 'emerald';
}) {
  const tones = {
    blue: 'bg-blue-100/80 dark:bg-blue-900/40',
    amber: 'bg-amber-100/80 dark:bg-amber-900/40',
    rose: 'bg-rose-100/80 dark:bg-rose-900/40',
    emerald: 'bg-emerald-100/80 dark:bg-emerald-900/40',
  };
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items?.length ? (
          items.map((k, i) => (
            <span
              key={`${title}-${i}-${k}`}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs text-gray-900 dark:text-gray-100',
                tones[tone]
              )}
            >
              {k}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )}
      </div>
    </div>
  );
}

const REACH_TONE: Record<string, string> = {
  strongFit:
    'bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900/60',
  stretch:
    'bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900/60',
  outOfReach:
    'bg-rose-100 text-rose-900 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/60',
};

const SUB_SCORE_LABELS: {
  key: keyof NonNullable<CareerApplicationRecommendation['subScores']>;
  label: string;
}[] = [
  { key: 'skillsMatch', label: 'Skills' },
  { key: 'seniorityMatch', label: 'Seniority' },
  { key: 'yearsExperienceGap', label: 'Years of experience' },
  { key: 'domainMatch', label: 'Domain' },
  { key: 'locationCompFit', label: 'Location / comp' },
];

export type CareerFitIntelligencePanelProps = {
  fit: CareerApplicationRecommendation;
  roleLabel?: string;
  companyLabel?: string;
  className?: string;
};

export function CareerFitIntelligencePanel({
  fit,
  roleLabel,
  companyLabel,
  className,
}: CareerFitIntelligencePanelProps) {
  const reach = fit.reachClassification ?? 'stretch';

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 text-sm bg-gray-50/50 dark:bg-gray-900/40',
        className
      )}
    >
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div className="space-y-1">
          {roleLabel || companyLabel ? (
            <p className="font-medium text-gray-900 dark:text-white">
              {[roleLabel, companyLabel].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {fitRecommendationLabel(fit.recommendation ?? 'maybe')}
            {typeof fit.fitScore === 'number' ? ` · score ${fit.fitScore}` : ''}
            {typeof fit.confidence === 'number'
              ? ` · confidence ${(fit.confidence * 100).toFixed(0)}%`
              : ''}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1',
            REACH_TONE[reach] ?? REACH_TONE.stretch
          )}
        >
          {reachClassificationLabel(reach)}
        </span>
      </div>

      {fit.reachReasons?.length ? (
        <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-0.5">
          {fit.reachReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}

      {fit.rationale ? (
        <p className="text-sm text-gray-700 dark:text-gray-200">{fit.rationale}</p>
      ) : null}

      {fit.subScores ? (
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Fit breakdown
          </h5>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SUB_SCORE_LABELS.map(({ key, label }) => {
              const item = fit.subScores?.[key];
              if (!item) return null;
              return (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-2"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {label}
                    </span>
                    <span className="text-xs tabular-nums text-gray-500">{item.score}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 capitalize mt-0.5">{item.status}</p>
                  {item.reason ? (
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                      {item.reason}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {fit.gaps?.length ? (
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Gaps</h5>
          <ul className="space-y-2">
            {fit.gaps.map((gap) => (
              <li
                key={gap.id || gap.description}
                className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-2"
              >
                <div className="flex flex-wrap gap-2 items-baseline justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {gap.category || 'Gap'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    {gap.severity}
                    {gap.actionable ? ' · actionable' : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{gap.description}</p>
                {gap.linkedAchievementIds?.length ? (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Linked achievements: {gap.linkedAchievementIds.join(', ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {fit.keywordCoverage?.length ? (
        <KeywordCoverageMatrix mode="experience" items={fit.keywordCoverage} />
      ) : null}

      {fit.calibrationSignals?.length ? (
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Historical calibration
          </h5>
          <ul className="space-y-1.5">
            {fit.calibrationSignals.map((sig, i) => (
              <li
                key={`${sig.signalType}-${sig.theme ?? i}`}
                className="text-xs text-gray-700 dark:text-gray-300 rounded-md bg-slate-100/80 dark:bg-slate-900/50 px-2 py-1.5"
              >
                <span className="font-medium">{sig.signalType}</span>
                {sig.theme ? ` · ${sig.theme}` : ''}
                {sig.count ? ` (${sig.count})` : ''}
                {sig.explanation ? ` — ${sig.explanation}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {fit.nudges?.length ? (
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Nudges
          </h5>
          <ul className="space-y-2">
            {fit.nudges.map((nudge) => (
              <li
                key={nudge.id || nudge.action}
                className="rounded-lg border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-2"
              >
                <div className="flex flex-wrap gap-2 items-baseline justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {nudge.category || 'Action'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-blue-800 dark:text-blue-300">
                    {nudge.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">{nudge.action}</p>
                {nudge.why ? (
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{nudge.why}</p>
                ) : null}
                {nudge.linkedAchievementIds?.length ? (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Achievements: {nudge.linkedAchievementIds.join(', ')}
                  </p>
                ) : null}
                {nudge.suggestedAchievementDraft ? (
                  <p className="text-[11px] italic text-gray-600 dark:text-gray-400 mt-1 border-l-2 border-blue-300 pl-2">
                    Draft: {nudge.suggestedAchievementDraft}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200 dark:border-gray-700">
        <FitChipList title="Strengths" items={fit.matchedSignals ?? []} tone="emerald" />
        <FitChipList title="Gap signals" items={fit.gapSignals ?? []} tone="amber" />
        <FitChipList
          title="Rejection-risk signals"
          items={fit.rejectionRiskSignals ?? []}
          tone="rose"
        />
        <FitChipList title="Resume tweaks" items={fit.resumeAdjustments ?? []} tone="blue" />
      </div>
    </div>
  );
}
