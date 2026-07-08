import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CopyIconButtonProps = {
  value: string;
  ariaLabel?: string;
  className?: string;
  /** When true, button stays visible instead of only on hover. */
  alwaysVisible?: boolean;
};

export default function CopyIconButton({
  value,
  ariaLabel = 'Copy to clipboard',
  className,
  alwaysVisible = false,
}: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === '—') return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void handleCopy();
      }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded p-1 transition-opacity',
        'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700/50',
        'focus:outline-none focus:ring-1 focus:ring-gray-400',
        !alwaysVisible && 'opacity-0 group-hover:opacity-100 focus:opacity-100',
        className
      )}
      aria-label={copied ? 'Copied' : ariaLabel}
      disabled={!value || value === '—'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}
