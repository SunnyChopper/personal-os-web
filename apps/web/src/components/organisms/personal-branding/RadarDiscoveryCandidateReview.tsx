import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import RadarDiscoveryCandidateCard from '@/components/molecules/personal-branding/RadarDiscoveryCandidateCard';
import type { RadarDiscoveryCandidateFilter } from '@/lib/personal-branding/radar-discovery';
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
  savingCandidateId?: string | null;
  onFilterChange: (filter: RadarDiscoveryCandidateFilter) => void;
  onPageChange: (page: number) => void;
  onSave: (candidateId: string) => void;
}

export default function RadarDiscoveryCandidateReview({
  candidates,
  filter,
  page,
  isLoading = false,
  error,
  savingCandidateId = null,
  onFilterChange,
  onPageChange,
  onSave,
}: RadarDiscoveryCandidateReviewProps) {
  const rows = candidates?.data ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((candidates?.total ?? 0) / (candidates?.pageSize ?? 20))
  );

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
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((candidate) => (
              <RadarDiscoveryCandidateCard
                key={candidate.id}
                candidate={candidate}
                isSaving={savingCandidateId === candidate.id}
                onSave={() => onSave(candidate.id)}
              />
            ))}
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
                disabled={page <= 1 || isLoading}
                aria-label="Previous candidate page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(page + 1)}
                disabled={!candidates.hasMore || isLoading}
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
