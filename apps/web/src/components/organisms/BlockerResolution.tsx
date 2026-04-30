import type { Task, WeeklyReviewBlockerResolution } from '@/types/growth-system';

interface BlockerResolutionProps {
  tasks: Task[];
  resolutions: WeeklyReviewBlockerResolution[];
  onChange: (res: WeeklyReviewBlockerResolution[]) => void;
  readOnly?: boolean;
}

export function BlockerResolution({
  tasks,
  resolutions,
  onChange,
  readOnly = false,
}: BlockerResolutionProps) {
  const setNext = (taskId: string, nextAction: string) => {
    if (readOnly) return;
    const rest = resolutions.filter((r) => r.taskId !== taskId);
    if (!nextAction.trim()) {
      onChange(rest);
      return;
    }
    onChange([...rest, { taskId, nextAction: nextAction.trim() }]);
  };

  const valueFor = (id: string) => resolutions.find((r) => r.taskId === id)?.nextAction ?? '';

  if (!tasks.length) {
    return <p className="text-sm text-slate-500">No blocked tasks right now.</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((t) => (
        <div key={t.id} className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-4">
          <p className="font-medium text-slate-100">{t.title}</p>
          <label className="mt-2 block text-xs font-medium text-slate-400">
            Immediate next physical action to unblock
          </label>
          <input
            type="text"
            readOnly={readOnly}
            disabled={readOnly}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 read-only:cursor-default read-only:opacity-80"
            placeholder="e.g. Send one email to X asking for Y"
            value={valueFor(t.id)}
            onChange={(e) => setNext(t.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
