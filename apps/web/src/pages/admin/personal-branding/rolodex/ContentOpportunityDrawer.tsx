import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, MessageSquarePlus, Search, Sparkles, X } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import Button from '@/components/atoms/Button';
import type {
  ContentOpportunity,
  ContentOpportunitySearchResult,
  CreatorConnection,
} from '@/types/api/personal-branding.dto';

interface ContentOpportunityDrawerProps {
  open: boolean;
  connection: CreatorConnection | null;
  isLoading?: boolean;
  result: ContentOpportunitySearchResult | null;
  onClose: () => void;
  onDraftReply: (opportunity: ContentOpportunity) => void;
  onLogCheckIn: (opportunity: ContentOpportunity) => void;
  onDismiss: (opportunity: ContentOpportunity) => void;
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

function formatAngle(angle?: string | null): string {
  if (!angle?.trim()) return 'Engagement';
  return angle
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ContentOpportunityDrawer({
  open,
  connection,
  isLoading = false,
  result,
  onClose,
  onDraftReply,
  onLogCheckIn,
  onDismiss,
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
                    <article className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                          {formatAngle(opportunity.socialCapitalAngle)}
                        </span>
                        {opportunity.recommendedAction ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Suggested: {opportunity.recommendedAction}
                          </span>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
                        {opportunity.postText}
                      </p>
                      {opportunity.rationale ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {opportunity.rationale}
                        </p>
                      ) : null}
                    </article>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run a search to find recent content worth engaging with.
                </p>
              )}
            </div>

            {opportunity ? (
              <footer className="flex flex-wrap gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
                {opportunity.postUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="inline-flex items-center gap-1.5"
                    onClick={() =>
                      window.open(opportunity.postUrl!, '_blank', 'noopener,noreferrer')
                    }
                  >
                    <ExternalLink className="size-4" />
                    Open on X
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="inline-flex items-center gap-1.5"
                  onClick={() => onDraftReply(opportunity)}
                >
                  <Sparkles className="size-4" />
                  Draft reply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="inline-flex items-center gap-1.5"
                  onClick={() => onLogCheckIn(opportunity)}
                >
                  <MessageSquarePlus className="size-4" />
                  Log check-in
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isDismissing}
                  onClick={() => onDismiss(opportunity)}
                >
                  {isDismissing ? 'Dismissing…' : 'Dismiss'}
                </Button>
              </footer>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
