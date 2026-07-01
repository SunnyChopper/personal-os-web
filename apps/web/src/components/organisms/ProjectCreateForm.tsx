import { useState } from 'react';
import type {
  CreateProjectInput,
  Area,
  SubCategory,
  Priority,
  ProjectStatus,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { ProjectCoreFormFields } from '@/components/molecules/ProjectCoreFormFields';
import { ImpactScoreSelector } from '@/components/molecules/ImpactScoreSelector';
import {
  PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  SUBCATEGORIES_BY_AREA,
} from '@/constants/growth-system';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableSubCategories = SUBCATEGORIES_BY_AREA[formData.area] || [];

  return (
    <form onSubmit={handleSubmit}>
      <fieldset
        disabled={isLoading}
        className="min-w-0 space-y-6 border-0 p-0 m-0 disabled:opacity-60"
      >
        <ProjectCoreFormFields
          values={{
            name: formData.name,
            description: formData.description,
            area: formData.area,
          }}
          onChange={(field, value) => {
            if (field === 'area') {
              setFormData({ ...formData, area: value as Area, subCategory: undefined });
              return;
            }
            setFormData({ ...formData, [field]: value });
          }}
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sub-Category
            </label>
            <Select
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
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as ProjectStatus })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <Textarea
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
      </fieldset>
    </form>
  );
}
