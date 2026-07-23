import type {
  PlatformRuleCatalogEntry,
  RhetoricalStrength,
} from '@/types/api/personal-branding.dto';

export const RHETORICAL_STRENGTH_LABELS: Record<RhetoricalStrength, string> = {
  subtle: 'Subtle',
  light: 'Light',
  moderate: 'Moderate',
  strong: 'Strong',
  dominant: 'Dominant',
};

/** Split free-text requirements into scannable lines; strips common bullet prefixes. */
export function parseRequirementLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

export function labelFromCatalog(
  entries: PlatformRuleCatalogEntry[] | undefined,
  id: string
): string {
  const match = entries?.find((entry) => entry.id === id);
  if (match?.label) return match.label;
  return humanizeCatalogId(id);
}

/** Fallback when catalog is unavailable: rhetoricalQuestion → Rhetorical Question */
export function humanizeCatalogId(id: string): string {
  const spaced = id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Collapsed-section summary for rhetorical mode/device pickers. */
export function formatRhetoricalSelectionSummary(
  selectedIds: string[],
  catalog: PlatformRuleCatalogEntry[] | undefined,
  maxLabels = 3
): string {
  if (selectedIds.length === 0) return 'None selected';

  const labels = selectedIds.map((id) => labelFromCatalog(catalog, id)).slice(0, maxLabels);
  const remaining = selectedIds.length - labels.length;
  if (remaining > 0) {
    return `${labels.join(' · ')} +${remaining}`;
  }
  return labels.join(' · ');
}
