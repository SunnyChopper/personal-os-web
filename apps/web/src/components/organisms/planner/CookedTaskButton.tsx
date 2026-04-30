import { useState } from 'react';

import Button from '@/components/atoms/Button';
import { useRescueTask } from '@/hooks/usePlanner';
import { mondayISO } from '@/lib/planner/week';
import type { CookedTaskResult } from '@/types/planner';
import type { Task } from '@/types/growth-system';

import { CookedTaskDrawer } from './CookedTaskDrawer';

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'Done' || task.status === 'Cancelled') return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export interface CookedTaskButtonProps {
  task: Task;
  /** Optional label override */
  label?: string;
}

export function CookedTaskButton({ task, label = 'Cooked' }: CookedTaskButtonProps) {
  const weekStart = mondayISO(new Date());
  const rescue = useRescueTask(weekStart);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CookedTaskResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isOverdue(task)) {
    return null;
  }

  return (
    <>
      <Button
        variant="secondary"
        className="text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
        disabled={rescue.isPending}
        onClick={() => {
          setErr(null);
          rescue.mutate(
            { taskId: task.id },
            {
              onSuccess: (data) => {
                setResult(data);
                setErr(null);
                setOpen(true);
              },
              onError: (e: unknown) => {
                setResult(null);
                setErr(e instanceof Error ? e.message : 'Rescue failed');
                setOpen(true);
              },
            }
          );
        }}
      >
        {rescue.isPending ? '…' : label}
      </Button>
      <CookedTaskDrawer
        open={open}
        onClose={() => setOpen(false)}
        result={result}
        error={err}
      />
    </>
  );
}
