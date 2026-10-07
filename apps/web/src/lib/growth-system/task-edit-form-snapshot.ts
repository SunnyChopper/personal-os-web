import type {
  Area,
  Priority,
  TaskEnergyLevel,
  TaskExecutionWindow,
  TaskStatus,
} from '@/types/growth-system';

export type TaskEditFormSnapshot = {
  title: string;
  description: string;
  notes: string;
  area: Area;
  subCategory: string | undefined;
  priority: Priority;
  status: TaskStatus;
  size: number | undefined;
  dueDate: string;
  scheduledDate: string;
  pointValue: number | undefined;
  energyLevel: TaskEnergyLevel | null | undefined;
  executionWindow: TaskExecutionWindow | null | undefined;
  projectIds: string[];
  goalIds: string[];
  dependencyIds: string[];
};

function stableSnapshotJson(snapshot: TaskEditFormSnapshot): string {
  const normalized: TaskEditFormSnapshot = {
    ...snapshot,
    title: snapshot.title.trim(),
    description: snapshot.description.trim(),
    notes: snapshot.notes.trim(),
    dueDate: snapshot.dueDate.trim(),
    scheduledDate: snapshot.scheduledDate.trim(),
    projectIds: [...snapshot.projectIds].sort(),
    goalIds: [...snapshot.goalIds].sort(),
    dependencyIds: [...snapshot.dependencyIds].sort(),
  };
  return JSON.stringify(normalized);
}

export function taskEditFormSnapshotsEqual(
  a: TaskEditFormSnapshot,
  b: TaskEditFormSnapshot
): boolean {
  return stableSnapshotJson(a) === stableSnapshotJson(b);
}

export function buildTaskEditFormSnapshot(params: {
  title: string;
  description: string;
  notes: string;
  area: Area;
  subCategory: string | undefined;
  priority: Priority;
  status: TaskStatus;
  size: number | undefined;
  dueDate: string;
  scheduledDate: string;
  pointValue: number | undefined;
  energyLevel: TaskEnergyLevel | null | undefined;
  executionWindow: TaskExecutionWindow | null | undefined;
  projectIds: string[];
  goalIds: string[];
  dependencyIds: string[];
}): TaskEditFormSnapshot {
  return {
    title: params.title,
    description: params.description,
    notes: params.notes,
    area: params.area,
    subCategory: params.subCategory,
    priority: params.priority,
    status: params.status,
    size: params.size,
    dueDate: params.dueDate,
    scheduledDate: params.scheduledDate,
    pointValue: params.pointValue,
    energyLevel: params.energyLevel,
    executionWindow: params.executionWindow,
    projectIds: [...params.projectIds],
    goalIds: [...params.goalIds],
    dependencyIds: [...params.dependencyIds],
  };
}
