import type { ReactNode } from 'react';
import {
  TaskListToggleContext,
  type TaskListToggleHandler,
} from '@/lib/markdown/task-list-toggle-context';

export function TaskListToggleProvider({
  children,
  onToggle,
}: {
  children: ReactNode;
  onToggle?: TaskListToggleHandler;
}) {
  const counter = { next: 0 };
  const value = {
    onToggle,
    allocateIndex: () => {
      const index = counter.next;
      counter.next += 1;
      return index;
    },
  };

  return <TaskListToggleContext.Provider value={value}>{children}</TaskListToggleContext.Provider>;
}
