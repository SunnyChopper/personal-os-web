import { cn } from '@/lib/utils';

/** Card section intro title (h2 inside PageCard). */
export const pbSectionTitleClassName = 'text-lg font-semibold text-gray-900 dark:text-white';

/** Supporting copy under a section title. */
export const pbSectionDescriptionClassName = 'mt-1 text-sm text-gray-600 dark:text-gray-400';

/** Nested subsection title (h3) inside a card or list region. */
export const pbNestedSectionTitleClassName =
  'text-base font-semibold text-gray-900 dark:text-white';

/** Variant / queue card title. */
export const pbCardTitleClassName = 'text-base font-semibold text-gray-900 dark:text-white';

/** Form field and control group labels. */
export const pbFormLabelClassName = 'text-sm font-medium text-gray-700 dark:text-gray-300';

/** Uppercase micro-labels for inset panels and filter bars. */
export const pbEyebrowClassName =
  'text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400';

/** Timestamps, metadata, and compact secondary lines. */
export const pbMetaClassName = 'text-xs text-gray-500 dark:text-gray-400';

/** Secondary body copy. */
export const pbBodySecondaryClassName = 'text-sm text-gray-600 dark:text-gray-400';

/** Compact banner / status titles. */
export const pbBannerTitleClassName = 'text-sm font-semibold text-gray-900 dark:text-white';

/** Vertical rhythm: major blocks inside a PageCard. */
export const pbSectionStackClassName = 'space-y-6';

/** Vertical rhythm: field groups and form sections. */
export const pbFieldGroupStackClassName = 'space-y-4';

/** Vertical rhythm: card lists and variant stacks. */
export const pbListStackClassName = 'space-y-3';

/** Vertical rhythm: dense lists and nested panel content. */
export const pbDenseListStackClassName = 'space-y-2';

/** Base classes for small status / platform pills across Personal Branding. */
export const statusPillBaseClassName =
  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium';

export type StatusPillTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'muted';

const statusPillToneClassName: Record<StatusPillTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  muted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function statusPillClassName(tone: StatusPillTone, className?: string): string {
  return cn(statusPillBaseClassName, statusPillToneClassName[tone], className);
}

/** Toggle / option chip used in dialogs (platform pickers, relationship type, etc.). */
export function selectableChipClassName(
  selected: boolean,
  className?: string,
  disabled?: boolean
): string {
  return cn(
    'rounded-lg border px-3 py-2 text-sm font-medium transition',
    selected
      ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100'
      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
    disabled && 'pointer-events-none cursor-not-allowed opacity-50',
    className
  );
}

/** Inline text links (source URLs, profile links). */
export const linkAccentClassName =
  'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300';

/** Submodule tab active/inactive (used by SubModuleTabShell). */
export const tabActiveClassName =
  'border-blue-500/40 bg-blue-600/15 text-blue-900 dark:text-blue-100';

export const tabInactiveClassName =
  'border-transparent bg-transparent text-gray-600 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-gray-800/60';

export function formatPersonalBrandingDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPersonalBrandingDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
