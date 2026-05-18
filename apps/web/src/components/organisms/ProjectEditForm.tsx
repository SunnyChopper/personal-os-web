import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type {
  Project,
  UpdateProjectInput,
  Area,
  SubCategory,
  Priority,
  ProjectStatus,
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

interface ProjectEditFormProps {
  project: Project;
  onSubmit: (id: string, input: UpdateProjectInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectEditForm({ project, onSubmit, onCancel, isLoading }: ProjectEditFormProps) {
  const [formData, setFormData] = useState<UpdateProjectInput>({
    name: project.name,
    description: project.description || '',
    area: project.area,
    subCategory: project.subCategory || undefined,
    priority: project.priority ?? 'P3',
    status: project.status,
    impact: project.impact,
    startDate: project.startDate || '',
    targetEndDate: project.targetEndDate || '',
    notes: project.notes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = onSubmit(project.id, formData);
      // Handle both sync and async onSubmit
      if (result && typeof result.then === 'function') {
        await result;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSubCategories = SUBCATEGORIES_BY_AREA[formData.area || project.area] || [];

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {(isLoading || isSubmitting) && (
        <div
          className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto rounded-lg"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Saving changes...
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${isLoading || isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={isLoading || isSubmitting}
      >
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
            </select>
          </div>
        </div>

        <div>
          <ImpactScoreSelector
            label="Impact Score (1-5)"
            value={formData.impact ?? project.impact}
            onChange={(value) => setFormData({ ...formData, impact: value })}
            disabled={isLoading || isSubmitting}
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
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes or details"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading || isSubmitting}>
            {isLoading || isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
