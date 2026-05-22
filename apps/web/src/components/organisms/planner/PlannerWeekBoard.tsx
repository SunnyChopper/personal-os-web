import { todayISOLocal } from '@/lib/planner/week';
import type { PlannerProposedBlock, PlannerRolloverAction, PlannerWeek } from '@/types/planner';

import { PlannerDayColumn } from './PlannerDayColumn';

export interface PlannerWeekBoardProps {
  week: PlannerWeek;
  focusDate?: string;
  onSelectDay?: (date: string) => void;
  onToggleDayBlocked?: (date: string) => void;
  toggleBlockedPendingDate?: string | null;
  draftBlocks?: PlannerProposedBlock[];
  disableRealBlockDrag?: boolean;
  onDiscardDraft?: (tempId: string) => void;
  onRolloverAction?: (rolloverId: string, action: PlannerRolloverAction) => void;
  rolloverPendingId?: string | null;
  rolloverPendingAction?: PlannerRolloverAction | null;
}

export function PlannerWeekBoard({
  week,
  focusDate,
  onSelectDay,
  onToggleDayBlocked,
  toggleBlockedPendingDate,
  draftBlocks,
  disableRealBlockDrag,
  onDiscardDraft,
  onRolloverAction,
  rolloverPendingId,
  rolloverPendingAction,
}: PlannerWeekBoardProps) {
  const today = todayISOLocal();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible">
      {week.days.map((day) => (
        <PlannerDayColumn
          key={day.date}
          day={day}
          isFocused={focusDate === day.date}
          isToday={today === day.date}
          onSelect={onSelectDay}
          onToggleBlocked={onToggleDayBlocked}
          toggleBlockedPending={toggleBlockedPendingDate === day.date}
          draftBlocks={draftBlocks}
          disableRealBlockDrag={disableRealBlockDrag}
          onDiscardDraft={onDiscardDraft}
          onRolloverAction={onRolloverAction}
          rolloverPendingId={rolloverPendingId}
          rolloverPendingAction={rolloverPendingAction}
        />
      ))}
    </div>
  );
}
