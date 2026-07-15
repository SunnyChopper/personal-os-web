import type { Task } from '@/types/growth-system';
import type { PlannerWeek } from '@/types/planner';
import { todayISOLocal } from '@/lib/planner/week';
import { differenceInCalendarDaysLocal, extractDateOnly } from '@/utils/date-formatters';

/** Actionable on-deck work only — exclude Backlog (capture bucket) and Blocked. */
export function getActiveTasksForTop3(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === 'Not Started' || t.status === 'In Progress')
    .filter((t) => t.status !== 'Blocked');
}

export interface SelectTop3TasksOptions {
  todayKey?: string;
  referenceDate?: Date;
}

/**
 * Canonical Top 3 selector for the dashboard widget and Focus Mode session seed.
 * Prefers today's planner one-thing + blocks; otherwise scores active tasks and caps at 3.
 */
export function selectTop3TasksForToday(
  tasks: Task[],
  plannerWeek: PlannerWeek | undefined,
  options?: SelectTop3TasksOptions
): Task[] {
  const todayKey = options?.todayKey ?? todayISOLocal();
  const referenceDate = options?.referenceDate ?? new Date();
  const activeTasks = getActiveTasksForTop3(tasks);

  const scoredTasks = activeTasks.map((task) => {
    let score = 0;

    if (task.priority === 'P1') score += 40;
    else if (task.priority === 'P2') score += 30;
    else if (task.priority === 'P3') score += 20;
    else score += 10;

    if (task.dueDate) {
      const daysUntilDue = differenceInCalendarDaysLocal(task.dueDate, referenceDate);
      if (daysUntilDue !== null) {
        if (daysUntilDue <= 0) score += 50;
        else if (daysUntilDue <= 2) score += 30;
        else if (daysUntilDue <= 7) score += 10;
      }
    }

    if (task.scheduledDate && extractDateOnly(task.scheduledDate) === todayKey) {
      score += 25;
    }

    if (task.size === 1) score += 15;
    else if (task.size && task.size <= 3) score += 10;
    else if (task.size && task.size <= 5) score += 5;

    return { task, score };
  });

  scoredTasks.sort((a, b) => b.score - a.score);
  const fallbackTop = scoredTasks.slice(0, 3).map((s) => s.task);

  const todayDay = plannerWeek?.days.find((d) => d.date === todayKey);
  const plannerTop: Task[] = [];
  if (todayDay) {
    const ids: string[] = [];
    if (todayDay.oneThingTaskId) ids.push(todayDay.oneThingTaskId);
    todayDay.blocks.forEach((b) => {
      if (b.taskId) ids.push(b.taskId);
    });
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const t = tasks.find((x) => x.id === id);
      if (t && activeTasks.some((a) => a.id === id)) plannerTop.push(t);
      if (plannerTop.length >= 3) break;
    }
  }

  return plannerTop.length > 0 ? plannerTop : fallbackTop;
}
