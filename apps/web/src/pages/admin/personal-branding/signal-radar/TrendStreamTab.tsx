import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import TrendStreamFilterBar, {
  type TrendStreamFilterState,
} from '@/components/organisms/personal-branding/TrendStreamFilterBar';
import TrendStreamBrainstormModal, {
  type TrendStreamBrainstormRequest,
} from '@/components/organisms/personal-branding/TrendStreamBrainstormModal';
import MarkIrrelevantReasonModal from '@/components/molecules/personal-branding/MarkIrrelevantReasonModal';
import RadarLearningSignalBanner from '@/components/molecules/personal-branding/RadarLearningSignalBanner';
import RadarItemRelevanceModal from '@/components/molecules/personal-branding/RadarItemRelevanceModal';
import RadarItemSourceAvatar from '@/components/molecules/personal-branding/RadarItemSourceAvatar';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import { linkAccentClassName } from '../personal-branding-ui';
import { useToast } from '@/hooks/use-toast';
import { useContentIdeationJob } from '@/hooks/useContentIdeationJob';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { ROUTES } from '@/routes';
import {
  useSignalRadarItems,
  useSignalRadarRunDetail,
  useSignalRadarRuns,
  useSignalRadarViews,
  type useSignalRadar,
} from '@/hooks/useSignalRadar';
import {
  RADAR_ITEM_TYPE_LABELS,
  type RadarItem,
  type RadarUserIrrelevanceReason,
} from '@/types/api/personal-branding.dto';
import { isBrandProfileReadyForIdeation } from '../content-workbench/content-workbench-helpers';
import RunDetailDrawer from './RunDetailDrawer';
import {
  getTrendStreamDismissPhase,
  isTrendStreamCardDismissing,
  mergeTrendStreamDisplayItems,
  TREND_STREAM_IRRELEVANT_EXIT_MS,
  TREND_STREAM_IRRELEVANT_UNDO_MS,
  type TrendStreamDismissMap,
} from './trend-stream-dismiss-queue';
import {
  buildBulkIrrelevantToastMessages,
  partitionBulkIrrelevantResults,
} from './trend-stream-bulk-irrelevant';
import {
  emptyStateCardClassName,
  gridItemCardClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { PageCard } from '../PersonalBrandingPageTemplate';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function capitalizeLabel(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSourcesSuccessPercent(succeeded: number, total: number): string {
  if (total <= 0) return '—';
  return `${Math.round((succeeded / total) * 100)}%`;
}

function formatCreatedDiscoveredRatio(created?: number, discovered?: number): string {
  return `${created ?? 0} / ${discovered ?? 0}`;
}

function RunStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'completed'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      : status === 'failed'
        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
        : status === 'running' || status === 'queued'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', tone)}>
      {status}
    </span>
  );
}

function FilteredBadge({ item }: { item: RadarItem }) {
  if (item.userRelevant === false) {
    return (
      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
        Irrelevant
      </span>
    );
  }
  if (item.aiRelevant === false) {
    return (
      <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        AI filtered
      </span>
    );
  }
  return null;
}

const MAX_RADAR_SELECTION = 10;

function formatAbsoluteDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatRelevanceLabel(score?: number | null): string {
  if (typeof score !== 'number') return 'No score';
  return `${Math.round(score * 100)}% relevant`;
}

function RadarItemCard({
  item,
  includeFiltered,
  selected,
  selectionDisabled,
  dismissPhase,
  onToggleSelected,
  onOpenRelevance,
  onMarkRelevant,
  onMarkIrrelevant,
  onUndoDismiss,
  isUpdatingThis,
}: {
  item: RadarItem;
  includeFiltered: boolean;
  selected: boolean;
  selectionDisabled: boolean;
  dismissPhase: 'pending' | 'exiting' | null;
  onToggleSelected: () => void;
  onOpenRelevance: () => void;
  onMarkRelevant: () => void;
  onMarkIrrelevant: () => void;
  onUndoDismiss: () => void;
  isUpdatingThis: boolean;
}) {
  const link = item.url ?? item.repositoryUrl;
  const isDismissing = dismissPhase !== null;
  const showIrrelevantBadge = dismissPhase === 'pending' || item.userRelevant === false;
  const showFilteredContext =
    includeFiltered && (item.userRelevant === false || item.aiRelevant === false);
  const timestamp = item.publishedAt ?? item.createdAt;
  const relativeTimestamp = timestamp ? formatRelativeChatTimestamp(timestamp) : null;
  const absoluteTimestamp = formatAbsoluteDate(timestamp);

  return (
    <article
      className={cn(
        gridItemCardClassName,
        'flex flex-col transition-opacity',
        selected && 'ring-2 ring-sky-500/70 dark:ring-sky-400/60',
        dismissPhase === 'pending' && 'opacity-75',
        dismissPhase === 'exiting' && 'pointer-events-none'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <FormCheckbox
            checked={selected}
            onChange={onToggleSelected}
            disabled={selectionDisabled || isDismissing}
            aria-label={`Select ${item.title}`}
            className="mt-0.5"
          />
          <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
            {RADAR_ITEM_TYPE_LABELS[item.itemType]}
          </span>
          {showIrrelevantBadge ? (
            <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
              Irrelevant
            </span>
          ) : null}
          {showFilteredContext && item.aiRelevant === false ? <FilteredBadge item={item} /> : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <RadarItemSourceAvatar
          url={item.url}
          repositoryUrl={item.repositoryUrl}
          sourceName={item.sourceName}
        />
        {item.sourceName ? (
          <span className="font-medium text-gray-700 dark:text-gray-300">{item.sourceName}</span>
        ) : null}
        {relativeTimestamp ? (
          <>
            {item.sourceName ? <span aria-hidden>·</span> : null}
            <time dateTime={timestamp ?? undefined} title={absoluteTimestamp}>
              {relativeTimestamp}
            </time>
          </>
        ) : null}
      </div>

      {item.summary ? (
        <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
          {item.summary}
        </p>
      ) : null}
      {showFilteredContext && item.aiRationale ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.aiRationale}</p>
      ) : null}

      <button
        type="button"
        onClick={onOpenRelevance}
        aria-haspopup="dialog"
        className="mt-3 inline-flex w-fit items-center rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-900 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/40"
        title={item.aiRationale ?? 'View relevance breakdown'}
      >
        {formatRelevanceLabel(item.aiRelevanceScore)}
      </button>

      {item.matchedPillars.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.matchedPillars.map((pillar) => (
            <span key={pillar} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
              {pillar}
            </span>
          ))}
        </div>
      ) : null}

      {item.topicTags && item.topicTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.topicTags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium',
              linkAccentClassName
            )}
          >
            Open
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
        {dismissPhase === 'pending' ? (
          <Button type="button" size="sm" disabled={isUpdatingThis} onClick={onUndoDismiss}>
            Undo
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isUpdatingThis || dismissPhase === 'exiting'}
            onClick={item.userRelevant === false ? onMarkRelevant : onMarkIrrelevant}
          >
            {item.userRelevant === false ? 'Mark as Relevant' : 'Mark as Irrelevant'}
          </Button>
        )}
      </div>
    </article>
  );
}

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

interface TrendStreamTabProps {
  signalRadar: SignalRadarHook;
  onOpenSettings?: () => void;
}

export default function TrendStreamTab({ signalRadar, onOpenSettings }: TrendStreamTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const { showToast, ToastContainer } = useToast();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [itemPage] = useState(1);
  const [itemFilters, setItemFilters] = useState<TrendStreamFilterState>({
    page: 1,
    pageSize: 50,
    includeFiltered: false,
  });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [brainstormOpen, setBrainstormOpen] = useState(false);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [brainstormJobId, setBrainstormJobId] = useState<string | null>(null);
  const [relevanceModalItemId, setRelevanceModalItemId] = useState<string | null>(null);
  const [irrelevantModalItemIds, setIrrelevantModalItemIds] = useState<string[]>([]);
  const [bulkIrrelevantPending, setBulkIrrelevantPending] = useState(false);
  const [bulkUpdatingIds, setBulkUpdatingIds] = useState<Set<string>>(() => new Set());
  const [dismissingById, setDismissingById] = useState<TrendStreamDismissMap>({});
  const dismissTimersRef = useRef<Record<string, number>>({});
  const exitTimersRef = useRef<Record<string, number>>({});

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 50),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 50);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  const brandProfiles = profilesQ.data?.data ?? [];
  const defaultProfileId = useMemo(() => {
    const ready = brandProfiles.find((profile) => isBrandProfileReadyForIdeation(profile));
    return ready?.id ?? brandProfiles[0]?.id ?? null;
  }, [brandProfiles]);

  const { runs, startSync } = useSignalRadarRuns({ page: 1, pageSize: 10 });
  const { items, updateItemRelevance, explainItemRelevance } = useSignalRadarItems({
    ...itemFilters,
    page: itemPage,
  });
  const { views, createView, deleteView } = useSignalRadarViews();
  const radarSources = signalRadar.sources.data?.data ?? [];
  const savedViews = views.data?.data ?? [];

  const feedbackStatsQ = useQuery({
    queryKey: queryKeys.personalBranding.radarFeedbackStats(),
    queryFn: () => personalBrandingService.getRadarFeedbackStats(),
  });
  const feedbackStats = feedbackStatsQ.data;

  const runRows = runs.data?.data ?? [];

  const activeDetail = useSignalRadarRunDetail(selectedRunId);
  const runDetail = activeDetail.detail.data;
  const streamItems = items.data?.data ?? [];
  const includeFiltered = itemFilters.includeFiltered ?? false;
  const displayItems = useMemo(
    () => mergeTrendStreamDisplayItems(streamItems, dismissingById),
    [streamItems, dismissingById]
  );

  const clearDismissTimer = useCallback((itemId: string) => {
    const timerId = dismissTimersRef.current[itemId];
    if (timerId != null) {
      window.clearTimeout(timerId);
      delete dismissTimersRef.current[itemId];
    }
    const exitTimerId = exitTimersRef.current[itemId];
    if (exitTimerId != null) {
      window.clearTimeout(exitTimerId);
      delete exitTimersRef.current[itemId];
    }
  }, []);

  const commitDismiss = useCallback(
    (itemId: string) => {
      clearDismissTimer(itemId);
      setDismissingById((current) => {
        if (!(itemId in current)) return current;
        const next = { ...current };
        delete next[itemId];
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.radarItems.all() });
    },
    [clearDismissTimer, queryClient]
  );

  const beginDismissExit = useCallback(
    (itemId: string) => {
      if (includeFiltered) {
        commitDismiss(itemId);
        return;
      }
      if (prefersReducedMotion) {
        commitDismiss(itemId);
        return;
      }
      setDismissingById((current) => {
        const entry = current[itemId];
        if (!entry || entry.phase !== 'pending') return current;
        return { ...current, [itemId]: { ...entry, phase: 'exiting' } };
      });
      exitTimersRef.current[itemId] = window.setTimeout(() => {
        commitDismiss(itemId);
      }, TREND_STREAM_IRRELEVANT_EXIT_MS);
    },
    [commitDismiss, includeFiltered, prefersReducedMotion]
  );

  const scheduleDismissHold = useCallback(
    (itemId: string) => {
      clearDismissTimer(itemId);
      dismissTimersRef.current[itemId] = window.setTimeout(() => {
        beginDismissExit(itemId);
      }, TREND_STREAM_IRRELEVANT_UNDO_MS);
    },
    [beginDismissExit, clearDismissTimer]
  );

  useEffect(() => {
    const dismissTimers = dismissTimersRef.current;
    const exitTimers = exitTimersRef.current;
    return () => {
      Object.values(dismissTimers).forEach((timerId) => window.clearTimeout(timerId));
      Object.values(exitTimers).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const item of streamItems) {
      for (const tag of item.topicTags ?? []) tags.add(tag);
    }
    return [...tags].sort();
  }, [streamItems]);
  const selectedItems = useMemo(
    () => streamItems.filter((item) => selectedItemIds.includes(item.id)),
    [streamItems, selectedItemIds]
  );
  const selectionAtCap = selectedItemIds.length >= MAX_RADAR_SELECTION;
  const allVisibleSelected =
    displayItems.length > 0 &&
    displayItems.slice(0, MAX_RADAR_SELECTION).every((item) => selectedItemIds.includes(item.id));
  const relevanceModalItem = useMemo(
    () => displayItems.find((item) => item.id === relevanceModalItemId) ?? null,
    [displayItems, relevanceModalItemId]
  );
  const irrelevantModalItems = useMemo(
    () => displayItems.filter((item) => irrelevantModalItemIds.includes(item.id)),
    [displayItems, irrelevantModalItemIds]
  );
  const irrelevantModalItem = irrelevantModalItems.length === 1 ? irrelevantModalItems[0] : null;

  const brainstormMutation = useMutation({
    mutationFn: async (request: TrendStreamBrainstormRequest) => {
      if (selectedItemIds.length === 0) {
        throw new Error('Select at least one Trend Stream card');
      }
      return personalBrandingService.generateRadarExtractedIdeas({
        brandProfileId: request.brandProfileId,
        radarItemIds: selectedItemIds,
        targetPlatform: request.targetPlatform,
        templateIds: request.templateIds,
        count: request.count,
      });
    },
    onMutate: () => setBrainstormError(null),
    onSuccess: (start) => {
      setBrainstormJobId(start.jobId);
    },
    onError: (err: Error) => setBrainstormError(err.message),
  });

  const ideationJob = useContentIdeationJob(
    brainstormJobId,
    async (job) => {
      if (job.status === 'succeeded' && job.result) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.ideas.all() });
        setSelectedItemIds([]);
        setBrainstormJobId(null);
        setBrainstormOpen(false);
        showToast({
          type: 'success',
          title: `Generated ${job.result.ideas.length} content idea${job.result.ideas.length === 1 ? '' : 's'}`,
        });
        navigate(`${ROUTES.admin.personalBrandingWorkbench}?tab=trend-ideas`);
        return;
      }
      if (job.status === 'failed') {
        setBrainstormJobId(null);
        setBrainstormError(job.error ?? job.message ?? 'Content ideation failed');
      }
    },
    () => {
      setBrainstormJobId(null);
      setBrainstormError(
        'Content ideation is still running but took longer than expected. Check Trend Ideas shortly or retry.'
      );
    }
  );

  const isBrainstorming =
    brainstormMutation.isPending ||
    Boolean(
      brainstormJobId &&
      (!ideationJob.data ||
        ideationJob.data.status === 'queued' ||
        ideationJob.data.status === 'running')
    );

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }
      if (current.length >= MAX_RADAR_SELECTION) return current;
      return [...current, itemId];
    });
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(displayItems.slice(0, MAX_RADAR_SELECTION).map((item) => item.id));
      setSelectedItemIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    const nextIds = displayItems
      .filter((item) => !isTrendStreamCardDismissing(item.id, dismissingById))
      .slice(0, MAX_RADAR_SELECTION)
      .map((item) => item.id);
    setSelectedItemIds(nextIds);
  };

  const handleSyncNow = async () => {
    try {
      const res = await startSync.mutateAsync();
      setSelectedRunId(res.runId);
      showToast({ type: 'success', title: 'Sync started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Sync failed to start',
      });
    }
  };

  const handleRerun = async () => {
    try {
      await startSync.mutateAsync();
      setSelectedRunId(null);
      showToast({ type: 'success', title: 'Sync started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Sync failed to start',
      });
    }
  };

  const handleMarkRelevance = async (itemId: string, relevant: boolean) => {
    try {
      await updateItemRelevance.mutateAsync({ itemId, relevant });
      showToast({
        type: 'success',
        title: relevant ? 'Marked as relevant' : 'Marked as irrelevant',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to update relevance',
      });
    }
  };

  const handleConfirmIrrelevant = async (reason: RadarUserIrrelevanceReason) => {
    if (irrelevantModalItemIds.length === 0) return;
    const itemIds = [...irrelevantModalItemIds];
    setBulkIrrelevantPending(true);
    setBulkUpdatingIds(new Set(itemIds));
    try {
      const results = await Promise.allSettled(
        itemIds.map((itemId) =>
          updateItemRelevance.mutateAsync({
            itemId,
            relevant: false,
            reason,
          })
        )
      );
      const { succeeded } = partitionBulkIrrelevantResults(itemIds, results);
      const succeededIds = new Set(succeeded.map((entry) => entry.itemId));

      if (succeeded.length > 0) {
        setDismissingById((current) => {
          const next = { ...current };
          for (const { itemId, updatedItem } of succeeded) {
            next[itemId] = { item: updatedItem, phase: 'pending' };
          }
          return next;
        });
        for (const { itemId } of succeeded) {
          scheduleDismissHold(itemId);
        }
        setSelectedItemIds((current) => current.filter((id) => !succeededIds.has(id)));
      }

      setIrrelevantModalItemIds([]);
      const toasts = buildBulkIrrelevantToastMessages(itemIds.length, succeeded.length);
      if (toasts.success) {
        showToast({ type: 'success', title: toasts.success.title });
      }
      if (toasts.error) {
        showToast({ type: 'error', title: toasts.error.title });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to update relevance',
      });
    } finally {
      setBulkIrrelevantPending(false);
      setBulkUpdatingIds(new Set());
    }
  };

  const handleUndoDismiss = async (itemId: string) => {
    clearDismissTimer(itemId);
    setDismissingById((current) => {
      if (!(itemId in current)) return current;
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    try {
      await updateItemRelevance.mutateAsync({ itemId, relevant: true });
      showToast({ type: 'success', title: 'Restored' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to restore card',
      });
    }
  };

  const handleExplainRelevance = async () => {
    if (!relevanceModalItemId) return;
    try {
      await explainItemRelevance.mutateAsync(relevanceModalItemId);
      showToast({ type: 'success', title: 'Relevance explanation generated' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Explain failed',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Stream</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Inbound macro-topics from your radar sources.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {onOpenSettings ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onOpenSettings}
              aria-label="Open Signal Radar settings"
            >
              Settings
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSyncNow()}
            disabled={startSync.isPending}
            className="inline-flex items-center gap-2"
          >
            {startSync.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Sync now
          </Button>
        </div>
      </div>

      {startSync.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
        >
          {startSync.error instanceof Error ? startSync.error.message : String(startSync.error)}
        </div>
      ) : null}

      <PageCard className="space-y-3 p-0">
        <h3 className="px-6 pt-6 text-sm font-medium text-gray-700 dark:text-gray-300">
          Recent ingest runs
        </h3>
        <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/60">
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Trigger</th>
                <th className="px-3 py-2">Sources</th>
                <th className="px-3 py-2">Created / Discovered</th>
                <th className="px-3 py-2">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Loading runs…
                  </td>
                </tr>
              ) : runRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No ingest runs yet. Use Sync now to pull from enabled sources.
                  </td>
                </tr>
              ) : (
                runRows.map((run) => (
                  <tr
                    key={run.id}
                    className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-900/30 ${
                      selectedRunId === run.id ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <td className="px-3 py-2">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="px-3 py-2 capitalize">{capitalizeLabel(run.trigger)}</td>
                    <td className="px-3 py-2">
                      {formatSourcesSuccessPercent(run.sourcesSucceeded, run.sourcesTotal)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCreatedDiscoveredRatio(run.itemsCreated, run.itemsDiscovered)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatDate(run.startedAt ?? run.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <RunDetailDrawer
        open={Boolean(selectedRunId)}
        run={runDetail}
        isLoading={activeDetail.detail.isLoading}
        isRerunning={startSync.isPending}
        onClose={() => setSelectedRunId(null)}
        onRerun={handleRerun}
      />

      <div className="space-y-4">
        <TrendStreamFilterBar
          filters={itemFilters}
          onChange={setItemFilters}
          sources={radarSources}
          savedViews={savedViews}
          availableTags={availableTags}
          isSavingView={createView.isPending}
          onSaveView={async (name, filters) => {
            await createView.mutateAsync({ name, filters });
            showToast({ type: 'success', title: `Saved view “${name}”` });
          }}
          onDeleteView={async (viewId) => {
            await deleteView.mutateAsync(viewId);
            if (itemFilters.viewId === viewId) {
              setItemFilters((current: TrendStreamFilterState) => ({
                ...current,
                viewId: undefined,
              }));
            }
            showToast({ type: 'success', title: 'Deleted saved view' });
          }}
        />

        <section className="space-y-4">
          {feedbackStats ? <RadarLearningSignalBanner stats={feedbackStats} /> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Stream cards</h3>
            {displayItems.length > 0 ? (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FormCheckbox checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                Select visible (up to {MAX_RADAR_SELECTION})
              </label>
            ) : null}
          </div>
          {selectedItemIds.length > 0 ? (
            <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40">
              <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                {selectedItemIds.length} card{selectedItemIds.length === 1 ? '' : 's'} selected
                {selectionAtCap ? ` (max ${MAX_RADAR_SELECTION})` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedItemIds([])}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={bulkIrrelevantPending}
                  onClick={() =>
                    setIrrelevantModalItemIds(
                      selectedItemIds.filter(
                        (id) => !isTrendStreamCardDismissing(id, dismissingById)
                      )
                    )
                  }
                  className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Mark as irrelevant
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setBrainstormOpen(true)}
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="size-4" aria-hidden />
                  Brainstorm content ideas
                </Button>
              </div>
            </div>
          ) : null}
          {items.isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-gray-500">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading items…
            </div>
          ) : displayItems.length === 0 ? (
            <PageCard className={cn(emptyStateCardClassName, 'p-10')}>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">No items yet</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Configure sources and run a sync to populate the Trend Stream.
              </p>
            </PageCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {displayItems.map((item) => {
                  const dismissPhase = getTrendStreamDismissPhase(item.id, dismissingById);
                  const isUpdatingThis =
                    bulkUpdatingIds.has(item.id) ||
                    (updateItemRelevance.isPending &&
                      updateItemRelevance.variables?.itemId === item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout={!prefersReducedMotion}
                      initial={false}
                      animate={
                        dismissPhase === 'exiting'
                          ? {
                              opacity: 0,
                              x: prefersReducedMotion ? 0 : 24,
                              scale: prefersReducedMotion ? 1 : 0.98,
                            }
                          : { opacity: 1, x: 0, scale: 1 }
                      }
                      exit={
                        prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }
                      }
                      transition={{
                        duration: TREND_STREAM_IRRELEVANT_EXIT_MS / 1000,
                        ease: 'easeInOut',
                      }}
                    >
                      <RadarItemCard
                        item={item}
                        includeFiltered={includeFiltered}
                        selected={selectedItemIds.includes(item.id)}
                        selectionDisabled={
                          (!selectedItemIds.includes(item.id) && selectionAtCap) ||
                          isTrendStreamCardDismissing(item.id, dismissingById)
                        }
                        dismissPhase={dismissPhase}
                        onToggleSelected={() => toggleItemSelection(item.id)}
                        onOpenRelevance={() => setRelevanceModalItemId(item.id)}
                        isUpdatingThis={isUpdatingThis}
                        onMarkRelevant={() => void handleMarkRelevance(item.id, true)}
                        onMarkIrrelevant={() => setIrrelevantModalItemIds([item.id])}
                        onUndoDismiss={() => void handleUndoDismiss(item.id)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      <TrendStreamBrainstormModal
        open={brainstormOpen}
        selectedItems={selectedItems}
        profiles={brandProfiles}
        profilesLoading={profilesQ.isPending}
        defaultBrandProfileId={defaultProfileId}
        isSubmitting={isBrainstorming}
        ideationJob={ideationJob.data}
        errorMessage={brainstormError}
        onClose={() => {
          setBrainstormOpen(false);
          setBrainstormError(null);
          setBrainstormJobId(null);
        }}
        onSubmit={(request) => brainstormMutation.mutate(request)}
      />

      <RadarItemRelevanceModal
        isOpen={relevanceModalItemId !== null}
        item={relevanceModalItem}
        isExplaining={explainItemRelevance.isPending}
        onClose={() => setRelevanceModalItemId(null)}
        onExplain={() => void handleExplainRelevance()}
      />

      <MarkIrrelevantReasonModal
        isOpen={irrelevantModalItemIds.length > 0}
        itemTitle={irrelevantModalItem?.title}
        itemCount={irrelevantModalItemIds.length}
        isSubmitting={bulkIrrelevantPending || updateItemRelevance.isPending}
        onClose={() => setIrrelevantModalItemIds([])}
        onSubmit={(reason) => void handleConfirmIrrelevant(reason)}
      />

      <ToastContainer />
    </div>
  );
}
