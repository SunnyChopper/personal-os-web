import { useContext } from 'react';
import { TaskListToggleContext } from '@/lib/markdown/task-list-toggle-context';

export function useTaskListToggleContext() {
  return useContext(TaskListToggleContext);
}
