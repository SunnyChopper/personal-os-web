import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { cn } from '@/lib/utils';
import { fromLocalDateTimeString, toLocalDateTimeString } from '@/utils/date-formatters';
import {
  PUBLISH_SCHEDULE_PRESETS,
  presetToLocalDateTimeString,
  type PublishSchedulePresetId,
} from '@/pages/admin/personal-branding/content-pipeline/publish-schedule-presets';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

export type PublishScheduleQuickEditorProps = {
  scheduledPublishAt?: string | null;
  onSave: (iso: string) => Promise<void>;
  onClear?: () => Promise<void>;
  isSaving?: boolean;
  triggerLabel?: string;
  triggerVariant?: 'secondary' | 'primary';
  className?: string;
};

export function PublishScheduleQuickEditor({
  scheduledPublishAt,
  onSave,
  onClear,
  isSaving = false,
  triggerLabel,
  triggerVariant = 'secondary',
  className,
}: PublishScheduleQuickEditorProps) {
  const [open, setOpen] = useState(false);
  const [draftTime, setDraftTime] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<PublishSchedulePresetId | null>(null);
  const [panelRect, setPanelRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const initial =
      toLocalDateTimeString(scheduledPublishAt) || presetToLocalDateTimeString('in_1_hour');
    setDraftTime(initial);
    setSelectedPresetId(null);
  }, [open, scheduledPublishAt]);

  const updatePanelRect = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const panelWidth = 320;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const left = Math.min(Math.max(margin, rect.left), viewportWidth - panelWidth - margin);
    setPanelRect({
      top: rect.bottom + margin,
      left,
      width: panelWidth,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPanelRect(null);
      return;
    }
    updatePanelRect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleReposition = () => updatePanelRect();
    window.addEventListener('resize', handleReposition);
    window.visualViewport?.addEventListener('resize', handleReposition);
    window.visualViewport?.addEventListener('scroll', handleReposition);
    document.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.visualViewport?.removeEventListener('resize', handleReposition);
      window.visualViewport?.removeEventListener('scroll', handleReposition);
      document.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handlePresetSelect = (presetId: PublishSchedulePresetId) => {
    setSelectedPresetId(presetId);
    setDraftTime(presetToLocalDateTimeString(presetId));
  };

  const handleSave = async () => {
    if (!draftTime) return;
    await onSave(fromLocalDateTimeString(draftTime));
    setOpen(false);
  };

  const handleClear = async () => {
    if (!onClear) return;
    await onClear();
    setOpen(false);
  };

  const resolvedTriggerLabel = triggerLabel ?? (scheduledPublishAt ? 'Change time' : 'Set time');

  const panelStyle: CSSProperties | null =
    open && panelRect
      ? {
          position: 'fixed',
          top: panelRect.top,
          left: panelRect.left,
          width: panelRect.width,
          zIndex: 100,
        }
      : null;

  const panelContent = (
    <div
      ref={panelRef}
      style={panelStyle ?? undefined}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
        <p className="text-sm font-medium text-gray-900 dark:text-white">Publish time</p>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Pick a quick option or set an exact date and time.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PUBLISH_SCHEDULE_PRESETS.map((preset) => {
          const selected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={cn(selectableChipClassName(selected), 'rounded-full px-2.5 py-1 text-xs')}
              aria-pressed={selected}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
          Exact time
        </label>
        <FormInput
          type="datetime-local"
          value={draftTime}
          onChange={(event) => {
            setSelectedPresetId(null);
            setDraftTime(event.target.value);
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {onClear && scheduledPublishAt ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isSaving}
            onClick={() => void handleClear()}
          >
            Clear time
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isSaving || !draftTime}
          onClick={() => void handleSave()}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant={triggerVariant}
        disabled={isSaving}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {resolvedTriggerLabel}
      </Button>

      {open && panelRect && panelStyle && typeof document !== 'undefined'
        ? createPortal(panelContent, document.body)
        : null}
    </div>
  );
}
