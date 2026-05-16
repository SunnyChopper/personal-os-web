import { useMemo } from 'react';
import type { Task, TaskKind, TaskStatus } from '@/types/growth-system';
import { cn } from '@/lib/utils';
import type { ProjectKanbanProps } from '@/features/projectTypes/registry';

const KANBAN_COLUMNS: TaskStatus[] = [
  'Backlog',
  'Not Started',
  'In Progress',
  'Blocked',
  'On Hold',
  'Done',
  'Cancelled',
];

const TASK_KIND_STYLES: Record<TaskKind, string> = {
  Generic: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  Bug: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  Feature: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  Chore: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Spike: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
};

export function SoftwareKanbanView({ tasks, onTaskClick }: ProjectKanbanProps) {
  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col, []);
    }
    for (const t of tasks) {
      const raw = t.status as TaskStatus;
      const bucket = map.has(raw) ? raw : ('Backlog' as TaskStatus);
      map.get(bucket)!.push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col}
            className="flex w-52 shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
          >
            <div className="border-b border-gray-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-700 dark:text-gray-400">
              {col}{' '}
              <span className="font-normal text-gray-400">({byStatus.get(col)?.length ?? 0})</span>
            </div>
            <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto p-2">
              {(byStatus.get(col) ?? []).map((task) => {
                const kind = (task.taskKind ?? 'Generic') as TaskKind;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onTaskClick(task)}
                    className="rounded-md border border-gray-200 bg-white p-2 text-left text-sm shadow-sm transition hover:border-blue-300 hover:shadow dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500"
                  >
                    <div className="mb-1 line-clamp-3 font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </div>
                    <span
                      className={cn(
                        'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        TASK_KIND_STYLES[kind] ?? TASK_KIND_STYLES.Generic
                      )}
                    >
                      {kind}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
