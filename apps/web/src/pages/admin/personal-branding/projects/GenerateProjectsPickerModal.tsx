import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import Dialog from '@/components/molecules/Dialog';
import { useSignalRadarItems } from '@/hooks/useSignalRadar';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import { cn } from '@/lib/utils';
import {
  MAX_PROJECT_RADAR_SELECTION,
  precheckedRadarItemIds,
  todaysRadarItems,
  toggleProjectRadarSelection,
} from './generate-projects-picker';

const RADAR_PICKER_FILTERS = { page: 1, pageSize: 50 } as const;

function formatRelevanceLabel(score?: number | null): string {
  if (typeof score !== 'number') return 'No score';
  return `${Math.round(score * 100)}% relevant`;
}

export default function GenerateProjectsPickerModal({
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (radarItemIds: string[]) => void;
}) {
  const { items } = useSignalRadarItems(RADAR_PICKER_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const seededRef = useRef(false);

  const todayItems = useMemo(
    () => todaysRadarItems(items.data?.data ?? []),
    [items.data]
  );

  useEffect(() => {
    if (!open) {
      seededRef.current = false;
      return;
    }
    if (seededRef.current || items.isPending || items.isError || !items.data) return;
    setSelectedIds(precheckedRadarItemIds(items.data.data ?? []));
    seededRef.current = true;
  }, [open, items.isPending, items.isError, items.data]);

  const selectionAtCap = selectedIds.length >= MAX_PROJECT_RADAR_SELECTION;
  const visibleIds = todayItems.slice(0, MAX_PROJECT_RADAR_SELECTION).map((item) => item.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visible = new Set(visibleIds);
      setSelectedIds((current) => current.filter((id) => !visible.has(id)));
      return;
    }
    setSelectedIds(visibleIds);
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0 || isSubmitting || items.isPending) return;
    onConfirm(selectedIds);
  };

  const listError =
    items.isError && items.error instanceof Error
      ? items.error.message
      : items.isError
        ? 'Could not load trend cards.'
        : null;

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title="Choose trend cards"
      size="lg"
      trapFocus
      stickySubheader={
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200 bg-sky-50 px-6 py-3 dark:border-sky-900/50 dark:bg-sky-950/40">
          <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
            {selectedIds.length} card{selectedIds.length === 1 ? '' : 's'} selected
            {selectionAtCap ? ` (max ${MAX_PROJECT_RADAR_SELECTION})` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {todayItems.length > 0 ? (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FormCheckbox checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                Select visible (up to {MAX_PROJECT_RADAR_SELECTION})
              </label>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0 || isSubmitting || items.isPending}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Today&apos;s radar signals. Confirm uses the checked cards, up to{' '}
        {MAX_PROJECT_RADAR_SELECTION}.
      </p>
      {items.isPending ? (
        <div className="mt-4 flex min-h-[160px] items-center justify-center text-gray-500">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading trend cards…
        </div>
      ) : listError ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">
          {listError}
        </p>
      ) : todayItems.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          No trend cards from today.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {todayItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <li key={item.id}>
                <article
                  className={cn(
                    gridItemCardClassName,
                    'flex items-start gap-3',
                    selected && 'ring-2 ring-sky-500/70 dark:ring-sky-400/60'
                  )}
                >
                  <FormCheckbox
                    checked={selected}
                    onChange={() =>
                      setSelectedIds((current) => toggleProjectRadarSelection(current, item.id))
                    }
                    disabled={!selected && selectionAtCap}
                    aria-label={`Select ${item.title}`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    {item.sourceName ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.sourceName}
                      </p>
                    ) : null}
                    {item.summary ? (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {item.summary}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-medium text-violet-800 dark:text-violet-200">
                      {formatRelevanceLabel(item.aiRelevanceScore)}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
