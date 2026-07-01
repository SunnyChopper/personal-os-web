import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, LayoutGrid, ListTodo } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { AutoScheduleActionBar } from '@/components/organisms/planner/AutoScheduleActionBar';
import { PlannerBacklogSheet } from '@/components/organisms/planner/PlannerBacklogSheet';
import { PlannerDayDrawer } from '@/components/organisms/planner/PlannerDayDrawer';
import { PlannerDraftBanner } from '@/components/organisms/planner/PlannerDraftBanner';
import { PlannerOneThingPanel } from '@/components/organisms/planner/PlannerOneThingPanel';
import { PlannerWeekBoard } from '@/components/organisms/planner/PlannerWeekBoard';
import { PlannerWeekBoardSkeleton } from '@/components/organisms/planner/PlannerWeekBoardSkeleton';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import {
  useCreateSchedulingException,
  useDeleteSchedulingException,
  usePatchPlannerBlock,
  usePlannerAutoScheduleCommit,
  usePlannerAutoSchedulePreview,
  usePlannerRolloverDecision,
  usePlannerWeek,
} from '@/hooks/usePlanner';
import { isPlannerDayBlocked, manualBlockingContextForDate } from '@/lib/planner/blocked-days';
import { isDraftBlockId } from '@/lib/planner/draft';
import {
  addDaysISO,
  mondayISO,
  mondayISOForDate,
  todayISOLocal,
  withCalendarDate,
} from '@/lib/planner/week';
import type { PlannerProposedBlock, PlannerRolloverAction } from '@/types/planner';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export default function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFocus = addDaysISO(todayISOLocal(), 1);
  const initialFocus = searchParams.get('date') ?? defaultFocus;

  const [focusDateISO, setFocusDateISO] = useState(initialFocus);
  const [weekStart, setWeekStart] = useState(() => mondayISOForDate(initialFocus));
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const [draftBlocks, setDraftBlocks] = useState<PlannerProposedBlock[] | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [toggleBlockedPendingDate, setToggleBlockedPendingDate] = useState<string | null>(null);

  const isDrafting = draftBlocks !== null;
  const { data: week, isLoading, error, refetch } = usePlannerWeek(weekStart);
  const preview = usePlannerAutoSchedulePreview(weekStart);
  const commit = usePlannerAutoScheduleCommit(weekStart);
  const patch = usePatchPlannerBlock(weekStart);
  const rolloverDecision = usePlannerRolloverDecision(weekStart, focusDateISO);
  const createSchedulingException = useCreateSchedulingException(weekStart);
  const deleteSchedulingException = useDeleteSchedulingException(weekStart);
  const { tasks } = useGrowthSystemDashboard();

  const todayISO = todayISOLocal();
  const todayRolloverCount = useMemo(() => {
    const row = week?.days.find((d) => d.date === todayISO);
    return row?.rolloverTasks?.length ?? 0;
  }, [week, todayISO]);

  const [rolloverPendingId, setRolloverPendingId] = useState<string | null>(null);
  const [rolloverPendingAction, setRolloverPendingAction] = useState<PlannerRolloverAction | null>(
    null
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const syncFocusDate = useCallback(
    (iso: string) => {
      setFocusDateISO(iso);
      setWeekStart(mondayISOForDate(iso));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('date', iso);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (searchParams.get('date')) return;
    if (todayRolloverCount > 0 && focusDateISO !== todayISO) {
      syncFocusDate(todayISO);
    }
  }, [todayRolloverCount, focusDateISO, todayISO, searchParams, syncFocusDate]);

  const handleRolloverAction = useCallback(
    (rolloverId: string, action: PlannerRolloverAction) => {
      setRolloverPendingId(rolloverId);
      setRolloverPendingAction(action);
      rolloverDecision.mutate(
        { rolloverId, action },
        {
          onSettled: () => {
            setRolloverPendingId(null);
            setRolloverPendingAction(null);
          },
        }
      );
    },
    [rolloverDecision]
  );

  const handleSelectDay = useCallback(
    (iso: string) => {
      syncFocusDate(iso);
      setIsDayDrawerOpen(true);
    },
    [syncFocusDate]
  );

  const handleToggleDayBlocked = useCallback(
    async (date: string) => {
      const day = week?.days.find((d) => d.date === date);
      if (!day) return;
      setToggleBlockedPendingDate(date);
      try {
        const manual = manualBlockingContextForDate(day, date);
        if (manual) {
          await deleteSchedulingException.mutateAsync(manual.id);
        } else {
          await createSchedulingException.mutateAsync({
            startDate: date,
            endDate: date,
            kind: 'outOfOffice',
          });
        }
      } catch (err) {
        setCommitError(err instanceof Error ? err.message : 'Failed to update day availability');
      } finally {
        setToggleBlockedPendingDate(null);
      }
    },
    [week, createSchedulingException, deleteSchedulingException]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const overId = String(over.id);
      if (!overId.startsWith('day-')) return;
      const newDate = overId.slice('day-'.length);
      const targetDay = week?.days.find((d) => d.date === newDate);
      if (targetDay && isPlannerDayBlocked(targetDay)) {
        setCommitError('Cannot schedule on an Out of Office / Trip day.');
        return;
      }
      const blockId = String(active.id);

      if (isDraftBlockId(blockId, draftBlocks)) {
        setDraftBlocks((prev) => {
          if (!prev) return prev;
          return prev.map((b) => {
            if (b.tempId !== blockId) return b;
            return {
              ...b,
              date: newDate,
              startAt: withCalendarDate(b.startAt, newDate),
              endAt: withCalendarDate(b.endAt, newDate),
            };
          });
        });
        return;
      }

      if (!week) return;
      const block = week.days.flatMap((d) => d.blocks).find((b) => b.id === blockId);
      if (!block) return;
      const startAt = withCalendarDate(block.startAt, newDate);
      const endAt = withCalendarDate(block.endAt, newDate);
      patch.mutate({ blockId, date: newDate, startAt, endAt });
    },
    [week, patch, draftBlocks]
  );

  const handleAutoSchedulePreview = useCallback(async () => {
    setCommitError(null);
    try {
      const res = await preview.mutateAsync();
      const blocked = new Set(res.blockedDates ?? []);
      setDraftBlocks(res.proposedBlocks.filter((b) => !blocked.has((b.date || '').slice(0, 10))));
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Auto-schedule preview failed');
    }
  }, [preview]);

  const handleCommitDraft = useCallback(async () => {
    if (!draftBlocks?.length) return;
    setCommitError(null);
    try {
      await commit.mutateAsync({ blocks: draftBlocks });
      setDraftBlocks(null);
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Failed to commit schedule');
    }
  }, [commit, draftBlocks]);

  const handleCancelDraft = useCallback(() => {
    setDraftBlocks(null);
    setCommitError(null);
  }, []);

  const handleDiscardDraftBlock = useCallback((tempId: string) => {
    setDraftBlocks((prev) => {
      if (!prev) return prev;
      const next = prev.filter((b) => b.tempId !== tempId);
      return next;
    });
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('date');
    if (fromUrl) {
      setFocusDateISO(fromUrl);
      setWeekStart(mondayISOForDate(fromUrl));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isDrafting) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDrafting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'b' && e.key !== 'B') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setIsBacklogOpen((prev) => !prev);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scheduledTaskIds = useMemo(() => {
    const ids = new Set<string>();
    week?.days.forEach((d) => d.blocks.forEach((b) => b.taskId && ids.add(b.taskId)));
    draftBlocks?.forEach((b) => b.taskId && ids.add(b.taskId));
    return ids;
  }, [week, draftBlocks]);

  const busy =
    preview.isPending ||
    commit.isPending ||
    patch.isPending ||
    createSchedulingException.isPending ||
    deleteSchedulingException.isPending;
  const navDisabled = isDrafting || busy;

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 p-4 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-400 ring-1 ring-white/10">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Planner</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <span>
                Week of {weekStart}
                {week?.timeZone ? ` · ${week.timeZone}` : ''}
              </span>
              {week?.velocity ? (
                <>
                  <span className="text-gray-600">|</span>
                  <span>
                    Daily Capacity:{' '}
                    <span className="font-medium text-gray-200">
                      {week.velocity.dailyCapacityStoryPoints}pts
                    </span>
                  </span>
                  <span className="text-gray-600">|</span>
                  <span>
                    Trailing Avg:{' '}
                    <span className="font-medium text-gray-200">
                      {week.velocity.trailingWeeklyAverageStoryPoints}pts
                    </span>
                  </span>
                  <span className="text-gray-600">|</span>
                  <span>
                    Burn Rate:{' '}
                    <span className="font-medium text-gray-200">{week.velocity.dailyBurnRate}</span>
                  </span>
                  <span className="text-gray-600">|</span>
                  <span>
                    Confidence:{' '}
                    <span className="font-medium capitalize text-gray-200">
                      {week.velocity.confidence}
                    </span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            disabled={navDisabled}
            onClick={() => setWeekStart((ws) => addDaysISO(ws, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
            disabled={navDisabled}
            onClick={() => {
              const mon = mondayISO(new Date());
              setWeekStart(mon);
              syncFocusDate(addDaysISO(todayISOLocal(), 1));
            }}
          >
            This week
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            disabled={navDisabled}
            onClick={() => setWeekStart((ws) => addDaysISO(ws, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <PlannerOneThingPanel onSaved={() => void refetch()} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AutoScheduleActionBar
          isBusy={busy || isDrafting}
          onAutoSchedule={() => void handleAutoSchedulePreview()}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            disabled={navDisabled}
            onClick={() => setIsBacklogOpen((prev) => !prev)}
            aria-expanded={isBacklogOpen}
            aria-controls="planner-backlog-sheet"
          >
            <ListTodo className="h-4 w-4" />
            {isBacklogOpen ? 'Close backlog' : 'Open backlog'}
            <kbd className="ml-1 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              B
            </kbd>
          </button>
          <button
            type="button"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:pointer-events-none"
            disabled={navDisabled}
            onClick={() => void refetch()}
          >
            Refresh week
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          Failed to load planner: {(error as Error).message}
        </div>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Week board
            </h2>
            <p className="text-xs text-gray-500">Click a day to open planning details</p>
          </div>

          {isLoading && !week ? <PlannerWeekBoardSkeleton /> : null}

          {week ? (
            <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/50 to-gray-950/80 p-3 shadow-inner">
              {isDrafting && draftBlocks ? (
                <PlannerDraftBanner
                  draftBlocks={draftBlocks}
                  isCommitting={commit.isPending}
                  commitError={commitError}
                  onCommit={() => void handleCommitDraft()}
                  onCancel={handleCancelDraft}
                />
              ) : null}
              <PlannerWeekBoard
                week={week}
                focusDate={focusDateISO}
                onSelectDay={handleSelectDay}
                onToggleDayBlocked={(date) => void handleToggleDayBlocked(date)}
                toggleBlockedPendingDate={toggleBlockedPendingDate}
                draftBlocks={draftBlocks ?? undefined}
                disableRealBlockDrag={isDrafting}
                onDiscardDraft={handleDiscardDraftBlock}
                onRolloverAction={handleRolloverAction}
                rolloverPendingId={rolloverPendingId}
                rolloverPendingAction={rolloverPendingAction}
              />
            </div>
          ) : null}
        </div>

        <PlannerBacklogSheet
          open={isBacklogOpen}
          onClose={() => setIsBacklogOpen(false)}
          tasks={tasks}
          scheduledTaskIds={scheduledTaskIds}
        />
      </DndContext>

      <PlannerDayDrawer
        open={isDayDrawerOpen}
        focusDateISO={focusDateISO}
        onClose={() => setIsDayDrawerOpen(false)}
        onFocusDateChange={syncFocusDate}
        onCommitted={() => void refetch()}
      />
    </div>
  );
}
