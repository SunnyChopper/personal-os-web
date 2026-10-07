import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { FormField } from '@/components/molecules/FormField';
import type { Toast } from '@/hooks/use-toast';
import type { ContentStreamHook } from '@/hooks/useContentStream';
import { describeSyncSchedule } from '@/lib/personal-branding/sync-schedule-status';
import { SYNC_CADENCE_LABELS, type SyncCadence } from '@/types/api/personal-branding.dto';
import { PageCard } from '../PersonalBrandingPageTemplate';

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const DEFAULT_SYNC_START_TIME = '08:00';
const DEFAULT_SYNC_END_TIME = '20:00';
const DEFAULT_SYNC_INTERVAL_HOURS = 6;

interface ContentStreamSettingsTabProps {
  stream: ContentStreamHook;
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function ContentStreamSettingsTab({
  stream,
  showToast,
}: ContentStreamSettingsTabProps) {
  const settings = stream.settings.data;
  const profiles = stream.profiles.data?.data ?? [];

  const [enabled, setEnabled] = useState(false);
  const [xUsername, setXUsername] = useState('');
  const [brandProfileId, setBrandProfileId] = useState('');
  const [postsPerDay, setPostsPerDay] = useState(5);
  const [syncCadence, setSyncCadence] = useState<SyncCadence>('DAILY');
  const [syncStartTime, setSyncStartTime] = useState(DEFAULT_SYNC_START_TIME);
  const [syncEndTime, setSyncEndTime] = useState(DEFAULT_SYNC_END_TIME);
  const [syncIntervalHours, setSyncIntervalHours] = useState(DEFAULT_SYNC_INTERVAL_HOURS);

  const scheduleStatus = useMemo(
    () => describeSyncSchedule(settings, Date.now(), 'radar'),
    [settings]
  );

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setXUsername(settings.xUsername ?? '');
    setBrandProfileId(settings.brandProfileId ?? '');
    setPostsPerDay(settings.postsPerDay);
    setSyncCadence(
      settings.syncCadence === ('EVERY_6_HOURS' as SyncCadence)
        ? 'EVERY_N_HOURS'
        : settings.syncCadence
    );
    setSyncStartTime(settings.syncStartTime || DEFAULT_SYNC_START_TIME);
    setSyncEndTime(settings.syncEndTime || DEFAULT_SYNC_END_TIME);
    setSyncIntervalHours(settings.syncIntervalHours ?? DEFAULT_SYNC_INTERVAL_HOURS);
  }, [settings]);

  const handleSave = async () => {
    try {
      await stream.updateSettings.mutateAsync({
        enabled,
        xUsername: xUsername.trim() || null,
        brandProfileId: brandProfileId || null,
        postsPerDay,
        syncCadence,
        syncStartTime: syncCadence === 'MANUAL_ONLY' ? null : syncStartTime,
        syncEndTime: syncCadence === 'EVERY_N_HOURS' ? syncEndTime : null,
        syncTimezone: syncCadence === 'MANUAL_ONLY' ? null : BROWSER_TIMEZONE,
        syncIntervalHours: syncCadence === 'EVERY_N_HOURS' ? syncIntervalHours : null,
      });
      showToast({ type: 'success', title: 'Content Stream settings saved' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  return (
    <PageCard className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">X (Twitter)</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Connect your handle, schedule automated drafts, and pick the brand profile that drives
          Platform Rules for short posts.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-gray-300"
        />
        Enable scheduled generation
      </label>

      <FormField label="X username" htmlFor="content-stream-x-username">
        <FormInput
          id="content-stream-x-username"
          value={xUsername}
          onChange={(e) => setXUsername(e.target.value.replace(/^@/, ''))}
          placeholder="yourhandle"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Used to pull your latest posts as voice context (RapidAPI).
        </p>
      </FormField>

      <FormField label="Brand profile" htmlFor="content-stream-brand-profile">
        <Select
          id="content-stream-brand-profile"
          value={brandProfileId}
          onChange={(e) => setBrandProfileId(e.target.value)}
        >
          <option value="">Auto (first X-compatible profile)</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
              {profile.status === 'extracting' ? ' (extracting)' : ''}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Posts per day" htmlFor="content-stream-posts-per-day">
        <FormInput
          id="content-stream-posts-per-day"
          type="number"
          min={1}
          max={20}
          value={String(postsPerDay)}
          onChange={(e) => setPostsPerDay(Number(e.target.value) || 1)}
        />
      </FormField>

      <FormField label="Cadence" htmlFor="content-stream-cadence">
        <Select
          id="content-stream-cadence"
          value={syncCadence}
          onChange={(e) => setSyncCadence(e.target.value as SyncCadence)}
        >
          {(['DAILY', 'EVERY_N_HOURS', 'MANUAL_ONLY'] as SyncCadence[]).map((value) => (
            <option key={value} value={value}>
              {SYNC_CADENCE_LABELS[value]}
            </option>
          ))}
        </Select>
      </FormField>

      {syncCadence !== 'MANUAL_ONLY' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Start time" htmlFor="content-stream-start-time">
            <FormInput
              id="content-stream-start-time"
              type="time"
              value={syncStartTime}
              onChange={(e) => setSyncStartTime(e.target.value)}
            />
          </FormField>
          {syncCadence === 'EVERY_N_HOURS' ? (
            <>
              <FormField label="End time" htmlFor="content-stream-end-time">
                <FormInput
                  id="content-stream-end-time"
                  type="time"
                  value={syncEndTime}
                  onChange={(e) => setSyncEndTime(e.target.value)}
                />
              </FormField>
              <FormField label="Interval (hours)" htmlFor="content-stream-interval">
                <FormInput
                  id="content-stream-interval"
                  type="number"
                  min={1}
                  max={168}
                  value={String(syncIntervalHours)}
                  onChange={(e) => setSyncIntervalHours(Number(e.target.value) || 6)}
                />
              </FormField>
            </>
          ) : null}
        </div>
      ) : null}

      {settings ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
          <p>{scheduleStatus.scheduleHint}</p>
          <p className="mt-2">Next due: {scheduleStatus.nextDueLabel}</p>
          <p>Last run: {scheduleStatus.lastRunLabel}</p>
          {settings.lastErrorSummary ? (
            <p className="mt-2 text-red-600 dark:text-red-400">{settings.lastErrorSummary}</p>
          ) : null}
          {settings.liveNowDiagnostics ? (
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Live Now (X inspiration)
              </p>
              <p className="mt-1">
                Status: {String(settings.liveNowDiagnostics.status ?? 'unknown')}
                {typeof settings.liveNowSignalCount === 'number'
                  ? ` · ${settings.liveNowSignalCount} cached signal(s)`
                  : null}
              </p>
              {Array.isArray(settings.liveNowDiagnostics.reasonCodes) &&
              settings.liveNowDiagnostics.reasonCodes.length > 0 ? (
                <p className="mt-1 text-amber-700 dark:text-amber-300">
                  {settings.liveNowDiagnostics.reasonCodes.join(', ')}
                </p>
              ) : null}
              {!settings.hasRapidApiKey ? (
                <p className="mt-1 text-amber-700 dark:text-amber-300">
                  RapidAPI key missing — Live Now and own-post voice context are unavailable.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <Button type="button" onClick={handleSave} disabled={stream.updateSettings.isPending}>
        Save X settings
      </Button>
    </PageCard>
  );
}
