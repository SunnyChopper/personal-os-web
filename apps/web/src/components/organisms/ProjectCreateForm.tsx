import { useState } from 'react';
import type {
  CreateProjectInput,
  Area,
  SubCategory,
  Priority,
  ProjectStatus,
  ProjectTypeId,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { ImpactScoreSelector } from '@/components/molecules/ImpactScoreSelector';
import {
  AREAS,
  AREA_LABELS,
  PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  SUBCATEGORIES_BY_AREA,
} from '@/constants/growth-system';
import {
  EMPTY_SOFTWARE_METADATA,
  getProjectTypeDescriptor,
  ProjectTypeSelect,
} from '@/features/projectTypes';

interface ProjectCreateFormProps {
  onSubmit: (input: CreateProjectInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectCreateForm({ onSubmit, onCancel, isLoading }: ProjectCreateFormProps) {
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    area: 'Operations',
    subCategory: undefined,
    priority: 'P3',
    status: 'Planning',
    impact: 5,
    startDate: '',
    targetEndDate: '',
    notes: '',
    projectType: 'General',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableSubCategories = SUBCATEGORIES_BY_AREA[formData.area] || [];
  const projectType = formData.projectType ?? 'General';
  const typeDescriptor = getProjectTypeDescriptor(projectType);
  const TypeExtraFields = typeDescriptor.CreateFields;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the project"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="project-create-type"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Project type
        </label>
        <ProjectTypeSelect
          id="project-create-type"
          value={projectType}
          disabled={isLoading}
          onChange={(next: ProjectTypeId) =>
            setFormData((prev) => ({
              ...prev,
              projectType: next,
              softwareMetadata:
                next === 'SoftwareDevelopment'
                  ? (prev.softwareMetadata ?? EMPTY_SOFTWARE_METADATA)
                  : undefined,
            }))
          }
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {typeDescriptor.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Area *
          </label>
          <select
            required
            value={formData.area}
            onChange={(e) =>
              setFormData({ ...formData, area: e.target.value as Area, subCategory: undefined })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {AREA_LABELS[area]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sub-Category
          </label>
          <select
            value={formData.subCategory || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                subCategory: (e.target.value as SubCategory) || undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {availableSubCategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <ImpactScoreSelector
          label="Impact Score (1-5)"
          value={formData.impact ?? 5}
          onChange={(value) => setFormData({ ...formData, impact: value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target End Date
          </label>
          <input
            type="date"
            value={formData.targetEndDate}
            onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {TypeExtraFields && projectType === 'SoftwareDevelopment' ? (
        <TypeExtraFields
          projectType={projectType}
          softwareMetadata={formData.softwareMetadata ?? EMPTY_SOFTWARE_METADATA}
          onProjectTypeChange={() => {}}
          onSoftwareMetadataChange={(softwareMetadata) =>
            setFormData((prev) => ({ ...prev, softwareMetadata }))
          }
          disabled={isLoading}
        />
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or details"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
