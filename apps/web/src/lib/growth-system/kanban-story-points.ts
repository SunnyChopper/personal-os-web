import type { Task } from '@/types/growth-system';

export function sumKanbanStoryPoints(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + (task.size ?? 0), 0);
}
