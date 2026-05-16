import type { FC } from 'react';
import type {
  Project,
  ProjectTypeId,
  SoftwareMetadata,
  Task,
  TaskKind,
} from '@/types/growth-system';

/** Default shape for software-development fields in forms. */
export const EMPTY_SOFTWARE_METADATA: SoftwareMetadata = {
  repoUrls: [],
  techStack: [],
  deployments: [],
};

export interface ProjectTypeFieldProps {
  projectType: ProjectTypeId;
  softwareMetadata: SoftwareMetadata;
  onProjectTypeChange: (next: ProjectTypeId) => void;
  onSoftwareMetadataChange: (next: SoftwareMetadata) => void;
  disabled?: boolean;
}

export interface ProjectKanbanProps {
  project: Project;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export interface ProjectViewModeDescriptor {
  id: string;
  label: string;
  Component: FC<ProjectKanbanProps>;
}

export interface TaskKindOption {
  value: TaskKind;
  label: string;
  tone: 'neutral' | 'danger' | 'info' | 'success';
}

export interface ProjectTypeDescriptor {
  id: ProjectTypeId;
  label: string;
  shortLabel: string;
  description: string;
  CreateFields?: FC<ProjectTypeFieldProps>;
  EditFields?: FC<ProjectTypeFieldProps>;
  DetailSections?: FC<{ project: Project }>;
  CardBadges?: FC<{ project: Project }>;
  extraViewModes?: ProjectViewModeDescriptor[];
  taskKinds?: TaskKindOption[];
}
