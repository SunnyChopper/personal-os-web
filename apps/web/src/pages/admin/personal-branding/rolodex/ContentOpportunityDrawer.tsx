import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import Button from '@/components/atoms/Button';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { cn } from '@/lib/utils';
import type {
  ContentOpportunity,
  ContentOpportunitySearchResult,
  CreatorConnection,
  ReplyGenerationDraft,
  ReplyRun,
  ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import ContentOpportunityCandidateCard from './ContentOpportunityCandidateCard';
import { contentSearchOutcomeNeedsRetry } from './content-opportunity-search-recovery';

interface ContentOpportunityDrawerProps {
  open: boolean;
  connection: CreatorConnection | null;
  profiles: { id: string; name: string }[];
  defaultProfileId?: string | null;
  isLoading?: boolean;
  searchError?: string | null;
  result: ContentOpportunitySearchResult | null;
  isUpdatingSuggestion?: boolean;
  onClose: () => void;
  onRetry: () => void;
  onGenerateReply: (
    opportunity: ContentOpportunity,
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => Promise<ReplyRun>;
  onAcceptSuggestion: (opportunity: ContentOpportunity, suggestion: ReplySuggestion) => void;
  onRejectSuggestion: (
    opportunity: ContentOpportunity,
    suggestion: ReplySuggestion,
    feedbackText: string | null
  ) => void;
  onLogCheckIn: (opportunity: ContentOpportunity) => void;
  onComplete: (opportunity: ContentOpportunity) => void;
  onRequestDismiss: (opportunity: ContentOpportunity) => void;
  completingOpportunityId?: string | null;
  dismissingOpportunityId?: string | null;
  restoredReplyRun?: ReplyRun | null;
}

function outcomeTitle(outcome: ContentOpportunitySearchResult['outcome']): string {
  switch (outcome) {
    case 'found':
      return 'Content to engage with';
    case 'inactive':
      return 'Connection appears inactive';
    case 'exhausted':
      return 'Nothing new to engage';
    case 'noWorthy':
      return 'No strong match right now';
    case 'tooOld':
      return 'Recent posts are too old to engage with';
    case 'missingApiKey':
      return 'RapidAPI key required';
    case 'missingHandle':
      return 'X handle required';
    case 'unsupportedPlatform':
      return 'Platform not supported';
    case 'fetchFailed':
      return 'Could not fetch recent posts';
    case 'rankingFailed':
      return 'Could not rank posts';
    default:
      return 'Search result';
  }
}

export default function ContentOpportunityDrawer({
  open,
  connection,
  profiles,
  defaultProfileId,
  isLoading = false,
  searchError = null,
  result,
  isUpdatingSuggestion = false,
  onClose,
  onRetry,
  onGenerateReply,
  onAcceptSuggestion,
  onRejectSuggestion,
  onLogCheckIn,
  onComplete,
  onRequestDismiss,
  completingOpportunityId = null,
  dismissingOpportunityId = null,
  restoredReplyRun = null,
}: ContentOpportunityDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!connection) return null;

  const opportunities = result?.opportunities ?? [];
  const showRetry = Boolean(searchError) || contentSearchOutcomeNeedsRetry(result?.outcome ?? null);

  return (
    <AnimatePresence>
      {open ? (
        <OverlayPortal>
          <motion.button
            type="button"
            aria-label="Close content search drawer"
            className={cn('fixed inset-0 bg-black/40', overlayBackdropClassName)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-labelledby="content-opportunity-title"
            className={cn(
              'fixed inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900',
              overlaySurfaceClassName
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Find content
                </p>
                <h2
                  id="content-opportunity-title"
                  className="mt-1 text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {connection.name}
                </h2>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0"
              >
                <X className="size-4" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <AIThinkingIndicator />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Searching recent X posts and ranking engagement opportunities…
                  </p>
                </div>
              ) : searchError ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Search could not complete
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{searchError}</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                    <RefreshCw className="mr-1.5 size-4" />
                    Retry
                  </Button>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <Search className="size-4 text-blue-600 dark:text-blue-400" />
                      {outcomeTitle(result.outcome)}
                    </div>
                    {result.reason ? (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {result.reason}
                      </p>
                    ) : null}
                    {result.outcome === 'found' ? (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Considered {result.candidatesConsidered} posts · excluded{' '}
                        {result.candidatesExcluded} already engaged
                      </p>
                    ) : null}
                    {showRetry ? (
                      <div className="mt-4">
                        <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                          <RefreshCw className="mr-1.5 size-4" />
                          Retry
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {opportunities.length > 0 ? (
                    <div className="space-y-6">
                      {opportunities.map((opportunity) => (
                        <ContentOpportunityCandidateCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          profiles={profiles}
                          defaultProfileId={defaultProfileId}
                          initialRunId={
                            restoredReplyRun?.opportunityId === opportunity.id
                              ? restoredReplyRun.id
                              : null
                          }
                          isUpdatingSuggestion={isUpdatingSuggestion}
                          isCompleting={completingOpportunityId === opportunity.id}
                          isDismissing={dismissingOpportunityId === opportunity.id}
                          onGenerateReply={onGenerateReply}
                          onAcceptSuggestion={onAcceptSuggestion}
                          onRejectSuggestion={onRejectSuggestion}
                          onLogCheckIn={onLogCheckIn}
                          onComplete={onComplete}
                          onRequestDismiss={onRequestDismiss}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run a search to find recent content worth engaging with.
                </p>
              )}
            </div>
          </motion.aside>
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
}
