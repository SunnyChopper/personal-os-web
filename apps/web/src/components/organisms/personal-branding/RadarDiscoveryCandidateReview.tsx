import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import RadarDiscoveryCandidateCard from '@/components/molecules/personal-branding/RadarDiscoveryCandidateCard';
import {
  MAX_DISCOVERY_CANDIDATE_SELECTION,
  type RadarDiscoveryCandidateFilter,
} from '@/lib/personal-branding/radar-discovery';
import type {
  PaginatedPersonalBranding,
  RadarDiscoveryCandidate,
} from '@/types/api/personal-branding.dto';

const FILTERS: Array<{ id: RadarDiscoveryCandidateFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'relevant', label: 'Relevant' },
  { id: 'irrelevant', label: 'Not relevant' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'errors', label: 'Errors' },
];

interface RadarDiscoveryCandidateReviewProps {
  candidates?: PaginatedPersonalBranding<RadarDiscoveryCandidate>;
  filter: RadarDiscoveryCandidateFilter;
  page: number;
  isLoading?: boolean;
  error?: Error | null;
  selectedCandidateIds?: string[];
  savingCandidateId?: string | null;
  addingCandidateId?: string | null;
  markingCandidateId?: string | null;
  dismissingCandidateId?: string | null;
  parsingCandidateId?: string | null;
  bulkAction?: 'add' | 'dismiss' | 'not-a-source' | null;
  onFilterChange: (filter: RadarDiscoveryCandidateFilter) => void;
  onPageChange: (page: number) => void;
  onToggleCandidateSelected: (candidateId: string) => void;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onBulkAddAsItem: () => void;
  onBulkDismiss: () => void;
  onBulkNotASource: () => void;
  onSave: (candidateId: string) => void;
  onAddAsItem: (candidateId: string) => void;
  onMarkNotASource: (candidateId: string) => void;
  onDismiss: (candidateId: string) => void;
  onParseSources: (candidateId: string) => void;
}

export default function RadarDiscoveryCandidateReview({
  candidates,
  filter,
  page,
  isLoading = false,
  error,
  selectedCandidateIds = [],
  savingCandidateId = null,
  addingCandidateId = null,
  markingCandidateId = null,
  dismissingCandidateId = null,
  parsingCandidateId = null,
  bulkAction = null,
  onFilterChange,
  onPageChange,
  onToggleCandidateSelected,
  onSelectAllVisible,
  onClearSelection,
  onBulkAddAsItem,
  onBulkDismiss,
  onBulkNotASource,
  onSave,
  onAddAsItem,
  onMarkNotASource,
  onDismiss,
  onParseSources,
}: RadarDiscoveryCandidateReviewProps) {
  const rows = candidates?.data ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((candidates?.total ?? 0) / (candidates?.pageSize ?? 20))
  );
  const selectionAtCap = selectedCandidateIds.length >= MAX_DISCOVERY_CANDIDATE_SELECTION;
  const allVisibleSelected =
    rows.length > 0 &&
    rows
      .slice(0, MAX_DISCOVERY_CANDIDATE_SELECTION)
      .every((candidate) => selectedCandidateIds.includes(candidate.id));
  const bulkBusy = bulkAction != null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Candidate review</CardTitle>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Save relevant, non-duplicate candidates into Source Management.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Candidate filters">
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={filter === item.id ? 'primary' : 'ghost'}
                onClick={() => onFilterChange(item.id)}
                aria-pressed={filter === item.id}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          >
            {error.message}
          </div>
        ) : isLoading && rows.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
            Loading candidates…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            No candidates match this filter yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.length > 0 ? (
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FormCheckbox
                  checked={allVisibleSelected}
                  onChange={allVisibleSelected ? onClearSelection : onSelectAllVisible}
                  disabled={bulkBusy}
                />
                Select visible (up to {MAX_DISCOVERY_CANDIDATE_SELECTION})
              </label>
            ) : null}

            {selectedCandidateIds.length > 0 ? (
              <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40">
                <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                  {selectedCandidateIds.length} candidate
                  {selectedCandidateIds.length === 1 ? '' : 's'} selected
                  {selectionAtCap ? ` (max ${MAX_DISCOVERY_CANDIDATE_SELECTION})` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onClearSelection}
                    disabled={bulkBusy}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onBulkAddAsItem}
                    disabled={bulkBusy}
                  >
                    {bulkAction === 'add' ? 'Adding…' : 'Add as Trend Stream cards'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onBulkDismiss}
                    disabled={bulkBusy}
                  >
                    {bulkAction === 'dismiss' ? 'Discarding…' : 'Discard candidates'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onBulkNotASource}
                    disabled={bulkBusy}
                  >
                    {bulkAction === 'not-a-source' ? 'Marking…' : 'Not sources'}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="max-h-[70vh] overflow-y-auto rounded-lg pr-1">
              <div className="grid gap-4 xl:grid-cols-2">
                {rows.map((candidate) => (
                  <RadarDiscoveryCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    selected={selectedCandidateIds.includes(candidate.id)}
                    selectionDisabled={
                      bulkBusy || (!selectedCandidateIds.includes(candidate.id) && selectionAtCap)
                    }
                    isSaving={savingCandidateId === candidate.id}
                    isAddingAsItem={addingCandidateId === candidate.id}
                    isMarkingNotASource={markingCandidateId === candidate.id}
                    isDismissing={dismissingCandidateId === candidate.id}
                    isParsingSources={parsingCandidateId === candidate.id}
                    onToggleSelected={() => onToggleCandidateSelected(candidate.id)}
                    onSave={() => onSave(candidate.id)}
                    onAddAsItem={() => onAddAsItem(candidate.id)}
                    onMarkNotASource={() => onMarkNotASource(candidate.id)}
                    onDismiss={() => onDismiss(candidate.id)}
                    onParseSources={() => onParseSources(candidate.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {candidates && candidates.total > candidates.pageSize ? (
          <nav
            className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700"
            aria-label="Discovery candidate pagination"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages} · {candidates.total} candidates
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading || bulkBusy}
                aria-label="Previous candidate page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(page + 1)}
                disabled={!candidates.hasMore || isLoading || bulkBusy}
                aria-label="Next candidate page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </nav>
        ) : null}
      </CardBody>
    </Card>
  );
}
