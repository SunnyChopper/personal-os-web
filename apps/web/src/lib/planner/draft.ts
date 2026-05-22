import type { PlannerBlock, PlannerProposedBlock } from '@/types/planner';

/** Project a preview proposal into a PlannerBlock shape for card rendering / DnD. */
export function proposedBlockToPlannerBlock(proposed: PlannerProposedBlock): PlannerBlock {
  const startMs = new Date(proposed.startAt).getTime();
  const endMs = new Date(proposed.endAt).getTime();
  const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
  return {
    id: proposed.tempId,
    date: proposed.date,
    startAt: proposed.startAt,
    endAt: proposed.endAt,
    durationMinutes,
    taskId: proposed.taskId,
    taskTitleSnapshot: proposed.taskTitleSnapshot,
    source: 'auto',
    status: 'planned',
    storyPointsLoad: proposed.storyPointsLoad,
    calendarEventId: null,
    microStepId: null,
    microStepText: null,
    createdAt: '',
    updatedAt: '',
  };
}

export function isDraftBlockId(
  blockId: string,
  draftBlocks: PlannerProposedBlock[] | null
): boolean {
  if (!draftBlocks?.length) return false;
  return draftBlocks.some((b) => b.tempId === blockId);
}
