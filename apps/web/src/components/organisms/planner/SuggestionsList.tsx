import { useMemo } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { PlanDaySuggestion } from '@/types/planner';

export interface SuggestionsListProps {
  suggestions: PlanDaySuggestion[];
  orderedIds: string[];
  capacityPoints: number;
  selectedIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  onReorder: (nextOrderedIds: string[]) => void;
}

function getCapacityBatteryPresentation(selectedPoints: number, capacityPoints: number) {
  const ratio = capacityPoints > 0 ? selectedPoints / capacityPoints : 0;
  const c = capacityPoints;

  if (selectedPoints <= 0.8 * c) {
    return {
      ratio,
      batteryColor: 'bg-teal-400 dark:bg-teal-500',
      statusText: 'Under-allocated',
      isOverloaded: false,
    };
  }
  if (selectedPoints <= c) {
    return {
      ratio,
      batteryColor: 'bg-emerald-500 dark:bg-emerald-400',
      statusText: 'Optimal Capacity',
      isOverloaded: false,
    };
  }
  if (selectedPoints <= 1.3 * c) {
    return {
      ratio,
      batteryColor: 'bg-amber-500',
      statusText: 'Over-allocated',
      isOverloaded: false,
    };
  }
  return {
    ratio,
    batteryColor: 'bg-red-500 dark:bg-red-600 animate-pulse',
    statusText: 'Schedule Cooked ⚠️',
    isOverloaded: true,
  };
}

function SortableRow({
  item,
  selected,
  onToggle,
}: {
  item: PlanDaySuggestion;
  selected: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.taskId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-950"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        aria-label="Reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <label className="flex flex-1 cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 accent-blue-600"
          checked={selected}
          onChange={onToggle}
        />
        <span className="flex-1">
          <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
          <span className="ml-2 rounded bg-gray-100 px-1.5 text-xs dark:bg-gray-800">
            {item.priority}
          </span>
          {item.contextMatch ? (
            <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              Fits today
            </span>
          ) : null}
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.reason}</p>
        </span>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
          {item.storyPoints} pts
        </span>
      </label>
    </li>
  );
}

export function SuggestionsList({
  suggestions,
  orderedIds,
  capacityPoints,
  selectedIds,
  onToggleTask,
  onReorder,
}: SuggestionsListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byId = useMemo(() => new Map(suggestions.map((s) => [s.taskId, s])), [suggestions]);
  const orderedSuggestions = orderedIds
    .map((id) => byId.get(id))
    .filter(Boolean) as PlanDaySuggestion[];

  const selectedPoints = orderedSuggestions.reduce(
    (sum, s) => sum + (selectedIds.has(s.taskId) ? s.storyPoints : 0),
    0
  );

  const { ratio, batteryColor, statusText, isOverloaded } = getCapacityBatteryPresentation(
    selectedPoints,
    capacityPoints
  );
  const fillPct = Math.min(ratio * 100, 100);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ordered = [...orderedIds];
    const oldIndex = ordered.indexOf(String(active.id));
    const newIndex = ordered.indexOf(String(over.id));
    if (oldIndex >= 0 && newIndex >= 0) {
      onReorder(arrayMove(ordered, oldIndex, newIndex));
    }
  };

  if (orderedSuggestions.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No sized backlog tasks available—add Fibonacci estimates to unblock planning.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-2 space-y-2">
        <div className="flex items-end justify-between text-sm">
          <span
            className={
              isOverloaded
                ? 'font-bold text-red-600 dark:text-red-400'
                : 'font-medium text-gray-600 dark:text-gray-300'
            }
          >
            {statusText}
          </span>
          <span className="tabular-nums font-semibold text-gray-900 dark:text-white">
            {selectedPoints.toFixed(1)} / ~{capacityPoints.toFixed(1)} pts
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={Math.round(fillPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Daily capacity: ${statusText}`}
        >
          <div
            className={`h-full transition-all duration-500 ease-out ${batteryColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {orderedSuggestions.map((s) => (
              <SortableRow
                key={s.taskId}
                item={s}
                selected={selectedIds.has(s.taskId)}
                onToggle={() => onToggleTask(s.taskId)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
