import type { StatusEntry } from '@/types/chatbot';

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

/**
 * Drop a trailing "Planning tool calls" row when a later planning step clarifies the path
 * (e.g. "Deciding response") so the trace does not show an empty reasoning shell.
 */
function withoutStaleTrailingPlanning(entries: StatusEntry[]): StatusEntry[] {
  const hasDecidingResponse = entries.some((e) =>
    (e.message ?? '').toLowerCase().includes('deciding response')
  );
  if (!hasDecidingResponse) {
    return entries;
  }
  return entries.filter((e) => !isStalePlanningToolCallsEntry(e));
}

export function getVisibleExecutionTraceEntries(statusHistory: StatusEntry[]): StatusEntry[] {
  const filtered = statusHistory.filter(
    (e) => !isGenericRunningToolsEntry(e) && e.stage !== 'responding' && e.stage !== 'persisting'
  );
  return withoutStaleTrailingPlanning(filtered);
}
