import { useEffect, useRef, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import type {
  CreatorConnection,
  UpdateCreatorConnectionInput,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import {
  ROLODEX_CADENCE_PRESETS,
  computeDefaultNextFollowUpDate,
  followUpDateInputToIso,
  formatCadenceLabel,
  isFollowUpOverdue,
  toFollowUpDateInputValue,
} from './rolodex-platform';
import { selectableChipClassName } from '../personal-branding-ui';

interface FollowUpQuickEditorProps {
  connection: CreatorConnection;
  onSave: (body: UpdateCreatorConnectionInput) => Promise<void>;
  isSaving?: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
  variant?: 'table' | 'inline';
}

function formatFollowUpDisplay(value?: string | null): string {
  if (!value) return 'Not scheduled';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

export default function FollowUpQuickEditor({
  connection,
  onSave,
  isSaving = false,
  triggerClassName,
  triggerLabel,
  variant = 'table',
}: FollowUpQuickEditorProps) {
  const [open, setOpen] = useState(false);
  const [cadenceDays, setCadenceDays] = useState('');
  const [nextDate, setNextDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const overdue = isFollowUpOverdue(connection.nextFollowUpAt);
  const cadenceLabel = formatCadenceLabel(connection.followUpCadenceDays);

  useEffect(() => {
    if (!open) return;
    setCadenceDays(
      connection.followUpCadenceDays != null ? String(connection.followUpCadenceDays) : ''
    );
    setNextDate(
      toFollowUpDateInputValue(connection.nextFollowUpAt) ||
        computeDefaultNextFollowUpDate(connection.followUpCadenceDays)
    );
  }, [open, connection]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCadenceSelect = (days: number) => {
    setCadenceDays(String(days));
    setNextDate(computeDefaultNextFollowUpDate(days));
  };

  const handleSave = async () => {
    const parsed = cadenceDays.trim() ? Number.parseInt(cadenceDays, 10) : null;
    const cadence = parsed != null && !Number.isNaN(parsed) ? parsed : null;
    await onSave({
      followUpCadenceDays: cadence,
      nextFollowUpAt: followUpDateInputToIso(nextDate),
    });
    setOpen(false);
  };

  const displayLabel = triggerLabel ?? formatFollowUpDisplay(connection.nextFollowUpAt);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
          overdue ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-200',
          variant === 'inline' && 'text-xs text-gray-500 dark:text-gray-400',
          triggerClassName
        )}
        aria-expanded={open}
        aria-label={`Set follow-up for ${connection.name}`}
      >
        {variant === 'inline' ? <CalendarClock className="size-3.5 shrink-0" /> : null}
        <span
          className={variant === 'table' ? 'underline decoration-dotted underline-offset-2' : ''}
        >
          {displayLabel}
        </span>
        {variant === 'table' ? <CalendarClock className="size-3.5 shrink-0 opacity-60" /> : null}
      </button>

      {open ? (
        <div className="absolute left-0 z-30 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Follow-up schedule</p>
          {cadenceLabel ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Current cadence: {cadenceLabel}
            </p>
          ) : null}

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Cadence (days)
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ROLODEX_CADENCE_PRESETS.map((preset) => {
                const selected = cadenceDays === String(preset.days);
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => handleCadenceSelect(preset.days)}
                    className={cn(
                      selectableChipClassName(selected),
                      'rounded-full px-2.5 py-1 text-xs'
                    )}
                    aria-pressed={selected}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <FormInput
              type="number"
              min={1}
              max={365}
              value={cadenceDays}
              onChange={(event) => {
                const value = event.target.value;
                setCadenceDays(value);
                const parsed = Number.parseInt(value, 10);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  setNextDate(computeDefaultNextFollowUpDate(parsed));
                }
              }}
              placeholder="Custom days"
            />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Next follow-up
            </label>
            <FormInput
              type="date"
              value={nextDate}
              onChange={(event) => setNextDate(event.target.value)}
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
