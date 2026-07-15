import { ExternalLink, Save } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { cn } from '@/lib/utils';
import type { RadarDiscoveryCandidate } from '@/types/api/personal-branding.dto';

interface RadarDiscoveryCandidateCardProps {
  candidate: RadarDiscoveryCandidate;
  isSaving?: boolean;
  onSave: () => void;
}

function formatConfidence(value?: number | null): string {
  if (value == null) return 'Not scored';
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}% confidence`;
}

export default function RadarDiscoveryCandidateCard({
  candidate,
  isSaving = false,
  onSave,
}: RadarDiscoveryCandidateCardProps) {
  const canSave =
    candidate.verdict === 'relevant' &&
    !candidate.savedSourceId &&
    candidate.duplicateStatus === 'new' &&
    Boolean(candidate.endpoint) &&
    !candidate.error;
  const destination = candidate.url || candidate.endpoint || '#';

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {(candidate.sourceType ?? 'Candidate') +
              (candidate.endpoint ? ` · ${candidate.endpoint}` : '')}
          </p>
          <h4 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {candidate.title}
          </h4>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={candidate.verdict ?? 'pending'} size="sm" />
          {candidate.duplicateStatus !== 'new' ? (
            <StatusBadge status={candidate.duplicateStatus} size="sm" />
          ) : null}
        </div>
      </div>

      {candidate.snippet ? (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{candidate.snippet}</p>
      ) : null}

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            Decision
          </dt>
          <dd className="mt-1 text-gray-700 dark:text-gray-200">
            {formatConfidence(candidate.confidence)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            Save state
          </dt>
          <dd className="mt-1 text-gray-700 dark:text-gray-200">
            {candidate.savedSourceId
              ? 'Saved to sources'
              : canSave
                ? 'Ready to save'
                : 'Not saveable'}
          </dd>
        </div>
      </dl>

      {candidate.rationale ? (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
          <span className="font-medium text-gray-900 dark:text-white">Why: </span>
          {candidate.rationale}
        </div>
      ) : null}

      {candidate.matchedTopics.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Matched topics">
          {candidate.matchedTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
            >
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      {candidate.error ? (
        <p
          role="alert"
          className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {candidate.error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <a
          href={destination}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200'
          )}
        >
          Open candidate
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <Button
          type="button"
          size="sm"
          variant={candidate.savedSourceId ? 'ghost' : 'secondary'}
          disabled={!canSave || isSaving}
          onClick={onSave}
          className="gap-1.5"
        >
          <Save className="size-4" aria-hidden />
          {candidate.savedSourceId ? 'Saved' : isSaving ? 'Saving…' : 'Save source'}
        </Button>
      </div>
    </article>
  );
}
