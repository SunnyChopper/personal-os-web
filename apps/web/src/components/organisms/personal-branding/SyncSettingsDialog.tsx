import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { useToast } from '@/hooks/use-toast';
import { useProactiveSettings } from '@/hooks/useProactive';
import type { useSignalRadar } from '@/hooks/useSignalRadar';
import {
  RADAR_SYNC_CADENCE_LABELS,
  RADAR_SYNC_WEEKDAY_LABELS,
  type RadarSource,
  type RadarSourceCadenceSuggestion,
  type RadarSyncCadence,
  type UpdateRadarSourceInput,
} from '@/types/api/personal-branding.dto';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import { formatDateTimeInTimeZone } from '@/utils/date-formatters';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const DEFAULT_SYNC_START_TIME = '08:00';
const DEFAULT_SYNC_INTERVAL_HOURS = 6;
const DEFAULT_SYNC_DAY_OF_WEEK = 0;

type SourceOverrideState = {
  cadence: RadarSyncCadence | '';
  cadenceIntervalHours: number;
};

function suggestionLabel(suggestion: RadarSourceCadenceSuggestion): string {
  if (!suggestion.enoughData || !suggestion.suggestedCadence) {
    return suggestion.message;
  }
  if (suggestion.suggestedCadence === 'EVERY_N_HOURS' && suggestion.suggestedIntervalHours) {
    return `Suggested: every ${suggestion.suggestedIntervalHours}h (${suggestion.message})`;
  }
  return `Suggested: ${RADAR_SYNC_CADENCE_LABELS[suggestion.suggestedCadence]} (${suggestion.message})`;
}

export interface SyncSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  signalRadar: SignalRadarHook;
}

export default function SyncSettingsDialog({
  isOpen,
  onClose,
  signalRadar,
}: SyncSettingsDialogProps) {
  const { showToast } = useToast();
  const { timeZone: timeZonePrefQ } = useProactiveSettings();
  const settings = signalRadar.settings.data;
  const sources = (signalRadar.sources.data?.data ?? []).filter((s) => s.enabled);

  const effectiveTimeZone = useMemo(
    () => timeZonePrefQ.data?.timeZone || settings?.syncTimezone || BROWSER_TIMEZONE,
    [settings?.syncTimezone, timeZonePrefQ.data?.timeZone]
  );

  const [syncCadence, setSyncCadence] = useState<RadarSyncCadence>('DAILY');
  const [syncStartTime, setSyncStartTime] = useState(DEFAULT_SYNC_START_TIME);
  const [syncIntervalHours, setSyncIntervalHours] = useState(DEFAULT_SYNC_INTERVAL_HOURS);
  const [syncDayOfWeek, setSyncDayOfWeek] = useState(DEFAULT_SYNC_DAY_OF_WEEK);
  const [sourceOverrides, setSourceOverrides] = useState<Record<string, SourceOverrideState>>({});
  const [savingSourceId, setSavingSourceId] = useState<string | null>(null);
  const [applyingSourceId, setApplyingSourceId] = useState<string | null>(null);

  const suggestionsQuery = signalRadar.suggestedCadences;
  const suggestionsBySourceId = new Map(
    (suggestionsQuery.data?.suggestions ?? []).map((s) => [s.sourceId, s])
  );

  useEffect(() => {
    if (!isOpen) return;
    void suggestionsQuery.refetch();
  }, [isOpen, suggestionsQuery]);

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

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, SourceOverrideState> = {};
    for (const source of sources) {
      next[source.id] = {
        cadence: (source.cadence as RadarSyncCadence | null) ?? '',
        cadenceIntervalHours: source.cadenceIntervalHours ?? DEFAULT_SYNC_INTERVAL_HOURS,
      };
    }
    setSourceOverrides(next);
  }, [isOpen, sources]);

  const handleSaveGlobal = async () => {
    try {
      await signalRadar.updateSettings.mutateAsync({
        syncCadence,
        syncStartTime: syncCadence === 'MANUAL_ONLY' ? null : syncStartTime,
        syncTimezone: syncCadence === 'MANUAL_ONLY' ? null : effectiveTimeZone,
        syncIntervalHours: syncCadence === 'EVERY_N_HOURS' ? syncIntervalHours : null,
        syncDayOfWeek: syncCadence === 'WEEKLY' ? syncDayOfWeek : null,
      });
      showToast({ type: 'success', title: 'Sync settings saved' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  const buildSourcePatch = (override: SourceOverrideState): UpdateRadarSourceInput => ({
    cadence: override.cadence || null,
    cadenceIntervalHours:
      override.cadence === 'EVERY_N_HOURS' ? override.cadenceIntervalHours : null,
  });

  const handleSaveSource = async (source: RadarSource) => {
    const override = sourceOverrides[source.id];
    if (!override) return;
    setSavingSourceId(source.id);
    try {
      await signalRadar.updateSource.mutateAsync({
        id: source.id,
        body: buildSourcePatch(override),
      });
      showToast({ type: 'success', title: `${source.name} cadence saved` });
      void suggestionsQuery.refetch();
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSavingSourceId(null);
    }
  };

  const handleApplySuggestion = async (source: RadarSource) => {
    const suggestion = suggestionsBySourceId.get(source.id);
    if (!suggestion?.enoughData || !suggestion.suggestedCadence) return;
    setApplyingSourceId(source.id);
    try {
      const body: UpdateRadarSourceInput = {
        cadence: suggestion.suggestedCadence,
        cadenceIntervalHours:
          suggestion.suggestedCadence === 'EVERY_N_HOURS'
            ? (suggestion.suggestedIntervalHours ?? DEFAULT_SYNC_INTERVAL_HOURS)
            : null,
      };
      await signalRadar.updateSource.mutateAsync({ id: source.id, body });
      setSourceOverrides((current) => ({
        ...current,
        [source.id]: {
          cadence: suggestion.suggestedCadence!,
          cadenceIntervalHours: suggestion.suggestedIntervalHours ?? DEFAULT_SYNC_INTERVAL_HOURS,
        },
      }));
      showToast({ type: 'success', title: `Applied suggestion for ${source.name}` });
      void suggestionsQuery.refetch();
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Apply failed' });
    } finally {
      setApplyingSourceId(null);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Sync settings" size="xl" className="max-w-3xl">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Configure automatic ingestion cadence for Signal Radar. Manual Sync now always pulls all
        enabled sources.
      </p>
      <div className="space-y-6">
        {settings && !settings.scheduledSyncEligible ? (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          >
            Scheduled sync is not active for this account yet. Set{' '}
            <code className="text-xs">RADAR_CRON_USER_IDS</code> to include your user ID, or use
            Sync now until scheduled ingest is enabled in the environment.
          </div>
        ) : null}

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Global cadence</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default schedule for all sources without a per-source override. Manual runs do not
              change the next due time.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
                <p className="mt-1 text-xs text-gray-500">Local time ({effectiveTimeZone})</p>
              </div>
            ) : null}
          </div>
          {settings ? (
            <p className="text-xs text-gray-500">
              Last run {formatDateTimeInTimeZone(settings.lastRunAt, effectiveTimeZone)} · Next due{' '}
              {formatDateTimeInTimeZone(settings.nextDueAt, effectiveTimeZone)}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Per-source overrides
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Override the global cadence for individual enabled sources. Suggestions appear when
              enough Trend Stream history exists.
            </p>
          </div>
          {sources.length === 0 ? (
            <p className="text-sm text-gray-500">No enabled sources yet.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => {
                const override = sourceOverrides[source.id];
                const suggestion = suggestionsBySourceId.get(source.id);
                if (!override) return null;
                return (
                  <div
                    key={source.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{source.name}</p>
                        <p className="text-xs text-gray-500">
                          Last scraped{' '}
                          {formatDateTimeInTimeZone(source.lastScrapedAt, effectiveTimeZone)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={savingSourceId === source.id}
                          onClick={() => void handleSaveSource(source)}
                        >
                          {savingSourceId === source.id ? 'Saving…' : 'Save'}
                        </Button>
                        {suggestion?.enoughData && suggestion.suggestedCadence ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={applyingSourceId === source.id}
                            onClick={() => void handleApplySuggestion(source)}
                          >
                            {applyingSourceId === source.id ? 'Applying…' : 'Apply suggestion'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Cadence
                        </label>
                        <Select
                          value={override.cadence}
                          onChange={(e) =>
                            setSourceOverrides((current) => ({
                              ...current,
                              [source.id]: {
                                ...current[source.id],
                                cadence: e.target.value as RadarSyncCadence | '',
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                        >
                          <option value="">Use global cadence</option>
                          {(Object.keys(RADAR_SYNC_CADENCE_LABELS) as RadarSyncCadence[]).map(
                            (key) => (
                              <option key={key} value={key}>
                                {RADAR_SYNC_CADENCE_LABELS[key]}
                              </option>
                            )
                          )}
                        </Select>
                      </div>
                      {override.cadence === 'EVERY_N_HOURS' ? (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Interval (hours)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={168}
                            value={override.cadenceIntervalHours}
                            onChange={(e) =>
                              setSourceOverrides((current) => ({
                                ...current,
                                [source.id]: {
                                  ...current[source.id],
                                  cadenceIntervalHours: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                          />
                        </div>
                      ) : null}
                    </div>
                    {suggestion ? (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {suggestionLabel(suggestion)}
                      </p>
                    ) : suggestionsQuery.isFetching ? (
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                        Loading suggestions…
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          onClick={() => void handleSaveGlobal()}
          disabled={signalRadar.updateSettings.isPending}
          className="inline-flex items-center gap-2"
        >
          {signalRadar.updateSettings.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Save global settings
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
