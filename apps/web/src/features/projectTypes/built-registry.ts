import type { ProjectTypeId } from '@/types/growth-system';
import type { ProjectTypeDescriptor } from '@/features/projectTypes/registry';
import { generalProjectType } from '@/features/projectTypes/general';
import { softwareDevelopmentProjectType } from '@/features/projectTypes/software-development.descriptor';

export const PROJECT_TYPE_REGISTRY: Record<ProjectTypeId, ProjectTypeDescriptor> = {
  General: generalProjectType,
  SoftwareDevelopment: softwareDevelopmentProjectType,
};

export function getProjectTypeDescriptor(id: ProjectTypeId | undefined): ProjectTypeDescriptor {
  if (!id) return PROJECT_TYPE_REGISTRY.General;
  return PROJECT_TYPE_REGISTRY[id] ?? PROJECT_TYPE_REGISTRY.General;
}
