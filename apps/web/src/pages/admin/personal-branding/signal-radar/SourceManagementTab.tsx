import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { linkAccentClassName } from '../personal-branding-ui';
import SourceEditorDialog from '@/components/organisms/personal-branding/SourceEditorDialog';
import { useToast } from '@/hooks/use-toast';
import { useSignalRadarDiscoveryRun, type useSignalRadar } from '@/hooks/useSignalRadar';
import {
  RADAR_SOURCE_TYPE_LABELS,
  RADAR_SYNC_CADENCE_LABELS,
  RADAR_SYNC_WEEKDAY_LABELS,
} from '@/types/api/personal-branding.dto';
import type {
  RadarDiscoverySuggestion,
  RadarSource,
  RadarSyncCadence,
} from '@/types/api/personal-branding.dto';
import { Select } from '@/components/atoms/Select';
import { PageCard } from '../PersonalBrandingPageTemplate';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const DEFAULT_SYNC_START_TIME = '08:00';
const DEFAULT_SYNC_INTERVAL_HOURS = 6;
const DEFAULT_SYNC_DAY_OF_WEEK = 0;

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function DiscoverySuggestionRow({
  suggestion,
  index,
  isSaving,
  onSave,
}: {
  suggestion: RadarDiscoverySuggestion;
  index: number;
  isSaving: boolean;
  onSave: () => void;
}) {
  const isDuplicate = suggestion.duplicateStatus !== 'new';
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.name}</h4>
          <p className="mt-1 text-xs text-gray-500">
            {RADAR_SOURCE_TYPE_LABELS[suggestion.sourceType]} ·{' '}
            {(suggestion.confidence * 100).toFixed(0)}% confidence
            {isDuplicate ? ` · ${suggestion.duplicateStatus}` : ''}
          </p>
        </div>
        <Button type="button" size="sm" disabled={isSaving || isDuplicate} onClick={onSave}>
          {isSaving ? 'Saving…' : 'Save as source'}
        </Button>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{suggestion.rationale}</p>
      <a
        href={suggestion.endpoint}
        target="_blank"
        rel="noreferrer"
        className={cn('mt-2 block truncate text-sm', linkAccentClassName)}
      >
        {suggestion.endpoint}
      </a>
      <span className="sr-only">Suggestion {index + 1}</span>
    </div>
  );
}

interface SourceManagementTabProps {
  signalRadar: SignalRadarHook;
}

export default function SourceManagementTab({ signalRadar }: SourceManagementTabProps) {
  const { showToast, ToastContainer } = useToast();
  const settings = signalRadar.settings.data;
  const sources = signalRadar.sources.data?.data ?? [];

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RadarSource | null>(null);
  const [syncCadence, setSyncCadence] = useState<RadarSyncCadence>('DAILY');
  const [syncStartTime, setSyncStartTime] = useState(DEFAULT_SYNC_START_TIME);
  const [syncIntervalHours, setSyncIntervalHours] = useState(DEFAULT_SYNC_INTERVAL_HOURS);
  const [syncDayOfWeek, setSyncDayOfWeek] = useState(DEFAULT_SYNC_DAY_OF_WEEK);
  const [discoveryRunId, setDiscoveryRunId] = useState<string | null>(null);
  const [savingSuggestionKey, setSavingSuggestionKey] = useState<string | null>(null);

  const discovery = useSignalRadarDiscoveryRun(discoveryRunId);

  useEffect(() => {
    if (!settings) return;
    setSyncCadence(
      settings.syncCadence === ('EVERY_6_HOURS' as RadarSyncCadence)
        ? 'EVERY_N_HOURS'
        : settings.syncCadence
    );
    setSyncStartTime(settings.syncStartTime || DEFAULT_SYNC_START_TIME);
    setSyncIntervalHours(settings.syncIntervalHours ?? DEFAULT_SYNC_INTERVAL_HOURS);
    setSyncDayOfWeek(settings.syncDayOfWeek ?? DEFAULT_SYNC_DAY_OF_WEEK);
  }, [settings]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (source: RadarSource) => {
    setEditing(source);
    setEditorOpen(true);
  };

  const handleSaveSettings = async () => {
    try {
      const body: Parameters<typeof signalRadar.updateSettings.mutateAsync>[0] = {
        syncCadence,
        syncStartTime: syncCadence === 'MANUAL_ONLY' ? null : syncStartTime,
        syncTimezone: syncCadence === 'MANUAL_ONLY' ? null : BROWSER_TIMEZONE,
        syncIntervalHours: syncCadence === 'EVERY_N_HOURS' ? syncIntervalHours : null,
        syncDayOfWeek: syncCadence === 'WEEKLY' ? syncDayOfWeek : null,
      };
      await signalRadar.updateSettings.mutateAsync(body);
      showToast({ type: 'success', title: 'Radar settings saved' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  const handleStartDiscovery = async () => {
    try {
      const res = await signalRadar.startDiscovery.mutateAsync();
      setDiscoveryRunId(res.runId);
      showToast({ type: 'success', title: 'Discovery run started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Discovery failed to start',
      });
    }
  };

  const discoveryRun = discovery.detail.data;
  const suggestions = discoveryRun?.suggestions ?? [];

  return (
    <div className="space-y-8">
      <PageCard className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Global settings</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Sync cadence drives scheduled ingestion. Manual runs do not change the next due time.
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300"
            title="Tavily is provided by the platform"
          >
            <span className="font-medium">Tavily</span>
            <span className="rounded bg-green-100 px-1.5 py-0.5 font-medium dark:bg-green-900/50">
              Active
            </span>
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sync cadence
            </label>
            <Select
              value={syncCadence}
              onChange={(e) => setSyncCadence(e.target.value as RadarSyncCadence)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              {(Object.keys(RADAR_SYNC_CADENCE_LABELS) as RadarSyncCadence[]).map((key) => (
                <option key={key} value={key}>
                  {RADAR_SYNC_CADENCE_LABELS[key]}
                </option>
              ))}
            </Select>
          </div>
          {syncCadence === 'EVERY_N_HOURS' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Interval (hours)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={syncIntervalHours}
                onChange={(e) => setSyncIntervalHours(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
          ) : null}
          {syncCadence === 'WEEKLY' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Day of week
              </label>
              <Select
                value={String(syncDayOfWeek)}
                onChange={(e) => setSyncDayOfWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                {Object.entries(RADAR_SYNC_WEEKDAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          {syncCadence !== 'MANUAL_ONLY' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start time
              </label>
              <input
                type="time"
                value={syncStartTime}
                onChange={(e) => setSyncStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">Local time ({BROWSER_TIMEZONE})</p>
            </div>
          ) : null}
        </div>
        {settings ? (
          <p className="text-xs text-gray-500">
            Last run {formatDate(settings.lastRunAt)} · Next due {formatDate(settings.nextDueAt)}
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSaveSettings()}
          disabled={signalRadar.updateSettings.isPending}
          className="inline-flex items-center gap-2"
        >
          {signalRadar.updateSettings.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Save settings
        </Button>
      </PageCard>

      <PageCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            RSS feeds and API endpoints polled for Trend Stream cards.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            Add source
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Secret
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Last scraped
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No sources yet. Add a feed or run discovery below.
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {source.name}
                      {!source.enabled ? (
                        <span className="ml-2 text-xs text-gray-500">(disabled)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{RADAR_SOURCE_TYPE_LABELS[source.sourceType]}</td>
                    <td className={cn('max-w-[220px] truncate px-4 py-3', linkAccentClassName)}>
                      <a href={source.endpoint} target="_blank" rel="noreferrer">
                        {source.endpoint}
                      </a>
                    </td>
                    <td className="px-4 py-3">{source.hasSecret ? 'Yes' : '—'}</td>
                    <td className="px-4 py-3">{formatDate(source.lastScrapedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(source)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label={`Edit ${source.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Delete ${source.name}?`)) return;
                            try {
                              await signalRadar.deleteSource.mutateAsync(source.id);
                              showToast({ type: 'success', title: 'Source deleted' });
                            } catch (err) {
                              showToast({
                                type: 'error',
                                title: err instanceof Error ? err.message : 'Delete failed',
                              });
                            }
                          }}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          aria-label={`Delete ${source.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <PageCard className="space-y-4 border-dashed border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Source discovery
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Tavily + brand pillars suggest new feeds and APIs.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleStartDiscovery()}
            disabled={signalRadar.startDiscovery.isPending || !settings?.hasTavilyKey}
            className="inline-flex items-center gap-2"
          >
            {signalRadar.startDiscovery.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            Run discovery
          </Button>
        </div>

        {discoveryRunId ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="font-medium">Run status:</span>{' '}
            <span className="font-mono text-xs">{discoveryRun?.status ?? 'loading…'}</span>
            {discoveryRun?.error ? (
              <p className="mt-2 text-red-600 dark:text-red-400">{discoveryRun.error}</p>
            ) : null}
          </div>
        ) : null}

        {suggestions.length > 0 ? (
          <div className="grid gap-3">
            {suggestions.map((suggestion, index) => {
              const key = `${suggestion.name}-${suggestion.endpoint}`;
              return (
                <DiscoverySuggestionRow
                  key={key}
                  suggestion={suggestion}
                  index={index}
                  isSaving={savingSuggestionKey === key}
                  onSave={async () => {
                    setSavingSuggestionKey(key);
                    try {
                      await signalRadar.saveDiscoverySuggestion.mutateAsync({
                        name: suggestion.name,
                        sourceType: suggestion.sourceType,
                        endpoint: suggestion.endpoint,
                      });
                      showToast({ type: 'success', title: `Saved ${suggestion.name}` });
                    } catch (err) {
                      showToast({
                        type: 'error',
                        title: err instanceof Error ? err.message : 'Save failed',
                      });
                    } finally {
                      setSavingSuggestionKey(null);
                    }
                  }}
                />
              );
            })}
          </div>
        ) : discoveryRunId && discoveryRun?.status === 'completed' ? (
          <p className="text-sm text-gray-500">No new suggestions for this run.</p>
        ) : null}
      </PageCard>

      <SourceEditorDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
        isSubmitting={signalRadar.createSource.isPending || signalRadar.updateSource.isPending}
        onCreate={async (body) => {
          try {
            await signalRadar.createSource.mutateAsync(body);
            showToast({ type: 'success', title: 'Source created' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Create failed',
            });
            throw err;
          }
        }}
        onUpdate={async (id, body) => {
          try {
            await signalRadar.updateSource.mutateAsync({ id, body });
            showToast({ type: 'success', title: 'Source updated' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Update failed',
            });
            throw err;
          }
        }}
      />

      <ToastContainer />
    </div>
  );
}
