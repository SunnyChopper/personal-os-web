import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Play, Radar } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import type { Toast } from '@/hooks/use-toast';
import { useReconFeed } from '@/hooks/useReconFeed';
import { describeSyncSchedule } from '@/lib/personal-branding/sync-schedule-status';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import {
  SYNC_CADENCE_LABELS,
  SYNC_WEEKDAY_LABELS,
  type SyncCadence,
} from '@/types/api/personal-branding.dto';
import { PageCard } from '../PersonalBrandingPageTemplate';

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const DEFAULT_SYNC_START_TIME = '08:00';
const DEFAULT_SYNC_END_TIME = '20:00';
const DEFAULT_SYNC_INTERVAL_HOURS = 6;
const DEFAULT_SYNC_DAY_OF_WEEK = 0;
const DEFAULT_MAX_POST_AGE_DAYS = 7;

interface ReconSettingsCardProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function ReconSettingsCard({ showToast }: ReconSettingsCardProps) {
  const recon = useReconFeed();
  const settings = recon.settings.data;

  const [syncCadence, setSyncCadence] = useState<SyncCadence>('DAILY');
  const [syncStartTime, setSyncStartTime] = useState(DEFAULT_SYNC_START_TIME);
  const [syncEndTime, setSyncEndTime] = useState(DEFAULT_SYNC_END_TIME);
  const [syncIntervalHours, setSyncIntervalHours] = useState(DEFAULT_SYNC_INTERVAL_HOURS);
  const [syncDayOfWeek, setSyncDayOfWeek] = useState(DEFAULT_SYNC_DAY_OF_WEEK);
  const [minScore, setMinScore] = useState(0.5);
  const [maxPosts, setMaxPosts] = useState(5);
  const [maxPostAgeDays, setMaxPostAgeDays] = useState(DEFAULT_MAX_POST_AGE_DAYS);

  const scheduleStatus = useMemo(
    () => describeSyncSchedule(settings, Date.now(), 'recon'),
    [settings]
  );

  const hasLastRunError = Boolean(
    settings?.lastRunStatus === 'failed' || settings?.lastErrorSummary
  );
  const errorRunLink =
    settings?.lastRunId && hasLastRunError
      ? `${ROUTES.admin.personalBrandingRolodex}?tab=recon-feed&runId=${encodeURIComponent(settings.lastRunId)}`
      : null;

  useEffect(() => {
    if (!settings) return;
    setSyncCadence(
      settings.syncCadence === ('EVERY_6_HOURS' as SyncCadence)
        ? 'EVERY_N_HOURS'
        : settings.syncCadence
    );
    setSyncStartTime(settings.syncStartTime || DEFAULT_SYNC_START_TIME);
    setSyncEndTime(settings.syncEndTime || DEFAULT_SYNC_END_TIME);
    setSyncIntervalHours(settings.syncIntervalHours ?? DEFAULT_SYNC_INTERVAL_HOURS);
    setSyncDayOfWeek(settings.syncDayOfWeek ?? DEFAULT_SYNC_DAY_OF_WEEK);
    setMinScore(settings.minRelevanceScore);
    setMaxPosts(settings.maxPostsPerConnection);
    setMaxPostAgeDays(settings.maxPostAgeDays ?? DEFAULT_MAX_POST_AGE_DAYS);
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      const body: Parameters<typeof recon.updateSettings.mutateAsync>[0] = {
        syncCadence,
        syncStartTime: syncCadence === 'MANUAL_ONLY' ? null : syncStartTime,
        syncEndTime: syncCadence === 'MANUAL_ONLY' ? null : syncEndTime,
        syncTimezone: syncCadence === 'MANUAL_ONLY' ? null : BROWSER_TIMEZONE,
        syncIntervalHours: syncCadence === 'EVERY_N_HOURS' ? syncIntervalHours : null,
        syncDayOfWeek: syncCadence === 'WEEKLY' ? syncDayOfWeek : null,
        minRelevanceScore: minScore,
        maxPostsPerConnection: maxPosts,
        maxPostAgeDays,
      };
      await recon.updateSettings.mutateAsync(body);
      showToast({ type: 'success', title: 'Recon Feed settings saved' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  const handleStartRun = async () => {
    try {
      await recon.startRun.mutateAsync();
      showToast({ type: 'success', title: 'Recon Feed run started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Run failed to start',
      });
    }
  };

  return (
    <PageCard className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recon settings</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Pull X posts for Connection Directory entries with an X handle. RapidAPI is configured
            at the platform level via Secrets Manager.
          </p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
            settings?.hasRapidApiKey
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300'
              : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
          )}
        >
          <Radar className="size-3.5" aria-hidden />
          <span className="font-medium">RapidAPI</span>
          <span className="rounded px-1.5 py-0.5 font-medium">
            {settings?.hasRapidApiKey ? 'Connected' : 'Not configured'}
          </span>
        </span>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ingest cadence</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Schedule automatic X post pulls. Scheduled attempts advance the next due time; manual
            runs update last attempted only.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sync cadence
            </label>
            <Select
              value={syncCadence}
              onChange={(e) => setSyncCadence(e.target.value as SyncCadence)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              {(Object.keys(SYNC_CADENCE_LABELS) as SyncCadence[]).map((key) => (
                <option key={key} value={key}>
                  {SYNC_CADENCE_LABELS[key]}
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
                {Object.entries(SYNC_WEEKDAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          {syncCadence !== 'MANUAL_ONLY' ? (
            <>
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
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End time
                </label>
                <input
                  type="time"
                  value={syncEndTime}
                  onChange={(e) => setSyncEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
            </>
          ) : null}
        </div>
        {settings ? (
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              Last successful run {scheduleStatus.lastSuccessfulRunLabel}
            </p>
            <p className="text-xs text-gray-500">
              Last attempted run {scheduleStatus.lastAttemptedRunLabel} · Next due{' '}
              {scheduleStatus.nextDueLabel}
            </p>
            {hasLastRunError ? (
              <div className="space-y-1">
                <p role="status" className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Last run failed
                  {settings.lastErrorSummary ? `: ${settings.lastErrorSummary}` : ''}
                </p>
                {errorRunLink ? (
                  <Link
                    to={errorRunLink}
                    className="text-xs font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View error details
                  </Link>
                ) : null}
              </div>
            ) : null}
            {scheduleStatus.isOverdue ? (
              <p role="status" className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Overdue by {scheduleStatus.overdueDurationLabel}
              </p>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {scheduleStatus.scheduleHint}
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Min relevance score
          </label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max posts per connection
          </label>
          <input
            type="number"
            min={1}
            max={40}
            value={maxPosts}
            onChange={(e) => setMaxPosts(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max post age (days)
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={maxPostAgeDays}
            onChange={(e) => setMaxPostAgeDays(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Posts older than this are removed from the feed and never ingested.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSaveSettings()}
          disabled={recon.updateSettings.isPending}
        >
          {recon.updateSettings.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : null}
          Save settings
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void handleStartRun()}
          disabled={
            recon.startRun.isPending || !settings?.hasRapidApiKey || recon.hasActiveNonPausedRun
          }
          className="inline-flex items-center gap-2"
        >
          {recon.startRun.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          Run now
        </Button>
      </div>
    </PageCard>
  );
}
