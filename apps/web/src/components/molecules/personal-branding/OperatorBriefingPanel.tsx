import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import type { OperatorBriefing } from '@/types/api/personal-branding.dto';

export interface OperatorBriefingPanelProps {
  briefing?: OperatorBriefing | null;
  isSaving?: boolean;
  onSaveToVault?: () => void;
}

export default function OperatorBriefingPanel({
  briefing,
  isSaving = false,
  onSaveToVault,
}: OperatorBriefingPanelProps) {
  const [open, setOpen] = useState(true);
  const markdown = briefing?.markdown?.trim();
  if (!markdown) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/40">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium',
          'text-gray-700 dark:text-gray-200'
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
        )}
        Operator briefing
        <span className="font-normal text-gray-500 dark:text-gray-400">(for you — not sent)</span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {markdown}
          </pre>
          {briefing?.vaultItemId ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Saved to Vault.</p>
          ) : onSaveToVault ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onClick={onSaveToVault}
            >
              {isSaving ? 'Saving…' : 'Save to Vault'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
