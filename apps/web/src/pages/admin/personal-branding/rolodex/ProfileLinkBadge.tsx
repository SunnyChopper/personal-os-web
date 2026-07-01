import { ExternalLink } from 'lucide-react';
import type { CreatorConnection } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { getPlatformOption, getProfileDisplay } from './rolodex-platform';

interface ProfileLinkBadgeProps {
  connection: CreatorConnection;
  className?: string;
  showExternalIcon?: boolean;
}

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  linkedin:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800',
  x: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
  youtube:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800',
  instagram:
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-200 dark:border-fuchsia-800',
  medium:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
  newsletter:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
  custom:
    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
};

export default function ProfileLinkBadge({
  connection,
  className,
  showExternalIcon = true,
}: ProfileLinkBadgeProps) {
  const display = getProfileDisplay(connection);
  const platform = getPlatformOption(display.platformId);
  const Icon = platform?.icon;

  if (!display.url) {
    return <span className="text-sm text-gray-500">—</span>;
  }

  const badgeStyle =
    (display.platformId && PLATFORM_BADGE_STYLES[display.platformId]) ||
    PLATFORM_BADGE_STYLES.custom;

  return (
    <a
      href={display.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-90',
        badgeStyle,
        className
      )}
      title={display.url}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
      <span className="truncate">{display.label}</span>
      {showExternalIcon ? (
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      ) : null}
    </a>
  );
}
