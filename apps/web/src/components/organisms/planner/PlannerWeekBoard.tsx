import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';

import { withCalendarDate } from '@/lib/planner/week';
import type { PlannerWeek } from '@/types/planner';

import { PlannerDayColumn } from './PlannerDayColumn';

export interface PlannerWeekBoardProps {
  week: PlannerWeek;
  onMoveBlock: (args: { blockId: string; date: string; startAt: string; endAt: string }) => void;
}

export function PlannerWeekBoard({ week, onMoveBlock }: PlannerWeekBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('day-')) return;
    const newDate = overId.slice('day-'.length);
    const blockId = String(active.id);
    const block = week.days.flatMap((d) => d.blocks).find((b) => b.id === blockId);
    if (!block) return;
    const startAt = withCalendarDate(block.startAt, newDate);
    const endAt = withCalendarDate(block.endAt, newDate);
    onMoveBlock({ blockId, date: newDate, startAt, endAt });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {week.days.map((day) => (
          <PlannerDayColumn key={day.date} day={day} />
        ))}
      </div>
    </DndContext>
  );
}
