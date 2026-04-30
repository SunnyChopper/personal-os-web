import { describe, expect, it } from 'vitest';
import type { StatusEntry } from '@/types/chatbot';
import { getVisibleExecutionTraceEntries } from '@/lib/chat/assistant-execution-trace-entries';

describe('getVisibleExecutionTraceEntries', () => {
  it('drops responding and persisting stages for display', () => {
    const history: StatusEntry[] = [
      { stage: 'planning', message: 'Planning', startedAt: 1 },
      { stage: 'responding', message: 'Generating response', startedAt: 2 },
      { stage: 'persisting', message: 'Saving', startedAt: 3 },
    ];
    expect(getVisibleExecutionTraceEntries(history)).toEqual([history[0]]);
  });

  it('still shows planning and tools', () => {
    const history: StatusEntry[] = [
      { stage: 'planning', startedAt: 1 },
      { stage: 'runningTools', message: 'Running tool: listTasks', startedAt: 2 },
    ];
    expect(getVisibleExecutionTraceEntries(history)).toEqual(history);
  });
});
