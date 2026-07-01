import type { Task } from '@/types/growth-system';

export type KanbanColumnStandaloneItem = {
  kind: 'standalone';
  task: Task;
};

export type KanbanColumnRollupItem = {
  kind: 'rollup';
  projectId: string;
  tasks: Task[];
};

export type KanbanColumnItem = KanbanColumnStandaloneItem | KanbanColumnRollupItem;

type TaskGroup = {
  projectId: string | null;
  tasks: Task[];
  firstIndex: number;
};

/**
 * Builds Kanban column render items. Tasks sharing the same first `projectId` in a column
 * are rolled up only when there are 2+ tasks; otherwise they render as normal cards.
 */
export function buildKanbanColumnItems(statusTasks: Task[]): KanbanColumnItem[] {
  const groups = new Map<string, TaskGroup>();

  statusTasks.forEach((task, index) => {
    const projectId = task.projectIds?.[0] ?? null;
    const groupKey = projectId ?? `__no_project__:${task.id}`;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.tasks.push(task);
      return;
    }

    groups.set(groupKey, { projectId, tasks: [task], firstIndex: index });
  });

  const orderedGroups = [...groups.values()].sort((a, b) => a.firstIndex - b.firstIndex);
  const items: KanbanColumnItem[] = [];

  for (const group of orderedGroups) {
    if (!group.projectId || group.tasks.length < 2) {
      for (const task of group.tasks) {
        items.push({ kind: 'standalone', task });
      }
      continue;
    }

    items.push({
      kind: 'rollup',
      projectId: group.projectId,
      tasks: group.tasks,
    });
  }

  return items;
}

export { sumKanbanStoryPoints } from '@/lib/growth-system/kanban-story-points';
