import { SUBCATEGORIES_BY_AREA } from '@/constants/growth-system';
import type { Area, CreateTaskInput, Priority, SubCategory } from '@/types/growth-system';

export type ProjectTaskTaxonomySeed = {
  area: Area;
  subCategory: SubCategory | null;
  priority: Priority;
};

/** Seed Priority, Area, and Sub-category for project-detail Create Task. */
export function taskCreatePrefillFromProject(
  project: ProjectTaskTaxonomySeed
): Partial<CreateTaskInput> {
  const prefill: Partial<CreateTaskInput> = {
    area: project.area,
    priority: project.priority,
  };

  if (project.subCategory) {
    const validSubcategories = SUBCATEGORIES_BY_AREA[project.area] || [];
    if (validSubcategories.includes(project.subCategory)) {
      prefill.subCategory = project.subCategory;
    }
  }

  return prefill;
}
