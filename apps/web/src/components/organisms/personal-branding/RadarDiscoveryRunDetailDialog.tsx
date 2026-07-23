import Dialog from '@/components/molecules/Dialog';
import RadarDiscoveryCandidateReview from '@/components/organisms/personal-branding/RadarDiscoveryCandidateReview';
import RadarDiscoveryRunMonitor from '@/components/organisms/personal-branding/RadarDiscoveryRunMonitor';
import type { RadarDiscoveryCandidateFilter } from '@/lib/personal-branding/radar-discovery';
import type {
  PaginatedPersonalBranding,
  RadarDiscoveryCandidate,
  RadarDiscoveryRun,
} from '@/types/api/personal-branding.dto';

interface RadarDiscoveryRunDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  run?: RadarDiscoveryRun;
  isRunLoading?: boolean;
  pendingAction?: 'pause' | 'resume' | 'cancel' | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  candidates?: PaginatedPersonalBranding<RadarDiscoveryCandidate>;
  candidateFilter: RadarDiscoveryCandidateFilter;
  candidatePage: number;
  isCandidatesLoading?: boolean;
  candidatesError?: Error | null;
  selectedCandidateIds?: string[];
  savingCandidateId?: string | null;
  addingCandidateId?: string | null;
  markingCandidateId?: string | null;
  dismissingCandidateId?: string | null;
  parsingCandidateId?: string | null;
  bulkAction?: 'add' | 'dismiss' | 'not-a-source' | null;
  onCandidateFilterChange: (filter: RadarDiscoveryCandidateFilter) => void;
  onCandidatePageChange: (page: number) => void;
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

export default function RadarDiscoveryRunDetailDialog({
  isOpen,
  onClose,
  title,
  run,
  isRunLoading = false,
  pendingAction = null,
  onPause,
  onResume,
  onCancel,
  candidates,
  candidateFilter,
  candidatePage,
  isCandidatesLoading = false,
  candidatesError = null,
  selectedCandidateIds = [],
  savingCandidateId = null,
  addingCandidateId = null,
  markingCandidateId = null,
  dismissingCandidateId = null,
  parsingCandidateId = null,
  bulkAction = null,
  onCandidateFilterChange,
  onCandidatePageChange,
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
}: RadarDiscoveryRunDetailDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="full">
      <div className="space-y-5">
        <RadarDiscoveryRunMonitor
          run={run}
          isLoading={isRunLoading}
          pendingAction={pendingAction}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
        <RadarDiscoveryCandidateReview
          candidates={candidates}
          filter={candidateFilter}
          page={candidatePage}
          isLoading={isCandidatesLoading}
          error={candidatesError}
          selectedCandidateIds={selectedCandidateIds}
          savingCandidateId={savingCandidateId}
          addingCandidateId={addingCandidateId}
          markingCandidateId={markingCandidateId}
          dismissingCandidateId={dismissingCandidateId}
          parsingCandidateId={parsingCandidateId}
          bulkAction={bulkAction}
          onFilterChange={onCandidateFilterChange}
          onPageChange={onCandidatePageChange}
          onToggleCandidateSelected={onToggleCandidateSelected}
          onSelectAllVisible={onSelectAllVisible}
          onClearSelection={onClearSelection}
          onBulkAddAsItem={onBulkAddAsItem}
          onBulkDismiss={onBulkDismiss}
          onBulkNotASource={onBulkNotASource}
          onSave={onSave}
          onAddAsItem={onAddAsItem}
          onMarkNotASource={onMarkNotASource}
          onDismiss={onDismiss}
          onParseSources={onParseSources}
        />
      </div>
    </Dialog>
  );
}
