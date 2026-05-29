import { useMemo, useRef, type ReactNode } from 'react';
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
  const counterRef = useRef(0);
  counterRef.current = 0;

  const value = useMemo(
    () => ({
      onToggle,
      allocateIndex: () => {
        const index = counterRef.current;
        counterRef.current += 1;
        return index;
      },
    }),
    [onToggle]
  );

  return <TaskListToggleContext.Provider value={value}>{children}</TaskListToggleContext.Provider>;
}
