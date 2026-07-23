import type {
  ExtractionSourceFreshness,
  ProfileExtractionSource,
} from '@/types/api/personal-branding.dto';

import type { StatusPillTone } from '../personal-branding-ui';

export interface ExtractionSourceFreshnessDisplay {
  label: string;
  tone: StatusPillTone;
  tooltip: string;
  extractedLine: string;
}

const FRESHNESS_LABEL: Record<ExtractionSourceFreshness, string> = {
  never: 'Never',
  fresh: 'Fresh',
  aging: 'Aging',
  stale: 'Stale',
};

const FRESHNESS_TONE: Record<ExtractionSourceFreshness, StatusPillTone> = {
  never: 'muted',
  fresh: 'success',
  aging: 'warning',
  stale: 'danger',
};

const STALE_GUIDANCE =
  'Pillars and tone may be outdated. Rerun extraction from stored sources to refresh.';

export function extractionSourceFreshnessDisplay(
  source: ProfileExtractionSource,
  relativeExtractedAt: string | null
): ExtractionSourceFreshnessDisplay {
  const freshness = source.freshness ?? 'never';
  const failed = source.lastExtractionStatus === 'failed';

  const tone: StatusPillTone = failed ? 'danger' : FRESHNESS_TONE[freshness];
  const label = failed ? 'Failed' : FRESHNESS_LABEL[freshness];
  const tooltip = failed
    ? 'The last extraction run for this source failed. Rerun extraction to refresh pillars and tone.'
    : freshness === 'aging' || freshness === 'stale'
      ? STALE_GUIDANCE
      : freshness === 'never'
        ? 'This source has not been extracted yet.'
        : 'Recently extracted — pillars and tone reflect this source.';

  const extractedLine =
    freshness === 'never' || !relativeExtractedAt
      ? 'Never extracted'
      : `Last extracted ${relativeExtractedAt}`;

  return { label, tone, tooltip, extractedLine };
}
