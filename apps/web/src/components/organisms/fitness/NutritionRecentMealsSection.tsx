import { useCallback, useRef, useState } from 'react';
import { NutritionRecentMealCard } from '@/components/molecules/fitness/NutritionRecentMealCard';
import { useDeleteNutritionMutation } from '@/hooks/useFitness';
import { pushToastNotification, useToast } from '@/hooks/use-toast';
import {
  NUTRITION_RECENT_UNDO_MS,
  scheduleDeferredDelete,
  type DeferredDeleteHandle,
} from '@/lib/fitness/nutrition-recent-undo';
import type { NutritionEntry } from '@/types/fitness';

interface NutritionRecentMealsSectionProps {
  entries: NutritionEntry[];
  isLoading?: boolean;
}

export function NutritionRecentMealsSection({
  entries,
  isLoading = false,
}: NutritionRecentMealsSectionProps) {
  const { showToast } = useToast();
  const deleteMut = useDeleteNutritionMutation();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(() => new Set());
  const deferredHandlesRef = useRef<Map<string, DeferredDeleteHandle>>(new Map());

  const visibleEntries = entries.filter((entry) => !pendingDeleteIds.has(entry.id));

  const clearPendingDelete = useCallback((entryId: string) => {
    const handle = deferredHandlesRef.current.get(entryId);
    if (handle) {
      handle.cancel();
      deferredHandlesRef.current.delete(entryId);
    }
    setPendingDeleteIds((prev) => {
      if (!prev.has(entryId)) return prev;
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
  }, []);

  const handleRequestDelete = useCallback(
    (entry: NutritionEntry) => {
      if (pendingDeleteIds.has(entry.id)) return;

      setPendingDeleteIds((prev) => new Set(prev).add(entry.id));

      const handle = scheduleDeferredDelete(() => {
        deferredHandlesRef.current.delete(entry.id);
        deleteMut.mutateAsync(entry.id).catch(() => {
          clearPendingDelete(entry.id);
          pushToastNotification({
            type: 'error',
            title: 'Could not remove meal',
            message: 'The entry was restored. Try again.',
          });
        });
      }, NUTRITION_RECENT_UNDO_MS);

      deferredHandlesRef.current.set(entry.id, handle);

      showToast({
        type: 'success',
        title: 'Meal removed',
        duration: NUTRITION_RECENT_UNDO_MS,
        action: {
          label: 'Undo',
          onClick: () => clearPendingDelete(entry.id),
        },
      });
    },
    [clearPendingDelete, deleteMut, pendingDeleteIds, showToast]
  );

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Recent (14d)</h2>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {!isLoading && visibleEntries.length === 0 && (
        <p className="text-sm text-gray-500">No entries yet.</p>
      )}
      <ul className="space-y-2">
        {visibleEntries.map((entry) => (
          <NutritionRecentMealCard
            key={entry.id}
            entry={entry}
            onRequestDelete={handleRequestDelete}
          />
        ))}
      </ul>
    </section>
  );
}
