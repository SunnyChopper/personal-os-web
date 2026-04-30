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
export function getVisibleExecutionTraceEntries(statusHistory: StatusEntry[]): StatusEntry[] {
  return statusHistory.filter(
    (e) => !isGenericRunningToolsEntry(e) && e.stage !== 'responding' && e.stage !== 'persisting'
  );
}
