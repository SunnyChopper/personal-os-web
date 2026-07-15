import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader2, MoreVertical, RefreshCw, Settings, Sparkles } from 'lucide-react';
import SyncSettingsDialog from '@/components/organisms/personal-branding/SyncSettingsDialog';
import TrendStreamBrainstormModal, {
  type TrendStreamBrainstormRequest,
} from '@/components/organisms/personal-branding/TrendStreamBrainstormModal';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { linkAccentClassName } from '../personal-branding-ui';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { ROUTES } from '@/routes';
import {
  useSignalRadarItems,
  useSignalRadarRunDetail,
  useSignalRadarRuns,
  type useSignalRadar,
} from '@/hooks/useSignalRadar';
import { RADAR_ITEM_TYPE_LABELS, type RadarItem } from '@/types/api/personal-branding.dto';
import { isBrandProfileReadyForIdeation } from '../content-workbench/content-workbench-helpers';
import RunDetailDrawer from './RunDetailDrawer';
import {
  PageCard,
  emptyStateCardClassName,
  gridItemCardClassName,
} from '../PersonalBrandingPageTemplate';

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
        User-marked
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

function RadarItemCard({
  item,
  includeFiltered,
  selected,
  selectionDisabled,
  onToggleSelected,
  onMarkRelevant,
  onMarkIrrelevant,
  isUpdating,
}: {
  item: RadarItem;
  includeFiltered: boolean;
  selected: boolean;
  selectionDisabled: boolean;
  onToggleSelected: () => void;
  onMarkRelevant: () => void;
  onMarkIrrelevant: () => void;
  isUpdating: boolean;
}) {
  const link = item.url ?? item.repositoryUrl;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showFilteredContext =
    includeFiltered && (item.userRelevant === false || item.aiRelevant === false);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  return (
    <article
      className={cn(
        gridItemCardClassName,
        'flex flex-col',
        selected && 'ring-2 ring-sky-500/70 dark:ring-sky-400/60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <FormCheckbox
            checked={selected}
            onChange={onToggleSelected}
            disabled={selectionDisabled}
            aria-label={`Select ${item.title}`}
            className="mt-0.5"
          />
          <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
            {RADAR_ITEM_TYPE_LABELS[item.itemType]}
          </span>
          {showFilteredContext ? <FilteredBadge item={item} /> : null}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              disabled={isUpdating}
              className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Card options"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="size-4" aria-hidden />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                {item.userRelevant === false ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      setMenuOpen(false);
                      onMarkRelevant();
                    }}
                  >
                    Mark as Relevant
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      setMenuOpen(false);
                      onMarkIrrelevant();
                    }}
                  >
                    Mark as Irrelevant
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {item.summary ? (
        <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
          {item.summary}
        </p>
      ) : null}
      {showFilteredContext && item.aiRationale ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.aiRationale}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
        {item.sourceName ? <span>{item.sourceName}</span> : null}
        {item.publishedAt ? <span>{formatDate(item.publishedAt)}</span> : null}
        <span>{(item.relevanceScore * 100).toFixed(0)}% relevance</span>
        {typeof item.aiRelevanceScore === 'number' ? (
          <span
            className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
            title={item.aiRationale ?? undefined}
          >
            AI {(item.aiRelevanceScore * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>
      {item.matchedPillars.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.matchedPillars.map((pillar) => (
            <span key={pillar} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
              {pillar}
            </span>
          ))}
        </div>
      ) : null}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'mt-4 inline-flex items-center gap-1 text-sm font-medium',
            linkAccentClassName
          )}
        >
          Open
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </article>
  );
}

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

interface TrendStreamTabProps {
  signalRadar: SignalRadarHook;
}

export default function TrendStreamTab({ signalRadar }: TrendStreamTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, ToastContainer } = useToast();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [itemPage] = useState(1);
  const [includeFiltered, setIncludeFiltered] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [brainstormOpen, setBrainstormOpen] = useState(false);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);

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
  const { items, updateItemRelevance } = useSignalRadarItems({
    page: itemPage,
    pageSize: 50,
    includeFiltered,
  });

  const runRows = runs.data?.data ?? [];

  const activeDetail = useSignalRadarRunDetail(selectedRunId);
  const runDetail = activeDetail.detail.data;
  const streamItems = items.data?.data ?? [];
  const selectedItems = useMemo(
    () => streamItems.filter((item) => selectedItemIds.includes(item.id)),
    [streamItems, selectedItemIds]
  );
  const selectionAtCap = selectedItemIds.length >= MAX_RADAR_SELECTION;
  const allVisibleSelected =
    streamItems.length > 0 &&
    streamItems.slice(0, MAX_RADAR_SELECTION).every((item) => selectedItemIds.includes(item.id));

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
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.ideas.all() });
      setSelectedItemIds([]);
      setBrainstormOpen(false);
      showToast({
        type: 'success',
        title: `Generated ${result.ideas.length} content idea${result.ideas.length === 1 ? '' : 's'}`,
      });
      navigate(`${ROUTES.admin.personalBrandingWorkbench}?tab=trend-ideas`);
    },
    onError: (err: Error) => setBrainstormError(err.message),
  });

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
      const visibleIds = new Set(streamItems.slice(0, MAX_RADAR_SELECTION).map((item) => item.id));
      setSelectedItemIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    const nextIds = streamItems.slice(0, MAX_RADAR_SELECTION).map((item) => item.id);
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
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FormCheckbox
              checked={includeFiltered}
              onChange={(e) => setIncludeFiltered(e.target.checked)}
            />
            Show filtered noise
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2"
            aria-label="Sync settings"
          >
            <Settings className="size-4" aria-hidden />
            Sync settings
          </Button>
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
                <th className="px-3 py-2">Items</th>
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
                    <td className="px-3 py-2">{run.itemsCreated}</td>
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

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Stream cards</h3>
          {streamItems.length > 0 ? (
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
        ) : streamItems.length === 0 ? (
          <PageCard className={cn(emptyStateCardClassName, 'p-10')}>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">No items yet</h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Configure sources and run a sync to populate the Trend Stream.
            </p>
          </PageCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {streamItems.map((item) => (
              <RadarItemCard
                key={item.id}
                item={item}
                includeFiltered={includeFiltered}
                selected={selectedItemIds.includes(item.id)}
                selectionDisabled={!selectedItemIds.includes(item.id) && selectionAtCap}
                onToggleSelected={() => toggleItemSelection(item.id)}
                isUpdating={updateItemRelevance.isPending}
                onMarkRelevant={() => void handleMarkRelevance(item.id, true)}
                onMarkIrrelevant={() => void handleMarkRelevance(item.id, false)}
              />
            ))}
          </div>
        )}
      </section>

      <TrendStreamBrainstormModal
        open={brainstormOpen}
        selectedItems={selectedItems}
        profiles={brandProfiles}
        profilesLoading={profilesQ.isPending}
        defaultBrandProfileId={defaultProfileId}
        isSubmitting={brainstormMutation.isPending}
        errorMessage={brainstormError}
        onClose={() => {
          if (brainstormMutation.isPending) return;
          setBrainstormOpen(false);
          setBrainstormError(null);
        }}
        onSubmit={(request) => brainstormMutation.mutate(request)}
      />

      <SyncSettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        signalRadar={signalRadar}
      />

      <ToastContainer />
    </div>
  );
}
