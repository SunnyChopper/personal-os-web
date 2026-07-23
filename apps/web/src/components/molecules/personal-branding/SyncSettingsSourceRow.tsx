import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import {
  formatSuggestedCadenceChipLabel,
  formatSuggestionWhy,
  suggestionMatchesOverride,
  type SourceOverrideState,
} from '@/lib/personal-branding/sync-settings-suggestions';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import {
  RADAR_SYNC_CADENCE_LABELS,
  type RadarSource,
  type RadarSourceCadenceSuggestion,
  type RadarSyncCadence,
} from '@/types/api/personal-branding.dto';
import { formatDateTimeInTimeZone } from '@/utils/date-formatters';
import { cn } from '@/lib/utils';

export type SyncSettingsSourceRowMode = 'compact' | 'full';

export interface SyncSettingsSourceRowProps {
  source: RadarSource;
  override: SourceOverrideState;
  suggestion: RadarSourceCadenceSuggestion | undefined;
  mode: SyncSettingsSourceRowMode;
  isExpanded: boolean;
  isSaving: boolean;
  isApplying: boolean;
  isLoadingSuggestion: boolean;
  timeZone: string;
  onOverrideChange: (next: SourceOverrideState) => void;
  onSave: () => void;
  onApplySuggestion: () => void;
  onExpandCustomCadence: () => void;
}

export default function SyncSettingsSourceRow({
  source,
  override,
  suggestion,
  mode,
  isExpanded,
  isSaving,
  isApplying,
  isLoadingSuggestion,
  timeZone,
  onOverrideChange,
  onSave,
  onApplySuggestion,
  onExpandCustomCadence,
}: SyncSettingsSourceRowProps) {
  const chipLabel = formatSuggestedCadenceChipLabel(suggestion);
  const whyText = formatSuggestionWhy(suggestion);
  const chipMatches = suggestionMatchesOverride(suggestion, override);
  const showEditor = mode === 'full' || isExpanded;

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white">{source.name}</p>
          <p className="text-xs text-gray-500">
            Last scraped {formatDateTimeInTimeZone(source.lastScrapedAt, timeZone)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chipLabel ? (
            <button
              type="button"
              className={cn(
                selectableChipClassName(chipMatches, 'rounded-full px-2.5 py-1 text-xs'),
                chipMatches && 'pointer-events-none'
              )}
              aria-pressed={chipMatches}
              disabled={isApplying || chipMatches}
              onClick={() => onApplySuggestion()}
            >
              {isApplying ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Applying…
                </span>
              ) : (
                chipLabel
              )}
            </button>
          ) : null}
          {showEditor ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onClick={() => onSave()}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onExpandCustomCadence()}
            >
              Set custom cadence
            </Button>
          )}
        </div>
      </div>

      {whyText ? (
        <p
          className={cn(
            'mt-2 text-xs',
            suggestion?.enoughData
              ? 'font-medium text-gray-700 dark:text-gray-300'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {whyText}
        </p>
      ) : isLoadingSuggestion ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Loading suggestions…
        </p>
      ) : null}

      {showEditor ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Cadence
            </label>
            <Select
              value={override.cadence}
              onChange={(e) =>
                onOverrideChange({
                  ...override,
                  cadence: e.target.value as RadarSyncCadence | '',
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="">Use global cadence</option>
              {(Object.keys(RADAR_SYNC_CADENCE_LABELS) as RadarSyncCadence[]).map((key) => (
                <option key={key} value={key}>
                  {RADAR_SYNC_CADENCE_LABELS[key]}
                </option>
              ))}
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
                  onOverrideChange({
                    ...override,
                    cadenceIntervalHours: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
