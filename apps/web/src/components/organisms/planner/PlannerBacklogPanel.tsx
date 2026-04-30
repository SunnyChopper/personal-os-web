import type { Task } from '@/types/growth-system';

export interface PlannerBacklogPanelProps {
  tasks: Task[];
  scheduledTaskIds: Set<string>;
}

export function PlannerBacklogPanel({ tasks, scheduledTaskIds }: PlannerBacklogPanelProps) {
  const backlog = tasks.filter(
    (t) =>
      t.status !== 'Done' &&
      t.status !== 'Cancelled' &&
      t.status !== 'On Hold' &&
      !scheduledTaskIds.has(t.id)
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 h-full min-h-[200px]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Backlog</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Unscheduled active tasks. Use <strong>Auto-schedule</strong> to place blocks from the model.
      </p>
      <ul className="space-y-1 max-h-[320px] overflow-y-auto text-xs">
        {backlog.slice(0, 40).map((t) => (
          <li
            key={t.id}
            className="truncate px-2 py-1 rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <span className="font-medium">{t.priority}</span> · {t.title}
          </li>
        ))}
        {backlog.length === 0 && (
          <li className="text-gray-500 dark:text-gray-400 italic">Nothing in backlog.</li>
        )}
      </ul>
    </div>
  );
}
