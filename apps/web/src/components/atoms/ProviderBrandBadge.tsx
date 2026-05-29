import { formatProviderDisplay } from '@/components/settings/assistantMemoryIngestionDisplay';
import { cn } from '@/lib/utils';

const PROVIDER_BADGE_STYLES: Record<string, string> = {
  gemini:
    'border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-700/50 dark:bg-sky-950/50 dark:text-sky-200',
  openai:
    'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/45 dark:text-emerald-200',
  anthropic:
    'border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/45 dark:text-amber-100',
  groq: 'border-orange-200/80 bg-orange-50 text-orange-900 dark:border-orange-700/50 dark:bg-orange-950/40 dark:text-orange-100',
  deepseek:
    'border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-700/50 dark:bg-violet-950/45 dark:text-violet-200',
  cerebras:
    'border-cyan-200/80 bg-cyan-50 text-cyan-900 dark:border-cyan-700/50 dark:bg-cyan-950/45 dark:text-cyan-100',
  openrouter:
    'border-indigo-200/80 bg-indigo-50 text-indigo-800 dark:border-indigo-700/50 dark:bg-indigo-950/45 dark:text-indigo-200',
  xai: 'border-slate-300/80 bg-slate-100 text-slate-800 dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-200',
  grok: 'border-slate-300/80 bg-slate-100 text-slate-800 dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-200',
};

const DEFAULT_BADGE_STYLE =
  'border-gray-200/80 bg-gray-50 text-gray-700 dark:border-gray-600/50 dark:bg-gray-800/60 dark:text-gray-200';

const sizeClasses = {
  xs: 'px-1.5 py-0 text-[10px] leading-4',
  sm: 'px-2 py-0.5 text-[11px] leading-4',
};

export type ProviderBrandBadgeProps = {
  providerId: string;
  size?: 'xs' | 'sm';
  className?: string;
};

/** Subtle vendor label for multi-provider model matrices. */
export function ProviderBrandBadge({
  providerId,
  size = 'sm',
  className,
}: ProviderBrandBadgeProps) {
  const key = providerId.trim().toLowerCase();
  const label = formatProviderDisplay(providerId);
  if (!label) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border font-semibold tracking-tight',
        PROVIDER_BADGE_STYLES[key] ?? DEFAULT_BADGE_STYLE,
        sizeClasses[size],
        className
      )}
      title={label}
    >
      {label}
    </span>
  );
}
