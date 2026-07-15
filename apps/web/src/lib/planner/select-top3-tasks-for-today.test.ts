import { describe, expect, it } from 'vitest';

import { selectTop3TasksForToday } from './select-top3-tasks-for-today';
import type { Task } from '@/types/growth-system';
import type { PlannerWeek } from '@/types/planner';

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Not Started',
    size: 3,
    dueDate: null,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [],
    goalIds: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePlannerWeek(
  todayKey: string,
  taskIds: string[],
  oneThingTaskId?: string
): PlannerWeek {
  return {
    weekStart: '2026-07-07',
    weekEnd: '2026-07-13',
    timeZone: 'America/Chicago',
    velocity: {
      dailyCapacityStoryPoints: 5,
      trailingWeeklyAverageStoryPoints: 20,
      dailyBurnRate: 4,
      confidence: 'medium',
    },
    days: [
      {
        date: todayKey,
        capacityStoryPoints: 5,
        scheduledStoryPoints: 0,
        scheduledMinutes: 0,
        loadRatio: 0,
        capacityState: 'healthy',
        oneThingTaskId: oneThingTaskId ?? null,
        calendarBusyMinutes: 0,
        calendarFreeMinutes: 480,
        lastGeneratedAt: null,
        blocks: taskIds.map((taskId, index) => ({
          id: `block-${index}`,
          date: todayKey,
          startAt: `${todayKey}T09:00:00`,
          endAt: `${todayKey}T10:00:00`,
          durationMinutes: 60,
          taskId,
          taskTitleSnapshot: taskId,
          source: 'manual',
          status: 'scheduled',
          storyPointsLoad: 3,
          calendarEventId: null,
          microStepId: null,
          microStepText: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        })),
      },
    ],
  };
}

describe('selectTop3TasksForToday', () => {
  const todayKey = '2026-07-09';
  const referenceDate = new Date(2026, 6, 9);

  it('prefers planner one-thing and blocks over fallback scoring', () => {
    const tasks = [
      makeTask({ id: 'planner-1', title: 'Planner First', priority: 'P2' }),
      makeTask({ id: 'planner-2', title: 'Planner Second', priority: 'P3' }),
      makeTask({
        id: 'high-score',
        title: 'High Score Overdue',
        priority: 'P1',
        dueDate: '2026-05-01',
      }),
      makeTask({ id: 'extra', title: 'Extra', priority: 'P1', dueDate: '2026-07-09' }),
    ];

    const result = selectTop3TasksForToday(
      tasks,
      makePlannerWeek(todayKey, ['planner-1', 'planner-2']),
      {
        todayKey,
        referenceDate,
      }
    );

    expect(result.map((t) => t.id)).toEqual(['planner-1', 'planner-2']);
  });

  it('caps at three tasks and excludes blocked tasks', () => {
    const tasks = [
      makeTask({ id: 'blocked', title: 'Blocked', status: 'Blocked', priority: 'P1' }),
      makeTask({ id: 't1', title: 'One', priority: 'P1' }),
      makeTask({ id: 't2', title: 'Two', priority: 'P1' }),
      makeTask({ id: 't3', title: 'Three', priority: 'P1' }),
      makeTask({ id: 't4', title: 'Four', priority: 'P1' }),
    ];

    const result = selectTop3TasksForToday(tasks, undefined, { todayKey, referenceDate });

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('does not dump all overdue tasks — only top 3 by score', () => {
    const tasks = [
      makeTask({ id: 'due-today', title: 'Due Today', priority: 'P2', dueDate: '2026-07-09' }),
      makeTask({
        id: 'scheduled-today',
        title: 'Scheduled Today',
        priority: 'P1',
        scheduledDate: '2026-07-09T12:00:00Z',
      }),
      makeTask({ id: 'future', title: 'Future', priority: 'P1', dueDate: '2026-08-01' }),
      makeTask({ id: 'overdue-low', title: 'Old Overdue', priority: 'P4', dueDate: '2026-05-01' }),
      makeTask({ id: 'overdue-high', title: 'Hot Overdue', priority: 'P1', dueDate: '2026-06-01' }),
      makeTask({
        id: 'overdue-extra',
        title: 'Extra Overdue',
        priority: 'P4',
        dueDate: '2026-04-01',
      }),
    ];

    const result = selectTop3TasksForToday(tasks, undefined, { todayKey, referenceDate });

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual(['overdue-high', 'due-today', 'scheduled-today']);
    expect(result.some((t) => t.id === 'overdue-low')).toBe(false);
    expect(result.some((t) => t.id === 'overdue-extra')).toBe(false);
  });

  it('returns empty when no active tasks qualify', () => {
    const tasks = [
      makeTask({ id: 'done', title: 'Done', status: 'Done' }),
      makeTask({ id: 'cancelled', title: 'Cancelled', status: 'Cancelled' }),
      makeTask({ id: 'backlog', title: 'Backlog', status: 'Backlog' }),
    ];

    expect(selectTop3TasksForToday(tasks, undefined, { todayKey, referenceDate })).toEqual([]);
  });
});
