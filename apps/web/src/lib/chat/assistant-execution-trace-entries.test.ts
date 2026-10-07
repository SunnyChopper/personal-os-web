import { describe, expect, it } from 'vitest';
import type { StatusEntry } from '@/types/chatbot';
import {
  NO_TOOLS_INVOKED_MESSAGE,
  getExecutionTraceAccordionLabel,
  getVisibleExecutionTraceEntries,
} from '@/lib/chat/assistant-execution-trace-entries';

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

  it('keeps harness page and inventory progress messages visible', () => {
    const history: StatusEntry[] = [
      {
        stage: 'runningTools',
        message: 'Fetching projects page 2 of 3',
        startedAt: 1,
      },
      {
        stage: 'runningTools',
        message: 'Inventory complete 26/26',
        startedAt: 2,
      },
    ];
    expect(getVisibleExecutionTraceEntries(history)).toEqual(history);
  });

  it('drops stale Planning tool calls when Deciding response is present', () => {
    const history: StatusEntry[] = [
      { stage: 'planning', message: 'Planning tool calls', startedAt: 1 },
      { stage: 'planning', message: 'Deciding response', startedAt: 2 },
    ];
    expect(getVisibleExecutionTraceEntries(history)).toEqual([history[1]]);
  });

  it('drops stale Planning tool calls when no-tools signal is present', () => {
    const history: StatusEntry[] = [
      { stage: 'planning', message: 'Planning tool calls', startedAt: 1 },
      {
        stage: 'planning',
        message: NO_TOOLS_INVOKED_MESSAGE,
        startedAt: 2,
        noToolsInvoked: true,
      },
    ];
    expect(getVisibleExecutionTraceEntries(history)).toEqual([history[1]]);
  });
});

describe('getExecutionTraceAccordionLabel', () => {
  it('uses no-tools label when trace has no tool stages or details', () => {
    const history: StatusEntry[] = [
      { stage: 'planning', message: NO_TOOLS_INVOKED_MESSAGE, startedAt: 1, noToolsInvoked: true },
    ];
    expect(
      getExecutionTraceAccordionLabel({
        statusHistory: history,
        toolCallDetails: [],
        expanded: false,
      })
    ).toBe('Show execution steps · no tools');
  });

  it('uses count label when tools ran', () => {
    const history: StatusEntry[] = [
      { stage: 'planning', startedAt: 1 },
      { stage: 'runningTools', message: 'Running tool: list_tasks', startedAt: 2 },
    ];
    expect(
      getExecutionTraceAccordionLabel({
        statusHistory: history,
        toolCallDetails: [{ toolName: 'list_tasks', arguments: {}, status: 'ok' }],
        expanded: false,
      })
    ).toBe('Show execution steps (2)');
  });
});
