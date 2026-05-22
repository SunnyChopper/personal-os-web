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
    <div className="min-h-0">
      <p className="mb-3 text-xs text-gray-400">
        Unscheduled active tasks. Use <strong className="text-gray-300">Auto-schedule</strong> to
        place blocks from the model. Drag-and-drop onto days coming soon.
      </p>
      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {backlog.slice(0, 60).map((t) => (
          <li
            key={t.id}
            className="truncate rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-gray-200"
          >
            <span className="font-medium text-gray-400">{t.priority}</span> · {t.title}
          </li>
        ))}
        {backlog.length === 0 && (
          <li className="text-sm italic text-gray-500">Nothing in backlog.</li>
        )}
      </ul>
    </div>
  );
}
