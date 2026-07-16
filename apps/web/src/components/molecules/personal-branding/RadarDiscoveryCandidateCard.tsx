import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Layers, MoreVertical, Save } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import type { RadarDiscoveryCandidate } from '@/types/api/personal-branding.dto';

interface RadarDiscoveryCandidateCardProps {
  candidate: RadarDiscoveryCandidate;
  isSaving?: boolean;
  isAddingAsItem?: boolean;
  isMarkingNotASource?: boolean;
  isParsingSources?: boolean;
  onSave: () => void;
  onAddAsItem: () => void;
  onMarkNotASource: () => void;
  onParseSources: () => void;
}

function formatConfidence(value?: number | null): string {
  if (value == null) return 'Not scored';
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}% confidence`;
}

export default function RadarDiscoveryCandidateCard({
  candidate,
  isSaving = false,
  isAddingAsItem = false,
  isMarkingNotASource = false,
  isParsingSources = false,
  onSave,
  onAddAsItem,
  onMarkNotASource,
  onParseSources,
}: RadarDiscoveryCandidateCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const verifiedEndpoint = candidate.resolvedEndpoint ?? candidate.endpoint;
  const isMarkedNotASource = candidate.userNotASource === true;
  const isParseLive =
    isParsingSources || candidate.parseStatus === 'queued' || candidate.parseStatus === 'running';
  const canParseSources = !isMarkedNotASource && Boolean(candidate.url) && !isParseLive;
  const canSave =
    !isMarkedNotASource &&
    candidate.verdict === 'relevant' &&
    !candidate.savedSourceId &&
    candidate.duplicateStatus === 'new' &&
    Boolean(verifiedEndpoint) &&
    !candidate.error;
  const canAddAsItem =
    !isMarkedNotASource &&
    candidate.verdict === 'not_relevant' &&
    !candidate.savedItemId &&
    Boolean(candidate.url) &&
    !candidate.error;
  const destination = candidate.url || verifiedEndpoint || '#';

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  const handleConfirmNotASource = () => {
    onMarkNotASource();
    setConfirmOpen(false);
  };

  return (
    <>
      <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {(candidate.sourceType ?? 'Candidate') +
                (verifiedEndpoint ? ` · ${verifiedEndpoint}` : '')}
            </p>
            <h4 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
              {candidate.title}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isMarkedNotASource ? <StatusBadge status="Not a source" size="sm" /> : null}
            <StatusBadge status={candidate.verdict ?? 'pending'} size="sm" />
            {candidate.probeStatus ? (
              <StatusBadge status={candidate.probeStatus} size="sm" />
            ) : null}
            {candidate.duplicateStatus !== 'new' ? (
              <StatusBadge status={candidate.duplicateStatus} size="sm" />
            ) : null}
            {isParseLive ? <StatusBadge status="Parsing" size="sm" /> : null}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                disabled={isMarkingNotASource || isMarkedNotASource}
                className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                aria-label="Candidate options"
                aria-expanded={menuOpen}
              >
                <MoreVertical className="size-4" aria-hidden />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canParseSources}
                    className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      setMenuOpen(false);
                      onParseSources();
                    }}
                  >
                    {isParseLive ? 'Parsing sources…' : 'Read and parse sources'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                  >
                    Not a source
                  </button>
                </div>
              ) : null}
            </div>
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
              {isMarkedNotASource
                ? 'Marked not a source'
                : candidate.savedSourceId
                  ? 'Saved to sources'
                  : candidate.savedItemId
                    ? 'Added to Trend Stream'
                    : canSave
                      ? 'Ready to save'
                      : canAddAsItem
                        ? 'Article — add to Trend Stream'
                        : 'Not saveable'}
            </dd>
          </div>
        </dl>

        {candidate.extractedEndpoints && candidate.extractedEndpoints.length > 0 ? (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Extracted feeds
            </p>
            <ul className="mt-1 space-y-1">
              {candidate.extractedEndpoints.map((row) => (
                <li key={row.url} className="truncate">
                  {row.verified ? '✓ ' : ''}
                  {row.label ? `${row.label}: ` : ''}
                  {row.url}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Open candidate
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <div className="flex flex-wrap gap-2">
            {canAddAsItem ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onAddAsItem}
                disabled={isAddingAsItem}
                aria-label="Add as Trend Stream card"
              >
                <Layers className="h-4 w-4" aria-hidden />
                Add as Trend Stream card
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={!canSave || isSaving}
              aria-label="Save source"
            >
              <Save className="h-4 w-4" aria-hidden />
              Save source
            </Button>
          </div>
        </div>
      </article>

      <Dialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Mark as not a source?"
        size="md"
      >
        <div className="space-y-4 p-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Future discovery runs will skip this URL and similar results. The system will use this
            as an example of what not to surface.
          </p>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isMarkingNotASource}
              onClick={handleConfirmNotASource}
            >
              {isMarkingNotASource ? 'Marking…' : 'Mark not a source'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  );
}
