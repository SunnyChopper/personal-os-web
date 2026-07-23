import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type InsetPanelPadding = 'compact' | 'standard';
export type InsetPanelTone = 'neutral' | 'emerald';

const insetPanelPaddingClassName: Record<InsetPanelPadding, string> = {
  compact: 'p-3',
  standard: 'p-4',
};

const insetPanelToneClassName: Record<InsetPanelTone, string> = {
  neutral: 'border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/40',
  emerald: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20',
};

interface InsetPanelProps {
  children: ReactNode;
  className?: string;
  padding?: InsetPanelPadding;
  tone?: InsetPanelTone;
}

export function InsetPanel({
  children,
  className,
  padding = 'compact',
  tone = 'neutral',
}: InsetPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        insetPanelPaddingClassName[padding],
        insetPanelToneClassName[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
