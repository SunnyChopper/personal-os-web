import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, MessageSquarePlus, Search, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import ReplyRunMonitor from '@/components/molecules/personal-branding/ReplyRunMonitor';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import { Card, CardHeader, CardTitle } from '@/components/atoms/Card';
import { useToast } from '@/hooks/use-toast';
import type { useRolodex } from '@/hooks/useRolodex';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentOpportunity,
  ContentOpportunitySearchResult,
  CreatorConnection,
  ReplyGenerationDraft,
  ReplyRun,
  ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import {
  useActiveReplyRuns,
  useReplyRunTerminalNotifications,
  useRolodexReplyRuns,
} from '@/hooks/useRolodexReplyRuns';
import ConnectionContentSuggestions from './ConnectionContentSuggestions';
import {
  buildLateContentSearchResult,
  isContentSearchTransportError,
} from './content-opportunity-search-recovery';
import ContentOpportunityDrawer from './ContentOpportunityDrawer';
import DaysSinceLastTouchBadge from './DaysSinceLastTouchBadge';
import InteractionsBoardFilterBar from './InteractionsBoardFilterBar';
import LogInteractionDialog from './LogInteractionDialog';
import ProfileLinkBadge from './ProfileLinkBadge';
import RelationshipPriorityBadge from './RelationshipPriorityBadge';
import RolodexPrompterDrawer from './RolodexPrompterDrawer';
import {
  findOpportunityForReplyRun,
  restoreSearchResultFromReplyRun,
} from './restore-reply-run-context';
import {
  EMPTY_INTERACTIONS_BOARD_FILTERS,
  followUpSortKey,
  formatLastReconRelativeLabel,
  hasActiveInteractionsBoardFilters,
  hasXHandle,
  lastReconSortKey,
  matchesInteractionsBoardFilters,
  type InteractionsBoardFilters,
  type InteractionsBoardSortMode,
} from './rolodex-platform';
import {
  emptyStateCardClassName,
  gridItemCardClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { PageCard } from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';
import type {
  ReconPrompterPrefill,
  ReconPrompterSeed,
} from '@/lib/personal-branding/recon-prompter-seed';

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

const connectionActionButtonClassName =
  'inline-flex min-h-8 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100';

const connectionPrompterButtonClassName =
  'inline-flex min-h-8 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20';

interface InteractionsBoardTabProps {
  rolodex: RolodexHook;
  selectedProfileId?: string | null;
  profiles: { id: string; name: string }[];
  prompterSeed?: ReconPrompterSeed | null;
  onPrompterSeedConsumed?: () => void;
  onMarkReconPostActioned?: (reconPostId: string) => Promise<void>;
}

export default function InteractionsBoardTab({
  rolodex,
  selectedProfileId,
  profiles,
  prompterSeed = null,
  onPrompterSeedConsumed,
  onMarkReconPostActioned,
}: InteractionsBoardTabProps) {
  const { showToast, ToastContainer } = useToast();
  const connections = rolodex.connections.data?.data ?? [];
  const [filters, setFilters] = useState<InteractionsBoardFilters>(
    EMPTY_INTERACTIONS_BOARD_FILTERS
  );
  const [sortMode, setSortMode] = useState<InteractionsBoardSortMode>('followUp');
  const filtered = useMemo(
    () => connections.filter((connection) => matchesInteractionsBoardFilters(connection, filters)),
    [connections, filters]
  );
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortMode === 'lastRecon') {
      return list.sort((a, b) => lastReconSortKey(a) - lastReconSortKey(b));
    }
    return list.sort((a, b) => followUpSortKey(a) - followUpSortKey(b));
  }, [filtered, sortMode]);
  const connectionNameById = useMemo(
    () => new Map(connections.map((connection) => [connection.id, connection.name])),
    [connections]
  );
  const allOpportunities = rolodex.activeContentOpportunities.data?.data ?? [];

  const [checkInConnection, setCheckInConnection] = useState<CreatorConnection | null>(null);
  const [prompterConnection, setPrompterConnection] = useState<CreatorConnection | null>(null);
  const [prompterPrefill, setPrompterPrefill] = useState<ReconPrompterPrefill | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const replyRuns = useRolodexReplyRuns(activeRunId);
  const activeRun: ReplyRun | null | undefined = replyRuns.query.data;
  const { activeRuns } = useActiveReplyRuns();
  const [readyRun, setReadyRun] = useState<ReplyRun | null>(null);
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
  const [contentSearchError, setContentSearchError] = useState<string | null>(null);
  const [pendingOpportunityAction, setPendingOpportunityAction] = useState<{
    id: string;
    type: 'complete' | 'dismiss';
  } | null>(null);
  const [dismissingOpportunity, setDismissingOpportunity] = useState<ContentOpportunity | null>(
    null
  );

  const opportunitiesByConnection = useMemo(() => {
    const grouped = new Map<string, ContentOpportunity[]>();
    for (const opportunity of allOpportunities) {
      const existing = grouped.get(opportunity.connectionId) ?? [];
      existing.push(opportunity);
      grouped.set(opportunity.connectionId, existing);
    }
    return grouped;
  }, [allOpportunities]);

  const openReplyRunView = useCallback(
    (run: ReplyRun) => {
      const connection = connections.find((item) => item.id === run.connectionId);
      if (!connection) {
        showToast({
          type: 'error',
          title: 'Connection not found for this reply run',
        });
        return;
      }
      const opportunity = findOpportunityForReplyRun(run, allOpportunities);
      setCheckInConnection(null);
      setPrompterConnection(null);
      setPendingLog(null);
      setContentSearchConnection(connection);
      setContentSearchResult(restoreSearchResultFromReplyRun(run, opportunity));
      setActiveRunId(run.id);
      setReadyRun(null);
    },
    [allOpportunities, connections, showToast]
  );

  const handleReadyRun = useCallback(
    (run: ReplyRun) => {
      const connectionName = connectionNameById.get(run.connectionId) ?? 'Connection';
      setReadyRun(run);
      showToast({
        type: 'success',
        title: 'Reply drafts ready',
        message: `Open ${connectionName} to review suggestions.`,
        duration: 8000,
      });
    },
    [connectionNameById, showToast]
  );

  const handleFailedRun = useCallback(
    (run: ReplyRun) => {
      const connectionName = connectionNameById.get(run.connectionId) ?? 'Connection';
      showToast({
        type: 'error',
        title: 'Reply generation failed',
        message: run.error ?? `Could not draft replies for ${connectionName}.`,
        duration: 8000,
      });
    },
    [connectionNameById, showToast]
  );

  useReplyRunTerminalNotifications(activeRuns, {
    isDrawerOpen: Boolean(contentSearchConnection),
    onReady: handleReadyRun,
    onFailed: handleFailedRun,
  });

  const openCheckIn = (connection: CreatorConnection) => {
    setPrompterConnection(null);
    setActiveRunId(null);
    setContentSearchConnection(null);
    setContentSearchResult(null);
    setCheckInConnection(connection);
  };

  const openPrompter = useCallback(
    (connection: CreatorConnection, prefill?: ReconPrompterPrefill | null) => {
      setCheckInConnection(null);
      setContentSearchConnection(null);
      setContentSearchResult(null);
      setContentSearchError(null);
      setPrompterConnection(connection);
      setActiveRunId(null);
      setPrompterPrefill(prefill ?? null);
      if (prefill?.creatorText) {
        setPendingLog({
          connection,
          creatorText: prefill.creatorText,
          vector: {
            id: 'content-opportunity',
            label: 'From Recon Feed',
            angle: 'recon-feed',
            draftText: '',
            rationale: '',
          },
          evidenceUrl: prefill.evidenceUrl ?? null,
          platform: 'x',
          platformPostId: prefill.platformPostId ?? null,
          channel: 'x',
        });
      } else {
        setPendingLog(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!prompterSeed) return;
    const connection = connections.find((item) => item.id === prompterSeed.connectionId);
    if (!connection) {
      showToast({
        type: 'error',
        title: 'Connection not found for this Recon post',
      });
      onPrompterSeedConsumed?.();
      return;
    }
    const { connectionId: _connectionId, ...prefill } = prompterSeed;
    openPrompter(connection, prefill);
    onPrompterSeedConsumed?.();
  }, [connections, onPrompterSeedConsumed, openPrompter, prompterSeed, showToast]);

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
  ): Promise<ReplyRun> => {
    try {
      const run = await replyRuns.startRun.mutateAsync({
        connectionId: connection.id,
        opportunityId: payload.opportunityId,
        platform: payload.platform,
        creatorText: payload.creatorText,
        profileId: draft.profileId || undefined,
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
      setReadyRun(null);
      if (draft.mode === 'AGENT') {
        showToast({ type: 'info', title: 'Agent run started — drafting in background' });
      }
      return run;
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Generation failed' });
      throw err;
    }
  };

  const handleAcceptSuggestion = async (
    connection: CreatorConnection,
    opportunity: ContentOpportunity | null,
    suggestion: ReplySuggestion,
    creatorText: string,
    reconMeta?: Pick<ReconPrompterPrefill, 'evidenceUrl' | 'platformPostId' | 'reconPostId'> | null
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
      setPrompterPrefill(null);
      setActiveRunId(null);
      setReadyRun(null);
      setPendingLog({
        connection,
        creatorText,
        vector: suggestion,
        evidenceUrl: opportunity?.postUrl ?? reconMeta?.evidenceUrl ?? null,
        platform: opportunity?.platform ?? 'x',
        platformPostId: opportunity?.platformPostId ?? reconMeta?.platformPostId ?? null,
        channel: opportunity?.platform ?? 'x',
      });
      setCheckInConnection(connection);
      if (reconMeta?.reconPostId && onMarkReconPostActioned) {
        try {
          await onMarkReconPostActioned(reconMeta.reconPostId);
        } catch (err) {
          showToast({
            type: 'error',
            title: err instanceof Error ? err.message : 'Could not mark Recon post as actioned',
          });
        }
      }
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
    setReadyRun(null);
    setPendingLog(null);
    setContentSearchConnection(connection);
    setContentSearchResult(null);
    setContentSearchError(null);
    try {
      const result = await rolodex.searchContentOpportunity.mutateAsync({
        connectionId: connection.id,
        body: { platform: 'x', profileId: selectedProfileId ?? undefined },
      });
      setContentSearchResult(result);
      setContentSearchError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Content search failed';
      if (isContentSearchTransportError(err)) {
        try {
          const listRes = await personalBrandingService.listConnectionContentOpportunities(
            connection.id,
            1,
            20,
            'SUGGESTED'
          );
          const lateResult = buildLateContentSearchResult('x', listRes.data?.data ?? []);
          if (lateResult) {
            setContentSearchResult(lateResult);
            setContentSearchError(null);
            void rolodex.activeContentOpportunities.refetch();
            return;
          }
        } catch {
          // Fall through to in-panel error state.
        }
      }
      setContentSearchError(message);
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
      opportunities: [opportunity],
    });
    setActiveRunId(null);
    setReadyRun(null);
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
        High-value connections sorted by follow-up or last recon freshness. Use filters to focus by
        priority, follow-up status, or stale recon data. Check in with evidence, find recent X
        content to engage with, or open the prompter for Brand Identity-aware reply vectors.
      </p>

      {connections.length > 0 ? (
        <InteractionsBoardFilterBar
          connections={connections}
          filters={filters}
          onFiltersChange={setFilters}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
        />
      ) : null}

      <ReplyRunMonitor
        runs={activeRuns}
        connectionNameById={connectionNameById}
        onView={openReplyRunView}
      />

      {readyRun ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Reply drafts ready</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {connectionNameById.get(readyRun.connectionId) ?? 'Connection'} — review generated
                suggestions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => openReplyRunView(readyRun)}>
                View
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setReadyRun(null)}>
                Dismiss
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {connections.length === 0 ? (
        <PageCard className={cn(emptyStateCardClassName, 'p-8 text-sm text-gray-500 text-left')}>
          No connections yet — add targets in the Connection Directory tab.
        </PageCard>
      ) : sorted.length === 0 ? (
        <PageCard className={cn(emptyStateCardClassName, 'p-8 text-sm text-gray-500 text-left')}>
          <p>No connections match these filters.</p>
          {hasActiveInteractionsBoardFilters(filters) ? (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_INTERACTIONS_BOARD_FILTERS)}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear filters
            </button>
          ) : null}
        </PageCard>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((connection) => {
            const xEnabled = hasXHandle(connection);
            const reconLabel = formatLastReconRelativeLabel(connection.lastReconPostedAt);
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
                className={cn(gridItemCardClassName, 'flex flex-col gap-3 p-4')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{connection.name}</h3>
                    <RelationshipPriorityBadge connection={connection} />
                  </div>
                  <div
                    className="flex shrink-0 flex-wrap items-center justify-end gap-0.5"
                    role="toolbar"
                    aria-label={`Actions for ${connection.name}`}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!xEnabled}
                      title={xEnabled ? undefined : 'Add an X handle in Connection Directory'}
                      aria-label={
                        isSearching
                          ? `Searching content for ${connection.name}`
                          : `Find content for ${connection.name}`
                      }
                      onClick={() => void openContentSearch(connection)}
                      className={connectionActionButtonClassName}
                    >
                      <Search className="size-3.5 shrink-0" />
                      {isSearching ? 'Searching…' : 'Find content'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Check in with ${connection.name}`}
                      onClick={() => openCheckIn(connection)}
                      className={connectionActionButtonClassName}
                    >
                      <MessageSquarePlus className="size-3.5 shrink-0" />
                      Check in
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Open prompter for ${connection.name}`}
                      onClick={() => openPrompter(connection)}
                      className={connectionPrompterButtonClassName}
                    >
                      <Sparkles className="size-3.5 shrink-0" />
                      Prompter
                    </Button>
                  </div>
                </div>
                <div className="min-w-0">
                  <ProfileLinkBadge connection={connection} />
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
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      Follow-up: {formatFollowUp(connection.nextFollowUpAt)}
                    </span>
                    <span>
                      Last interacted: {formatLastInteracted(connection.lastInteractedAt)}
                    </span>
                    <span title={reconLabel.title}>{reconLabel.label}</span>
                    <DaysSinceLastTouchBadge connection={connection} />
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
        profiles={profiles}
        defaultProfileId={selectedProfileId}
        activeRun={activeRun ?? null}
        isGenerating={replyRuns.startRun.isPending}
        isUpdatingSuggestion={replyRuns.updateSuggestion.isPending}
        initialCreatorText={prompterPrefill?.creatorText ?? pendingLog?.creatorText}
        initialInteractionIntent={prompterPrefill?.interactionIntent}
        initialAuthorHandle={prompterPrefill?.authorHandle}
        onClose={() => {
          setPrompterConnection(null);
          setPrompterPrefill(null);
          setActiveRunId(null);
          setPendingLog(null);
        }}
        onGenerate={(payload, draft, resolved) => {
          if (!prompterConnection) return;
          void startReplyGeneration(prompterConnection, payload, draft, resolved);
        }}
        onAcceptSuggestion={(suggestion, creatorText) => {
          if (!prompterConnection) return;
          void handleAcceptSuggestion(
            prompterConnection,
            null,
            suggestion,
            creatorText,
            prompterPrefill
          );
        }}
        onRejectSuggestion={(suggestion, feedback) => {
          void handleRejectSuggestion(suggestion, feedback);
        }}
      />

      <ContentOpportunityDrawer
        open={Boolean(contentSearchConnection)}
        connection={contentSearchConnection}
        profiles={profiles}
        defaultProfileId={selectedProfileId}
        isLoading={rolodex.searchContentOpportunity.isPending}
        searchError={contentSearchError}
        result={contentSearchResult}
        restoredReplyRun={activeRun ?? readyRun ?? null}
        isUpdatingSuggestion={replyRuns.updateSuggestion.isPending}
        onRetry={() => {
          if (!contentSearchConnection) return;
          void openContentSearch(contentSearchConnection);
        }}
        onClose={() => {
          setContentSearchConnection(null);
          setContentSearchResult(null);
          setContentSearchError(null);
          setActiveRunId(null);
          setReadyRun(null);
        }}
        onGenerateReply={(opportunity, draft, resolved) => {
          if (!contentSearchConnection) {
            return Promise.reject(new Error('Connection not found'));
          }
          return startReplyGeneration(
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
        completingOpportunityId={
          pendingOpportunityAction?.type === 'complete' ? pendingOpportunityAction.id : null
        }
        dismissingOpportunityId={
          pendingOpportunityAction?.type === 'dismiss' ? pendingOpportunityAction.id : null
        }
      />

      <RejectWithFeedbackModal
        isOpen={Boolean(dismissingOpportunity)}
        title="Dismiss content suggestion"
        promptText="Tell the system why this post isn't worth engaging with so future 'Find content' runs can improve."
        submitLabel="Dismiss"
        isSubmitting={
          pendingOpportunityAction?.type === 'dismiss' &&
          pendingOpportunityAction.id === dismissingOpportunity?.id
        }
        onClose={() => setDismissingOpportunity(null)}
        onSubmit={submitDismissOpportunity}
      />

      <ToastContainer />
    </div>
  );
}
