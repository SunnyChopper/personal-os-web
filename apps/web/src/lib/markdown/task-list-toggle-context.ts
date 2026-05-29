import { createContext } from 'react';

export type TaskListToggleHandler = (index: number, nextChecked: boolean) => void;

export type TaskListToggleContextValue = {
  onToggle?: TaskListToggleHandler;
  allocateIndex: () => number;
};

export const TaskListToggleContext = createContext<TaskListToggleContextValue | null>(null);
