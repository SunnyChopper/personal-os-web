import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import Button from '@/components/atoms/Button';
import ReplyGenerationPanel from '@/components/molecules/personal-branding/ReplyGenerationPanel';
import ReplySuggestionsList from '@/components/molecules/personal-branding/ReplySuggestionsList';
import type {
  ContentOpportunity,
  ContentOpportunitySearchResult,
  CreatorConnection,
  ReplyGenerationDraft,
  ReplyRun,
  ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import SuggestedContentCard from './SuggestedContentCard';

interface ContentOpportunityDrawerProps {
  open: boolean;
  connection: CreatorConnection | null;
  profileId?: string | null;
  isLoading?: boolean;
  result: ContentOpportunitySearchResult | null;
  activeRun?: ReplyRun | null;
  isGenerating?: boolean;
  isUpdatingSuggestion?: boolean;
  onClose: () => void;
  onGenerateReply: (
    opportunity: ContentOpportunity,
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => void;
  onAcceptSuggestion: (opportunity: ContentOpportunity, suggestion: ReplySuggestion) => void;
  onRejectSuggestion: (
    opportunity: ContentOpportunity,
    suggestion: ReplySuggestion,
    feedbackText: string | null
  ) => void;
  onLogCheckIn: (opportunity: ContentOpportunity) => void;
  onComplete: (opportunity: ContentOpportunity) => void;
  onRequestDismiss: (opportunity: ContentOpportunity) => void;
  isCompleting?: boolean;
  isDismissing?: boolean;
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
    case 'missingApiKey':
      return 'RapidAPI key required';
    case 'missingHandle':
      return 'X handle required';
    case 'unsupportedPlatform':
      return 'Platform not supported';
    default:
      return 'Search result';
  }
}

export default function ContentOpportunityDrawer({
  open,
  connection,
  profileId: _profileId,
  isLoading = false,
  result,
  activeRun,
  isGenerating = false,
  isUpdatingSuggestion = false,
  onClose,
  onGenerateReply,
  onAcceptSuggestion,
  onRejectSuggestion,
  onLogCheckIn,
  onComplete,
  onRequestDismiss,
  isCompleting = false,
  isDismissing = false,
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

  const opportunity = result?.opportunity ?? null;
  const suggestions = activeRun?.suggestions ?? [];
  const showRunProgress =
    isGenerating || activeRun?.status === 'QUEUED' || activeRun?.status === 'RUNNING';

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close content search drawer"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-labelledby="content-opportunity-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
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
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Considered {result.candidatesConsidered} posts · excluded{' '}
                      {result.candidatesExcluded} already engaged
                    </p>
                  </div>

                  {opportunity ? (
                    <>
                      <SuggestedContentCard
                        opportunity={opportunity}
                        onDraftReply={() => undefined}
                        onLogCheckIn={onLogCheckIn}
                        onComplete={onComplete}
                        onRequestDismiss={onRequestDismiss}
                        isCompleting={isCompleting}
                        isDismissing={isDismissing}
                        hideDraftReply
                      />

                      <ReplyGenerationPanel
                        suggestedParams={opportunity.suggestedReplyParams}
                        disabled={showRunProgress}
                        isGenerating={showRunProgress}
                        onGenerate={(draft, resolved) =>
                          onGenerateReply(opportunity, draft, resolved)
                        }
                      />

                      {showRunProgress && !suggestions.length ? (
                        <div className="flex justify-center py-6">
                          <AIThinkingIndicator message="Drafting replies…" size="lg" />
                        </div>
                      ) : null}

                      {activeRun?.status === 'FAILED' && activeRun.error ? (
                        <p className="text-sm text-red-600 dark:text-red-400">{activeRun.error}</p>
                      ) : null}

                      <ReplySuggestionsList
                        suggestions={suggestions}
                        isUpdating={isUpdatingSuggestion}
                        onAccept={(s) => onAcceptSuggestion(opportunity, s)}
                        onReject={(s, feedback) => onRejectSuggestion(opportunity, s, feedback)}
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run a search to find recent content worth engaging with.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
