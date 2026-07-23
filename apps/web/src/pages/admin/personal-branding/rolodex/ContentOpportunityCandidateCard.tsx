import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import ReplyGenerationPanel from '@/components/molecules/personal-branding/ReplyGenerationPanel';
import ReplySuggestionsList from '@/components/molecules/personal-branding/ReplySuggestionsList';
import { useRolodexReplyRuns } from '@/hooks/useRolodexReplyRuns';
import type {
  ContentOpportunity,
  ReplyGenerationDraft,
  ReplyRun,
  ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import SuggestedContentCard from './SuggestedContentCard';

interface ContentOpportunityCandidateCardProps {
  opportunity: ContentOpportunity;
  profiles: { id: string; name: string }[];
  defaultProfileId?: string | null;
  initialRunId?: string | null;
  isUpdatingSuggestion?: boolean;
  isCompleting?: boolean;
  isDismissing?: boolean;
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
}

export default function ContentOpportunityCandidateCard({
  opportunity,
  profiles,
  defaultProfileId,
  initialRunId = null,
  isUpdatingSuggestion = false,
  isCompleting = false,
  isDismissing = false,
  onGenerateReply,
  onAcceptSuggestion,
  onRejectSuggestion,
  onLogCheckIn,
  onComplete,
  onRequestDismiss,
}: ContentOpportunityCandidateCardProps) {
  const [replyOpen, setReplyOpen] = useState(Boolean(initialRunId));
  const [runId, setRunId] = useState<string | null>(initialRunId);

  useEffect(() => {
    if (initialRunId) {
      setRunId(initialRunId);
      setReplyOpen(true);
    }
  }, [initialRunId]);
  const replyRuns = useRolodexReplyRuns(runId);
  const activeRun = replyRuns.query.data ?? null;
  const suggestions = activeRun?.suggestions ?? [];
  const showRunProgress =
    replyRuns.startRun.isPending ||
    activeRun?.status === 'QUEUED' ||
    activeRun?.status === 'RUNNING';

  const handleGenerate = async (
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => {
    const run = await onGenerateReply(opportunity, draft, resolved);
    setRunId(run.id);
    setReplyOpen(true);
  };

  return (
    <div className="space-y-3">
      <SuggestedContentCard
        opportunity={opportunity}
        onDraftReply={() => setReplyOpen((prev) => !prev)}
        onLogCheckIn={onLogCheckIn}
        onComplete={onComplete}
        onRequestDismiss={onRequestDismiss}
        isCompleting={isCompleting}
        isDismissing={isDismissing}
        hideDraftReply
      />

      <div className="rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setReplyOpen((prev) => !prev)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800/60"
          aria-expanded={replyOpen}
        >
          {replyOpen ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden />
          ) : (
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          )}
          <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Generate reply</span>
          {showRunProgress ? (
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              Drafting…
            </span>
          ) : null}
        </button>

        {replyOpen ? (
          <div className="space-y-4 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
            <ReplyGenerationPanel
              profiles={profiles}
              defaultProfileId={defaultProfileId}
              suggestedParams={opportunity.suggestedReplyParams}
              disabled={showRunProgress}
              isGenerating={showRunProgress}
              onGenerate={(draft, resolved) => {
                void handleGenerate(draft, resolved);
              }}
            />

            {showRunProgress && !suggestions.length ? (
              <div className="flex justify-center py-4">
                <AIThinkingIndicator message="Drafting replies…" size="lg" />
              </div>
            ) : null}

            {activeRun?.status === 'FAILED' && activeRun.error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{activeRun.error}</p>
            ) : null}

            <ReplySuggestionsList
              suggestions={suggestions}
              isUpdating={isUpdatingSuggestion}
              onAccept={(suggestion) => onAcceptSuggestion(opportunity, suggestion)}
              onReject={(suggestion, feedback) =>
                onRejectSuggestion(opportunity, suggestion, feedback)
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
