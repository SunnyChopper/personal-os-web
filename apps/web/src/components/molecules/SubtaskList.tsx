import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { tasksService } from '@/services/growth-system';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { Task } from '@/types/growth-system';
import Button from '@/components/atoms/Button';

const MAX_SUBTASKS = 50;

interface SubtaskListProps {
  parentTask: Task;
}

export function SubtaskList({ parentTask }: SubtaskListProps) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.growthSystem.tasks.subtasks(parentTask.id),
    queryFn: () => tasksService.getSubtasks(parentTask.id),
    staleTime: 30_000,
  });

  const subtasks = data?.data ?? [];
  const atCap = subtasks.length >= MAX_SUBTASKS;

  const createMut = useMutation({
    mutationFn: (title: string) =>
      tasksService.create({
        title,
        area: parentTask.area,
        priority: parentTask.priority ?? 'P3',
        parentTaskId: parentTask.id,
      }),
    onSuccess: (res) => {
      if (res.success) {
        void qc.invalidateQueries({
          queryKey: queryKeys.growthSystem.tasks.subtasks(parentTask.id),
        });
        void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
        void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
        setNewTitle('');
      }
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      tasksService.update(id, { status: done ? 'Done' : 'Not Started' }),
    onSuccess: (res) => {
      if (res.success) {
        void qc.invalidateQueries({
          queryKey: queryKeys.growthSystem.tasks.subtasks(parentTask.id),
        });
        void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.tasks.lists() });
        void qc.invalidateQueries({ queryKey: queryKeys.growthSystem.data() });
      }
    },
  });

  const doneCount = subtasks.filter((s) => s.status === 'Done').length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTitle.trim();
    if (!t || atCap || createMut.isPending) return;
    createMut.mutate(t);
  };

  return (
    <div className="space-y-3">
      {subtasks.length > 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {doneCount} / {subtasks.length} done
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading subtasks…
        </div>
      ) : null}
      {isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">Could not load subtasks.</p>
      ) : null}

      <ul className="space-y-2">
        {subtasks.map((st) => (
          <li
            key={st.id}
            className="flex items-start gap-2 rounded-md border border-gray-100 bg-gray-50/80 px-2 py-2 dark:border-gray-700 dark:bg-gray-800/50"
          >
            <input
              type="checkbox"
              checked={st.status === 'Done'}
              disabled={toggleMut.isPending}
              onChange={(ev) => toggleMut.mutate({ id: st.id, done: ev.target.checked })}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
              aria-label={st.status === 'Done' ? 'Mark subtask not done' : 'Mark subtask done'}
            />
            <span
              className={`flex-1 text-sm ${
                st.status === 'Done'
                  ? 'text-gray-500 line-through dark:text-gray-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {st.title}
            </span>
          </li>
        ))}
      </ul>

      {subtasks.length === 0 && !isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No subtasks yet.</p>
      ) : null}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="sr-only">New subtask title</span>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={atCap ? 'Subtask limit reached (50)' : 'Add a subtask…'}
            disabled={atCap || createMut.isPending}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </label>
        <Button type="submit" variant="secondary" size="sm" disabled={atCap || createMut.isPending}>
          {createMut.isPending ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  );
}
