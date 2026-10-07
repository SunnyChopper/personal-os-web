import type { StatusEntry, WsToolCallCompletePayload } from '@/types/chatbot';

export const NO_TOOLS_INVOKED_MESSAGE = 'No tools invoked this turn';

function isGenericRunningToolsEntry(entry: StatusEntry): boolean {
  if (entry.stage !== 'runningTools') return false;
  const msg = (entry.message ?? '').toLowerCase().trim();
  return msg === 'running tools' || msg === '';
}

/**
 * Same filter as the rendered trace:
 * - excludes generic “running tools” placeholders
 * - hides responding/persisting — the streamed reply already shows generation; persistence is implied
 */
function isStalePlanningToolCallsEntry(entry: StatusEntry): boolean {
  if (entry.stage !== 'planning') {
    return false;
  }
  const msg = (entry.message ?? '').toLowerCase().trim();
  return msg === 'planning tool calls' || msg === 'planning your answer';
}

function hasNoToolsPlanningClarifier(entries: StatusEntry[]): boolean {
  return entries.some(
    (entry) =>
      entry.noToolsInvoked === true ||
      (entry.message ?? '').toLowerCase().includes(NO_TOOLS_INVOKED_MESSAGE.toLowerCase()) ||
      (entry.message ?? '').toLowerCase().includes('deciding response')
  );
}

/**
 * Drop a trailing "Planning tool calls" row when a later planning step clarifies the path
 * (e.g. "Deciding response" or "No tools invoked this turn") so the trace does not show an empty reasoning shell.
 */
function withoutStaleTrailingPlanning(entries: StatusEntry[]): StatusEntry[] {
  if (!hasNoToolsPlanningClarifier(entries)) {
    return entries;
  }
  return entries.filter((entry) => !isStalePlanningToolCallsEntry(entry));
}

export function getVisibleExecutionTraceEntries(statusHistory: StatusEntry[]): StatusEntry[] {
  const filtered = statusHistory.filter(
    (e) => !isGenericRunningToolsEntry(e) && e.stage !== 'responding' && e.stage !== 'persisting'
  );
  return withoutStaleTrailingPlanning(filtered);
}

function hasToolStages(statusHistory: StatusEntry[]): boolean {
  return statusHistory.some(
    (entry) => entry.stage === 'runningTools' || entry.stage === 'consultingSpecialists'
  );
}

export function isNoToolsExecutionTrace(
  statusHistory: StatusEntry[],
  toolCallDetails?: WsToolCallCompletePayload[]
): boolean {
  if (statusHistory.some((entry) => entry.noToolsInvoked)) {
    return true;
  }
  if ((toolCallDetails?.length ?? 0) > 0) {
    return false;
  }
  return !hasToolStages(statusHistory);
}

export function getExecutionTraceAccordionLabel({
  statusHistory,
  toolCallDetails,
  expanded,
}: {
  statusHistory: StatusEntry[];
  toolCallDetails?: WsToolCallCompletePayload[];
  expanded: boolean;
}): string {
  if (isNoToolsExecutionTrace(statusHistory, toolCallDetails)) {
    return expanded ? 'Hide execution steps · no tools' : 'Show execution steps · no tools';
  }
  const visibleCount = getVisibleExecutionTraceEntries(statusHistory).length;
  return expanded
    ? `Hide execution steps (${visibleCount})`
    : `Show execution steps (${visibleCount})`;
}
