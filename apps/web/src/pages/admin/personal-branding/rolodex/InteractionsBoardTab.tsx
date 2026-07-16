import { useMemo, useState } from 'react';
import { CalendarClock, MessageSquarePlus, Search, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import { useToast } from '@/hooks/use-toast';
import type { useRolodex } from '@/hooks/useRolodex';
import type {
  ContentOpportunity,
  ContentOpportunitySearchResult,
  CreatorConnection,
  ReplyGenerationDraft,
  ReplyRun,
  ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import { useRolodexReplyRuns } from '@/hooks/useRolodexReplyRuns';
import ConnectionContentSuggestions from './ConnectionContentSuggestions';
import ContentOpportunityDrawer from './ContentOpportunityDrawer';
import LogInteractionDialog from './LogInteractionDialog';
import ProfileLinkBadge from './ProfileLinkBadge';
import RelationshipPriorityBadge from './RelationshipPriorityBadge';
import RolodexPrompterDrawer from './RolodexPrompterDrawer';
import { followUpSortKey, hasXHandle } from './rolodex-platform';
import {
  PageCard,
  emptyStateCardClassName,
  gridItemCardClassName,
} from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';

type RolodexHook = ReturnType<typeof useRolodex>;

function formatLastInteracted(value?: string | null): string {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatFollowUp(value?: string | null): string {
  if (!value) return 'Not scheduled';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

interface InteractionsBoardTabProps {
  rolodex: RolodexHook;
  selectedProfileId?: string | null;
}

export default function InteractionsBoardTab({
  rolodex,
  selectedProfileId,
}: InteractionsBoardTabProps) {
  const { showToast, ToastContainer } = useToast();
  const connections = rolodex.connections.data?.data ?? [];
  const sorted = useMemo(
    () => [...connections].sort((a, b) => followUpSortKey(a) - followUpSortKey(b)),
    [connections]
  );

  const [checkInConnection, setCheckInConnection] = useState<CreatorConnection | null>(null);
  const [prompterConnection, setPrompterConnection] = useState<CreatorConnection | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const replyRuns = useRolodexReplyRuns(activeRunId);
  const activeRun: ReplyRun | null | undefined = replyRuns.query.data;
  const [pendingLog, setPendingLog] = useState<{
    connection: CreatorConnection;
    creatorText: string;
    vector: { id: string; label: string; angle: string; draftText: string; rationale: string };
    evidenceUrl?: string | null;
    platform?: string | null;
    platformPostId?: string | null;
    channel?: string | null;
  } | null>(null);
  const [contentSearchConnection, setContentSearchConnection] = useState<CreatorConnection | null>(
    null
  );
  const [contentSearchResult, setContentSearchResult] =
    useState<ContentOpportunitySearchResult | null>(null);
  const [pendingOpportunityAction, setPendingOpportunityAction] = useState<{
    id: string;
    type: 'complete' | 'dismiss';
  } | null>(null);
  const [dismissingOpportunity, setDismissingOpportunity] = useState<ContentOpportunity | null>(
    null
  );

  const opportunitiesByConnection = useMemo(() => {
    const items = rolodex.activeContentOpportunities.data?.data ?? [];
    const grouped = new Map<string, ContentOpportunity[]>();
    for (const opportunity of items) {
      const existing = grouped.get(opportunity.connectionId) ?? [];
      existing.push(opportunity);
      grouped.set(opportunity.connectionId, existing);
    }
    return grouped;
  }, [rolodex.activeContentOpportunities.data?.data]);

  const openCheckIn = (connection: CreatorConnection) => {
    setPrompterConnection(null);
    setActiveRunId(null);
    setContentSearchConnection(null);
    setContentSearchResult(null);
    setCheckInConnection(connection);
  };

  const openPrompter = (connection: CreatorConnection, creatorText = '') => {
    setCheckInConnection(null);
    setContentSearchConnection(null);
    setContentSearchResult(null);
    setPrompterConnection(connection);
    setActiveRunId(null);
    if (creatorText) {
      setPendingLog({
        connection,
        creatorText,
        vector: {
          id: 'content-opportunity',
          label: 'From search',
          angle: 'content-opportunity',
          draftText: '',
          rationale: '',
        },
      });
    } else {
      setPendingLog(null);
    }
  };

  const startReplyGeneration = async (
    connection: CreatorConnection,
    payload: {
      opportunityId?: string | null;
      creatorText: string;
      platform: import('@/types/api/personal-branding.dto').BrandPlatform;
      interactionIntent?: string;
    },
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => {
    try {
      const run = await replyRuns.startRun.mutateAsync({
        connectionId: connection.id,
        opportunityId: payload.opportunityId,
        platform: payload.platform,
        creatorText: payload.creatorText,
        profileId: selectedProfileId ?? undefined,
        interactionIntent: payload.interactionIntent,
        mode: draft.mode,
        researchEnabled: draft.researchEnabled,
        provider: resolved.provider,
        model: resolved.model,
        reasoningEffort: draft.reasoningEffort ?? undefined,
        suggestionCount: draft.suggestionCount,
        suggestedParamsJson: draft as unknown as Record<string, unknown>,
      });
      setActiveRunId(run.id);
      if (draft.mode === 'AGENT') {
        showToast({ type: 'info', title: 'Agent run started — drafting in background' });
      }
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Generation failed' });
    }
  };

  const handleAcceptSuggestion = async (
    connection: CreatorConnection,
    opportunity: ContentOpportunity | null,
    suggestion: ReplySuggestion,
    creatorText: string
  ) => {
    try {
      await replyRuns.updateSuggestion.mutateAsync({
        suggestionId: suggestion.id,
        body: { status: 'ACCEPTED' },
      });
      await navigator.clipboard.writeText(suggestion.draftText);
      showToast({ type: 'success', title: 'Draft copied — log your interaction' });
      setContentSearchConnection(null);
      setContentSearchResult(null);
      setPrompterConnection(null);
      setActiveRunId(null);
      setPendingLog({
        connection,
        creatorText,
        vector: suggestion,
        evidenceUrl: opportunity?.postUrl ?? null,
        platform: opportunity?.platform ?? 'x',
        platformPostId: opportunity?.platformPostId ?? null,
        channel: opportunity?.platform ?? 'x',
      });
      setCheckInConnection(connection);
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Accept failed' });
    }
  };

  const handleRejectSuggestion = async (
    suggestion: ReplySuggestion,
    feedbackText: string | null
  ) => {
    try {
      await replyRuns.updateSuggestion.mutateAsync({
        suggestionId: suggestion.id,
        body: { status: 'REJECTED', feedbackText },
      });
      showToast({ type: 'success', title: 'Feedback saved for future runs' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Reject failed' });
    }
  };

  const openContentSearch = async (connection: CreatorConnection) => {
    setCheckInConnection(null);
    setPrompterConnection(null);
    setActiveRunId(null);
    setPendingLog(null);
    setContentSearchConnection(connection);
    setContentSearchResult(null);
    try {
      const result = await rolodex.searchContentOpportunity.mutateAsync({
        connectionId: connection.id,
        body: { platform: 'x', profileId: selectedProfileId ?? undefined },
      });
      setContentSearchResult(result);
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Content search failed',
      });
      setContentSearchConnection(null);
    }
  };

  const handleDraftFromOpportunity = (
    connection: CreatorConnection,
    opportunity: ContentOpportunity
  ) => {
    setContentSearchConnection(connection);
    setContentSearchResult({
      outcome: 'found',
      platform: opportunity.platform,
      candidatesConsidered: 0,
      candidatesExcluded: 0,
      opportunity,
    });
    setActiveRunId(null);
  };

  const handleCheckInFromOpportunity = (
    connection: CreatorConnection,
    opportunity: ContentOpportunity
  ) => {
    setContentSearchConnection(null);
    setContentSearchResult(null);
    setPendingLog({
      connection,
      creatorText: opportunity.postText,
      vector: {
        id: 'content-opportunity',
        label: 'From search',
        angle: 'content-opportunity',
        draftText: '',
        rationale: '',
      },
      evidenceUrl: opportunity.postUrl ?? null,
      platform: opportunity.platform,
      platformPostId: opportunity.platformPostId,
      channel: 'x',
    });
    setCheckInConnection(connection);
  };

  const handleCompleteOpportunity = async (
    _connection: CreatorConnection,
    opportunity: ContentOpportunity
  ) => {
    setPendingOpportunityAction({ id: opportunity.id, type: 'complete' });
    try {
      await rolodex.updateContentOpportunity.mutateAsync({
        opportunityId: opportunity.id,
        status: 'ACTIONED',
      });
      showToast({ type: 'success', title: 'Suggestion marked complete' });
      setContentSearchConnection(null);
      setContentSearchResult(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Could not mark complete',
      });
    } finally {
      setPendingOpportunityAction(null);
    }
  };

  const requestDismissOpportunity = (opportunity: ContentOpportunity) => {
    setDismissingOpportunity(opportunity);
  };

  const submitDismissOpportunity = async (feedbackText: string | null) => {
    if (!dismissingOpportunity) return;
    setPendingOpportunityAction({ id: dismissingOpportunity.id, type: 'dismiss' });
    try {
      await rolodex.updateContentOpportunity.mutateAsync({
        opportunityId: dismissingOpportunity.id,
        status: 'DISMISSED',
        feedbackText,
      });
      showToast({ type: 'success', title: 'Suggestion dismissed' });
      setDismissingOpportunity(null);
      setContentSearchConnection(null);
      setContentSearchResult(null);
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Dismiss failed' });
    } finally {
      setPendingOpportunityAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        High-value connections sorted by next follow-up, then staleness. Check in with evidence,
        find recent X content to engage with, or open the prompter for Brand Identity-aware reply
        vectors.
      </p>

      {sorted.length === 0 ? (
        <PageCard className={cn(emptyStateCardClassName, 'p-8 text-sm text-gray-500 text-left')}>
          No connections yet — add targets in the Connection Directory tab.
        </PageCard>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((connection) => {
            const xEnabled = hasXHandle(connection);
            const isSearching =
              rolodex.searchContentOpportunity.isPending &&
              contentSearchConnection?.id === connection.id;
            const savedOpportunities = opportunitiesByConnection.get(connection.id) ?? [];
            const completingOpportunityId =
              pendingOpportunityAction?.type === 'complete' ? pendingOpportunityAction.id : null;
            const dismissingOpportunityId =
              pendingOpportunityAction?.type === 'dismiss' ? pendingOpportunityAction.id : null;
            return (
              <li
                key={connection.id}
                className={cn(
                  gridItemCardClassName,
                  'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{connection.name}</h3>
                    <RelationshipPriorityBadge connection={connection} />
                  </div>
                  <div className="mt-1">
                    <ProfileLinkBadge connection={connection} />
                  </div>
                  {connection.desiredOutcome?.trim() ? (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {connection.desiredOutcome}
                    </p>
                  ) : null}
                  {connection.nextAction?.trim() ? (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Next action: {connection.nextAction}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      Follow-up: {formatFollowUp(connection.nextFollowUpAt)}
                    </span>
                    <span>
                      Last interacted: {formatLastInteracted(connection.lastInteractedAt)}
                    </span>
                  </div>
                  <ConnectionContentSuggestions
                    opportunities={savedOpportunities}
                    onDraftReply={(opportunity) =>
                      handleDraftFromOpportunity(connection, opportunity)
                    }
                    onLogCheckIn={(opportunity) =>
                      handleCheckInFromOpportunity(connection, opportunity)
                    }
                    onComplete={(opportunity) => handleCompleteOpportunity(connection, opportunity)}
                    onRequestDismiss={requestDismissOpportunity}
                    completingOpportunityId={completingOpportunityId}
                    dismissingOpportunityId={dismissingOpportunityId}
                  />
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!xEnabled}
                    title={xEnabled ? undefined : 'Add an X handle in Connection Directory'}
                    onClick={() => void openContentSearch(connection)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Search className="size-4" />
                    {isSearching ? 'Searching…' : 'Find content'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openCheckIn(connection)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <MessageSquarePlus className="size-4" />
                    Check in
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openPrompter(connection)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="size-4" />
                    Prompter
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <LogInteractionDialog
        isOpen={Boolean(checkInConnection)}
        onClose={() => {
          setCheckInConnection(null);
          setPendingLog(null);
        }}
        connectionName={checkInConnection?.name ?? ''}
        followUpCadenceDays={checkInConnection?.followUpCadenceDays}
        isSubmitting={rolodex.logInteraction.isPending}
        initialCreatorText={pendingLog?.creatorText}
        initialResponseVectorId={
          pendingLog?.vector.id === 'content-opportunity' ? undefined : pendingLog?.vector.id
        }
        initialEvidenceUrl={pendingLog?.evidenceUrl}
        initialChannel={pendingLog?.channel}
        initialPlatform={pendingLog?.platform}
        initialPlatformPostId={pendingLog?.platformPostId}
        onSubmit={async (body) => {
          if (!checkInConnection) return;
          try {
            await rolodex.logInteraction.mutateAsync({ connectionId: checkInConnection.id, body });
            showToast({ type: 'success', title: 'Interaction logged' });
            setPendingLog(null);
          } catch (err) {
            showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
            throw err;
          }
        }}
      />

      <RolodexPrompterDrawer
        open={Boolean(prompterConnection)}
        connection={prompterConnection}
        profileId={selectedProfileId}
        activeRun={activeRun ?? null}
        isGenerating={replyRuns.startRun.isPending}
        isUpdatingSuggestion={replyRuns.updateSuggestion.isPending}
        initialCreatorText={pendingLog?.creatorText}
        onClose={() => {
          setPrompterConnection(null);
          setActiveRunId(null);
          setPendingLog(null);
        }}
        onGenerate={(payload, draft, resolved) => {
          if (!prompterConnection) return;
          void startReplyGeneration(prompterConnection, payload, draft, resolved);
        }}
        onAcceptSuggestion={(suggestion, creatorText) => {
          if (!prompterConnection) return;
          void handleAcceptSuggestion(prompterConnection, null, suggestion, creatorText);
        }}
        onRejectSuggestion={(suggestion, feedback) => {
          void handleRejectSuggestion(suggestion, feedback);
        }}
      />

      <ContentOpportunityDrawer
        open={Boolean(contentSearchConnection)}
        connection={contentSearchConnection}
        profileId={selectedProfileId}
        isLoading={rolodex.searchContentOpportunity.isPending}
        result={contentSearchResult}
        activeRun={activeRun ?? null}
        isGenerating={replyRuns.startRun.isPending}
        isUpdatingSuggestion={replyRuns.updateSuggestion.isPending}
        onClose={() => {
          setContentSearchConnection(null);
          setContentSearchResult(null);
          setActiveRunId(null);
        }}
        onGenerateReply={(opportunity, draft, resolved) => {
          if (!contentSearchConnection) return;
          void startReplyGeneration(
            contentSearchConnection,
            {
              opportunityId: opportunity.id,
              creatorText: opportunity.postText,
              platform:
                (opportunity.platform as import('@/types/api/personal-branding.dto').BrandPlatform) ??
                'x',
            },
            draft,
            resolved
          );
        }}
        onAcceptSuggestion={(opportunity, suggestion) => {
          if (!contentSearchConnection) return;
          void handleAcceptSuggestion(
            contentSearchConnection,
            opportunity,
            suggestion,
            opportunity.postText
          );
        }}
        onRejectSuggestion={(_opportunity, suggestion, feedback) => {
          void handleRejectSuggestion(suggestion, feedback);
        }}
        onLogCheckIn={(opportunity) => {
          if (!contentSearchConnection) return;
          handleCheckInFromOpportunity(contentSearchConnection, opportunity);
        }}
        onComplete={(opportunity) => {
          if (!contentSearchConnection) return;
          void handleCompleteOpportunity(contentSearchConnection, opportunity);
        }}
        onRequestDismiss={requestDismissOpportunity}
        isCompleting={
          pendingOpportunityAction?.type === 'complete' &&
          contentSearchResult?.opportunity?.id === pendingOpportunityAction.id
        }
        isDismissing={
          pendingOpportunityAction?.type === 'dismiss' &&
          contentSearchResult?.opportunity?.id === pendingOpportunityAction.id
        }
      />

      <RejectWithFeedbackModal
        isOpen={Boolean(dismissingOpportunity)}
        title="Dismiss suggestion"
        submitLabel="Dismiss"
        promptText="Tell the system why this post isn't worth engaging with so future 'Find content' runs can improve."
        isSubmitting={rolodex.updateContentOpportunity.isPending}
        onClose={() => setDismissingOpportunity(null)}
        onSubmit={(feedbackText) => {
          void submitDismissOpportunity(feedbackText);
        }}
      />

      <ToastContainer />
    </div>
  );
}
