import { useDroppable } from '@dnd-kit/core';

import {
  blockingLabel,
  blockingOverlayEmoji,
  isPlannerDayBlocked,
} from '@/lib/planner/blocked-days';
import { proposedBlockToPlannerBlock } from '@/lib/planner/draft';
import type { PlannerDay, PlannerProposedBlock, PlannerRolloverAction } from '@/types/planner';

import { PlannerBlockCard } from './PlannerBlockCard';
import { PlannerCapacityMeter } from './PlannerCapacityMeter';
import { RolloverTaskCard } from './RolloverTaskCard';

export interface PlannerDayColumnProps {
  day: PlannerDay;
  isFocused?: boolean;
  isToday?: boolean;
  onSelect?: (date: string) => void;
  onToggleBlocked?: (date: string) => void;
  toggleBlockedPending?: boolean;
  draftBlocks?: PlannerProposedBlock[];
  disableRealBlockDrag?: boolean;
  onDiscardDraft?: (tempId: string) => void;
  onRolloverAction?: (rolloverId: string, action: PlannerRolloverAction) => void;
  rolloverPendingId?: string | null;
  rolloverPendingAction?: PlannerRolloverAction | null;
}

export function PlannerDayColumn({
  day,
  isFocused,
  isToday,
  onSelect,
  onToggleBlocked,
  toggleBlockedPending,
  draftBlocks,
  disableRealBlockDrag,
  onDiscardDraft,
  onRolloverAction,
  rolloverPendingId,
  rolloverPendingAction,
}: PlannerDayColumnProps) {
  const blocked = isPlannerDayBlocked(day);
  const rollovers = day.rolloverTasks ?? [];
  const dayDrafts = (draftBlocks ?? []).filter((b) => b.date === day.date);
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.date}`,
    disabled: blocked,
  });

  const border = blocked
    ? 'border-slate-500/50'
    : day.capacityState === 'overloaded'
      ? 'border-red-400/70 dark:border-red-600'
      : day.capacityState === 'warning'
        ? 'border-amber-400/70 dark:border-amber-600'
        : isFocused
          ? 'border-blue-500'
          : 'border-white/10';

  const handleBodyClick = () => onSelect?.(day.date);

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBlocked?.(day.date);
  };

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={handleBodyClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBodyClick();
        }
      }}
      className={`relative flex min-h-[200px] w-full min-w-[120px] flex-1 cursor-pointer flex-col rounded-xl border-2 p-2 text-left transition lg:min-w-0 ${
        blocked ? 'bg-slate-900/70' : 'bg-gray-900/40'
      } ${isFocused ? 'ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' : ''} ${
        isToday && !isFocused ? 'ring-1 ring-white/20' : ''
      } ${border} ${!blocked && isOver ? 'ring-2 ring-blue-400' : ''} ${
        !blocked ? 'hover:border-white/20' : ''
      }`}
    >
      {blocked ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/45"
          aria-hidden
        >
          <span className="rounded-md bg-slate-800/90 px-2 py-1 text-[10px] font-medium text-slate-200">
            {blockingLabel(day)} {blockingOverlayEmoji(day)}
          </span>
        </div>
      ) : null}

      <button
        type="button"
        className="relative z-20 mb-2 w-full rounded-md text-center transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
        onClick={handleHeaderClick}
        disabled={toggleBlockedPending || !onToggleBlocked}
        title={
          blocked
            ? 'Click to clear Out of Office / Trip for this day'
            : 'Mark this day Out of Office / Trip'
        }
        aria-pressed={blocked}
        aria-label={`${blocked ? 'Unblock' : 'Block'} ${day.date}`}
      >
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
        {blocked ? (
          <span className="mt-1 inline-block text-[9px] font-medium text-slate-400">
            Tap header to unblock
          </span>
        ) : null}
      </button>

      <PlannerCapacityMeter
        loadRatio={day.loadRatio}
        capacityState={day.capacityState}
        scheduledPoints={day.scheduledStoryPoints}
        capacityPoints={day.capacityStoryPoints}
        className="relative z-0 mb-2"
      />
      <div className="relative z-0 min-h-[120px] flex-1 space-y-2">
        {rollovers.map((r) => (
          <RolloverTaskCard
            key={r.rolloverId}
            task={r}
            disabled={!onRolloverAction || blocked}
            pendingAction={
              rolloverPendingId === r.rolloverId ? (rolloverPendingAction ?? null) : null
            }
            onAction={(id, action) => onRolloverAction?.(id, action)}
          />
        ))}
        {day.blocks.map((b) => (
          <PlannerBlockCard key={b.id} block={b} disabled={disableRealBlockDrag || blocked} />
        ))}
        {dayDrafts.map((draft) => (
          <PlannerBlockCard
            key={draft.tempId}
            block={proposedBlockToPlannerBlock(draft)}
            isDraft
            onDiscardDraft={onDiscardDraft}
          />
        ))}
      </div>
    </div>
  );
}
