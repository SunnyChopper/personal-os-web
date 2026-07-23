import {
  RADAR_SYNC_CADENCE_LABELS,
  type RadarSource,
  type RadarSourceCadenceSuggestion,
  type RadarSyncCadence,
} from '@/types/api/personal-branding.dto';

export type SourceOverrideState = {
  cadence: RadarSyncCadence | '';
  cadenceIntervalHours: number;
};

export function partitionSourcesByCadenceOverride(
  sources: RadarSource[],
  overrides: Record<string, SourceOverrideState>
): { usingGlobal: RadarSource[]; withOverride: RadarSource[] } {
  const usingGlobal: RadarSource[] = [];
  const withOverride: RadarSource[] = [];

  for (const source of sources) {
    const override = overrides[source.id];
    if (override?.cadence) {
      withOverride.push(source);
    } else {
      usingGlobal.push(source);
    }
  }

  return { usingGlobal, withOverride };
}

export function formatSuggestedCadenceChipLabel(
  suggestion: RadarSourceCadenceSuggestion | undefined
): string | null {
  if (!suggestion?.enoughData || !suggestion.suggestedCadence) {
    return null;
  }
  if (suggestion.suggestedCadence === 'EVERY_N_HOURS' && suggestion.suggestedIntervalHours) {
    return `Every ${suggestion.suggestedIntervalHours}h`;
  }
  return RADAR_SYNC_CADENCE_LABELS[suggestion.suggestedCadence];
}

export function formatSuggestionWhy(suggestion: RadarSourceCadenceSuggestion | undefined): string {
  if (!suggestion) {
    return '';
  }
  if (suggestion.enoughData && suggestion.medianGapHours != null && suggestion.sampleSize > 0) {
    return `Why: median arrival ${suggestion.medianGapHours.toFixed(1)}h across ${suggestion.sampleSize} gap${suggestion.sampleSize === 1 ? '' : 's'}`;
  }
  return suggestion.message;
}

export function suggestionMatchesOverride(
  suggestion: RadarSourceCadenceSuggestion | undefined,
  override: SourceOverrideState | undefined
): boolean {
  if (!suggestion?.enoughData || !suggestion.suggestedCadence || !override?.cadence) {
    return false;
  }
  if (suggestion.suggestedCadence !== override.cadence) {
    return false;
  }
  if (suggestion.suggestedCadence === 'EVERY_N_HOURS') {
    return (
      suggestion.suggestedIntervalHours != null &&
      override.cadenceIntervalHours === suggestion.suggestedIntervalHours
    );
  }
  return true;
}
