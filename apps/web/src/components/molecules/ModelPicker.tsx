import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Gauge, Sparkles, Zap } from 'lucide-react';
import { ProviderBrandBadge } from '@/components/atoms/ProviderBrandBadge';
import { formatModelDisplayLabel } from '@/lib/settings/assistantMemoryIngestionDisplay';
import { cn } from '@/lib/utils';
import type { AssistantModelCatalogEntry } from '@/types/chatbot';

export type ModelPickerProps = {
  models: AssistantModelCatalogEntry[];
  valueApiModelId: string;
  onChange: (apiModelId: string) => void;
  disabled?: boolean;
  /** Show color-coded provider badge beside model names (multi-provider matrices). */
  showProviderBadge?: boolean;
  emptyMessage?: string;
};

function modelTitle(entry: AssistantModelCatalogEntry, showProviderBadge: boolean): string {
  return showProviderBadge ? formatModelDisplayLabel(entry.label, entry.provider) : entry.label;
}

function ModelPickerRow({
  entry,
  showProviderBadge,
}: {
  entry: AssistantModelCatalogEntry;
  showProviderBadge: boolean;
}) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        {showProviderBadge ? <ProviderBrandBadge providerId={entry.provider} size="xs" /> : null}
        <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">
          {modelTitle(entry, showProviderBadge)}
        </span>
      </div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
        Quality {entry.qualityScore} · Speed {entry.speedScore} · Cost {entry.costScore}
        {entry.contextTokens ? ` · ${(entry.contextTokens / 1000).toFixed(0)}k ctx` : ''}
      </div>
      {entry.bestFor?.length ? (
        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          {entry.bestFor.slice(0, 3).join(' · ')}
        </div>
      ) : null}
    </>
  );
}

export function ModelPicker({
  models,
  valueApiModelId,
  onChange,
  disabled,
  showProviderBadge = false,
  emptyMessage = 'No models in catalog for this provider.',
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected =
    models.find((m) => m.apiModelId === valueApiModelId) ??
    (showProviderBadge ? undefined : models[0]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!models.length) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 px-3 py-2">
        {emptyMessage}
      </p>
    );
  }

  const displayEntry = selected ?? models[0];
  const displayTitle = displayEntry ? modelTitle(displayEntry, showProviderBadge) : valueApiModelId;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-left text-sm',
          'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {showProviderBadge && displayEntry ? (
              <ProviderBrandBadge providerId={displayEntry.provider} size="xs" />
            ) : null}
            <span className="font-medium truncate">{displayTitle}</span>
          </div>
          {displayEntry ? (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="inline-flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />
                Quality {displayEntry.qualityScore}/10
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Zap className="w-3 h-3" />
                Speed {displayEntry.speedScore}/10
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Gauge className="w-3 h-3" />
                Cost {displayEntry.costScore}/10
              </span>
              {displayEntry.contextTokens ? (
                <span>{(displayEntry.contextTokens / 1000).toFixed(0)}k ctx</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <ChevronDown className={cn('w-4 h-4 shrink-0 opacity-60', open && 'rotate-180')} />
      </button>
      {open ? (
        <div
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg"
          role="listbox"
        >
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={m.apiModelId === valueApiModelId}
              onClick={() => {
                onChange(m.apiModelId);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0',
                'hover:bg-gray-50 dark:hover:bg-gray-800/80',
                m.apiModelId === valueApiModelId && 'bg-blue-50 dark:bg-blue-950/40'
              )}
            >
              <ModelPickerRow entry={m} showProviderBadge={showProviderBadge} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
