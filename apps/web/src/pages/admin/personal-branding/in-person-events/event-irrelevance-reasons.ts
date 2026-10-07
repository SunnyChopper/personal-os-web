import type { InPersonEventIrrelevanceReason } from '@/types/api/personal-branding.dto';

export const EVENT_IRRELEVANCE_REASON_OPTIONS: ReadonlyArray<{
  id: InPersonEventIrrelevanceReason;
  label: string;
}> = [
  { id: 'offBrand', label: 'Off-brand' },
  { id: 'wrongLocation', label: 'Wrong location' },
  { id: 'wrongDate', label: 'Wrong dates' },
  { id: 'tooExpensive', label: 'Too expensive' },
  { id: 'virtualOnly', label: 'Virtual only' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'other', label: 'Other' },
];
