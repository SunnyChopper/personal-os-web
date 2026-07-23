import type { RadarUserIrrelevanceReason } from '@/types/api/personal-branding.dto';

export const RADAR_IRRELEVANCE_REASON_OPTIONS: ReadonlyArray<{
  value: RadarUserIrrelevanceReason;
  label: string;
}> = [
  { value: 'offBrand', label: 'Off-brand' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'tooBasic', label: 'Too basic' },
  { value: 'outdated', label: 'Outdated' },
  { value: 'wrongAudience', label: 'Wrong audience' },
  { value: 'other', label: 'Other' },
];
