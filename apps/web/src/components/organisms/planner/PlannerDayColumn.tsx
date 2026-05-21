import { useDroppable } from '@dnd-kit/core';

import type { PlannerDay } from '@/types/planner';

import { PlannerBlockCard } from './PlannerBlockCard';
import { PlannerCapacityMeter } from './PlannerCapacityMeter';

export interface PlannerDayColumnProps {
  day: PlannerDay;
  isFocused?: boolean;
  isToday?: boolean;
  onSelect?: (date: string) => void;
}

export function PlannerDayColumn({ day, isFocused, isToday, onSelect }: PlannerDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.date}` });

  const border =
    day.capacityState === 'overloaded'
      ? 'border-red-400/70 dark:border-red-600'
      : day.capacityState === 'warning'
        ? 'border-amber-400/70 dark:border-amber-600'
        : isFocused
          ? 'border-blue-500'
          : 'border-white/10';

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(day.date)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(day.date);
        }
      }}
      className={`flex min-w-[148px] cursor-pointer flex-col rounded-xl border-2 bg-gray-900/40 p-2 text-left transition ${
        isFocused ? 'ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' : ''
      } ${isToday && !isFocused ? 'ring-1 ring-white/20' : ''} ${border} ${
        isOver ? 'ring-2 ring-blue-400' : 'hover:border-white/20'
      }`}
    >
      <div className="mb-2 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
        </div>
        <div className={`text-sm font-bold ${isFocused ? 'text-blue-300' : 'text-white'}`}>
          {day.date.slice(5)}
        </div>
        {isToday ? (
          <span className="mt-0.5 inline-block rounded-full bg-blue-500/20 px-1.5 text-[9px] font-medium text-blue-300">
            Today
          </span>
        ) : null}
      </div>
      <PlannerCapacityMeter
        loadRatio={day.loadRatio}
        capacityState={day.capacityState}
        scheduledPoints={day.scheduledStoryPoints}
        capacityPoints={day.capacityStoryPoints}
        className="mb-2"
      />
      <div className="min-h-[120px] flex-1 space-y-2">
        {day.blocks.map((b) => (
          <PlannerBlockCard key={b.id} block={b} />
        ))}
      </div>
    </div>
  );
}
