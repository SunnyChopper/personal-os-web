import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { FormField } from '@/components/molecules/FormField';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { useInPersonEvents } from '@/hooks/useInPersonEvents';
import {
  SYNC_CADENCE_LABELS,
  type EventLocationStint,
  type InPersonEventType,
  type SyncCadence,
} from '@/types/api/personal-branding.dto';
import { FormInput, FormTextarea } from '../PersonalBrandingFormFields';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import {
  pbFieldGroupStackClassName,
  pbSectionStackClassName,
  selectableChipClassName,
} from '../personal-branding-ui';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import {
  EVENT_TYPE_OPTIONS,
  isAllEventTypes,
  toggleEventTypeFilter,
} from './event-type-filter';

type Props = {
  events: ReturnType<typeof useInPersonEvents>;
};

function clearStintFormFields(setters: {
  setLabel: (v: string) => void;
  setCity: (v: string) => void;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  setEditingId: (v: string | null) => void;
}) {
  setters.setLabel('');
  setters.setCity('');
  setters.setStartDate('');
  setters.setEndDate('');
  setters.setEditingId(null);
}

export default function EventsSettingsTab({ events }: Props) {
  const { showToast } = useToast();
  const settings = events.settings.data;
  const stints = events.locations.data?.data ?? [];
  const [label, setLabel] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [interestsText, setInterestsText] = useState('');
  const [excludeText, setExcludeText] = useState('');
  const [syncCadence, setSyncCadence] = useState<SyncCadence>('WEEKLY');
  const [lookaheadDays, setLookaheadDays] = useState(60);
  const [minFitScore, setMinFitScore] = useState(40);
  const [createGrowthTaskEnabled, setCreateGrowthTaskEnabled] = useState(false);
  const [createTaskMinFitScore, setCreateTaskMinFitScore] = useState(80);
  const [selectedTypes, setSelectedTypes] = useState<InPersonEventType[]>([]);

  const isSavingStint =
    events.createLocation.isPending || events.updateLocation.isPending;

  useEffect(() => {
    if (!settings) return;
    setInterestsText((settings.interests ?? []).join(', '));
    setExcludeText((settings.excludeKeywords ?? []).join(', '));
    setSyncCadence(settings.syncCadence);
    setLookaheadDays(settings.lookaheadDays);
    setMinFitScore(settings.minFitScore);
    setCreateGrowthTaskEnabled(settings.createGrowthTaskEnabled);
    setCreateTaskMinFitScore(settings.createTaskMinFitScore);
    setSelectedTypes(settings.eventTypes ?? []);
  }, [settings]);

  const resetStintForm = () => {
    clearStintFormFields({ setLabel, setCity, setStartDate, setEndDate, setEditingId });
  };

  const startEditStint = (stint: EventLocationStint) => {
    setEditingId(stint.id);
    setLabel(stint.label);
    setCity(stint.city);
    setStartDate(stint.startDate);
    setEndDate(stint.endDate);
  };

  const saveStint = async () => {
    if (!label || !city || !startDate || !endDate) {
      showToast({ type: 'error', title: 'Fill label, city, and dates' });
      return;
    }
    try {
      if (editingId) {
        await events.updateLocation.mutateAsync({
          locationId: editingId,
          body: { label, city, startDate, endDate },
        });
        showToast({ type: 'success', title: 'Location stint updated' });
      } else {
        await events.createLocation.mutateAsync({
          label,
          city,
          startDate,
          endDate,
        });
        showToast({ type: 'success', title: 'Location stint added' });
      }
      resetStintForm();
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to save stint',
      });
    }
  };

  const removeStint = async (stint: EventLocationStint) => {
    if (!window.confirm(`Remove ${stint.label} (${stint.city})?`)) return;
    try {
      await events.deleteLocation.mutateAsync(stint.id);
      if (editingId === stint.id) {
        resetStintForm();
      }
      showToast({ type: 'success', title: 'Location stint removed' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to remove stint',
      });
    }
  };

  const saveSettings = async () => {
    try {
      await events.updateSettings.mutateAsync({
        interests: interestsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        excludeKeywords: excludeText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        syncCadence,
        lookaheadDays,
        minFitScore,
        createGrowthTaskEnabled,
        createTaskMinFitScore,
        eventTypes: selectedTypes,
      });
      showToast({ type: 'success', title: 'Settings saved' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Save failed',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageCard>
        <SectionIntro title="Where I'll be" />

        {events.locations.isError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Could not load saved location stints. Try refreshing the page.
          </p>
        ) : null}

        {stints.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Saved location stints
            </p>
            <ul className="space-y-2">
              {stints.map((stint) => (
                <li
                  key={stint.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="min-w-0 text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{stint.label}</span>
                    <span className="text-gray-600 dark:text-gray-400"> · {stint.city}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {stint.startDate} → {stint.endDate}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEditStint(stint)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={`Edit ${stint.label}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeStint(stint)}
                      disabled={events.deleteLocation.isPending}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label={`Remove ${stint.label}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FormField label="Label" htmlFor="events-stint-label">
            <FormInput
              id="events-stint-label"
              className="w-full"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Conference week"
            />
          </FormField>
          <FormField label="City" htmlFor="events-stint-city">
            <FormInput
              id="events-stint-city"
              className="w-full"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Austin"
            />
          </FormField>
          <FormField label="Start date" htmlFor="events-stint-start-date">
            <FormInput
              id="events-stint-start-date"
              type="date"
              className="w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField label="End date" htmlFor="events-stint-end-date">
            <FormInput
              id="events-stint-end-date"
              type="date"
              className="w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void saveStint()} disabled={isSavingStint}>
            {editingId ? 'Save changes' : 'Add location stint'}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetStintForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </PageCard>

      <section aria-labelledby="events-settings-look-for-heading" className={pbSectionStackClassName}>
        <SectionIntro
          title="What to look for"
          titleId="events-settings-look-for-heading"
        />
        <div className={cn('grid gap-3', pbFieldGroupStackClassName)}>
          <FormField label="Interests" htmlFor="events-interests" hint="Separated by commas">
            <FormTextarea
              id="events-interests"
              rows={2}
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="comma-separated"
            />
          </FormField>
          <FormField
            label="Exclude keywords"
            htmlFor="events-exclude-keywords"
            hint="Separated by commas. Applied as a hard filter after AI scoring."
          >
            <FormTextarea
              id="events-exclude-keywords"
              rows={2}
              value={excludeText}
              onChange={(e) => setExcludeText(e.target.value)}
              placeholder="comma-separated"
            />
          </FormField>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Event types</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              All types includes any in-person event. Select specific types to narrow discovery.
            </p>
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Event types"
            >
              <button
                type="button"
                aria-pressed={isAllEventTypes(selectedTypes)}
                onClick={() => setSelectedTypes((prev) => toggleEventTypeFilter(prev, 'all'))}
                className={selectableChipClassName(
                  isAllEventTypes(selectedTypes),
                  'rounded-full px-3 py-1.5'
                )}
              >
                All types
              </button>
              {EVENT_TYPE_OPTIONS.map((opt) => {
                const selected = selectedTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setSelectedTypes((prev) => toggleEventTypeFilter(prev, opt.value))
                    }
                    className={selectableChipClassName(selected, 'rounded-full px-3 py-1.5')}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Lookahead days"
              htmlFor="events-lookahead-days"
              hint="Hard persist gate: drop events whose start date is after min(today + lookahead, stint end). Also guides search queries (7–180 days; default 60)."
            >
              <FormInput
                id="events-lookahead-days"
                type="number"
                min={7}
                max={180}
                className="w-full"
                value={String(lookaheadDays)}
                onChange={(e) => setLookaheadDays(Number(e.target.value) || 60)}
              />
            </FormField>
            <FormField
              label="Min fit score"
              htmlFor="events-min-fit-score"
              hint="AI fit score 0–100; events below this threshold are dropped (default 40)."
            >
              <FormInput
                id="events-min-fit-score"
                type="number"
                min={0}
                max={100}
                className="w-full"
                value={String(minFitScore)}
                onChange={(e) => setMinFitScore(Number(e.target.value) || 40)}
              />
            </FormField>
          </div>
          <FormField
            label="Create Growth tasks for high-fit events"
            htmlFor="events-create-growth-task"
            hint="When enabled, discovery creates a Backlog task for events at or above the task min fit score (separate from the ingest min fit score above)."
          >
            <div className="flex flex-wrap items-center gap-3">
              <FormCheckbox
                id="events-create-growth-task"
                checked={createGrowthTaskEnabled}
                onChange={(e) => setCreateGrowthTaskEnabled(e.target.checked)}
              />
              <label
                htmlFor="events-create-growth-task"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Create Growth tasks for high-fit events
              </label>
            </div>
          </FormField>
          <FormField
            label="Task min fit score"
            htmlFor="events-create-task-min-fit-score"
            hint="Only used when Growth task creation is enabled (0–100, default 80)."
          >
            <FormInput
              id="events-create-task-min-fit-score"
              type="number"
              min={0}
              max={100}
              className="w-full sm:max-w-xs"
              disabled={!createGrowthTaskEnabled}
              value={String(createTaskMinFitScore)}
              onChange={(e) => setCreateTaskMinFitScore(Number(e.target.value) || 80)}
            />
          </FormField>
        </div>
      </section>

      <section aria-labelledby="events-settings-cadence-heading" className={pbSectionStackClassName}>
        <SectionIntro
          title="Discovery cadence"
          titleId="events-settings-cadence-heading"
        />
        <FormField label="Sync cadence" htmlFor="events-sync-cadence">
          <Select
            id="events-sync-cadence"
            className="w-full"
            value={syncCadence}
            onChange={(e) => setSyncCadence(e.target.value as SyncCadence)}
          >
            {(Object.keys(SYNC_CADENCE_LABELS) as SyncCadence[]).map((key) => (
              <option key={key} value={key}>
                {SYNC_CADENCE_LABELS[key]}
              </option>
            ))}
          </Select>
        </FormField>
        {settings?.nextDueAt ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Next scheduled run: {new Date(settings.nextDueAt).toLocaleString()}
          </p>
        ) : null}
        {!settings?.hasTavilyKey ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Tavily key is not configured — discovery requires platform Tavily access.
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={() => void saveSettings()}>Save settings</Button>
        </div>
      </section>
    </div>
  );
}
