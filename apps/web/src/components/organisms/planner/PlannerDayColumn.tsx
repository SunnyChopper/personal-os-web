import { useDroppable } from '@dnd-kit/core';

import type { PlannerDay } from '@/types/planner';

import { PlannerBlockCard } from './PlannerBlockCard';
import { PlannerCapacityMeter } from './PlannerCapacityMeter';

export interface PlannerDayColumnProps {
  day: PlannerDay;
}

export function PlannerDayColumn({ day }: PlannerDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.date}` });

  const border =
    day.capacityState === 'overloaded'
      ? 'border-red-400 dark:border-red-600'
      : day.capacityState === 'warning'
        ? 'border-amber-400 dark:border-amber-600'
        : 'border-gray-200 dark:border-gray-700';

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[140px] rounded-lg border-2 ${border} bg-gray-50/80 dark:bg-gray-900/40 p-2 ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="text-center mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
        </div>
        <div className="text-sm font-bold text-gray-900 dark:text-white">{day.date.slice(5)}</div>
      </div>
      <PlannerCapacityMeter
        loadRatio={day.loadRatio}
        capacityState={day.capacityState}
        scheduledPoints={day.scheduledStoryPoints}
        capacityPoints={day.capacityStoryPoints}
        className="mb-2"
      />
      <div className="flex-1 space-y-2 min-h-[120px]">
        {day.blocks.map((b) => (
          <PlannerBlockCard key={b.id} block={b} />
        ))}
      </div>
    </div>
  );
}
