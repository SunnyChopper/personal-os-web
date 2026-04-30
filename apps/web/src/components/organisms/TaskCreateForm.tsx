import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type {
  CreateTaskInput,
  Area,
  SubCategory,
  Priority,
  TaskStatus,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { AITaskAssistPanel } from '@/components/molecules/AITaskAssistPanel';
import { llmConfig } from '@/lib/llm';
import {
  AREAS,
  PRIORITIES,
  SUBCATEGORIES_BY_AREA,
  TASK_STATUSES,
  AREA_LABELS,
  TASK_STATUS_LABELS,
  TASK_STORY_POINTS_FIBONACCI,
} from '@/constants/growth-system';

interface TaskCreateFormProps {
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskCreateForm({ onSubmit, onCancel, isLoading }: TaskCreateFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    extendedDescription: '',
    area: 'Operations',
    subCategory: undefined,
    priority: 'P3',
    status: 'Not Started',
    size: undefined,
    dueDate: '',
    scheduledDate: '',
    notes: '',
    isRecurring: false,
    pointValue: undefined,
  });

  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiMode, setAIMode] = useState<'parse' | 'categorize' | 'estimate'>('parse');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAIConfigured = llmConfig.isConfigured();

  const extractValidationErrors = (details: unknown): string => {
    if (!Array.isArray(details)) return '';
    const validationErrors = (details as Array<{ msg?: string }>)
      .map((d) => d.msg)
      .filter(Boolean)
      .join(', ');
    return validationErrors ? `: ${validationErrors}` : '';
  };

  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const apiError = err as { error?: { message?: string; details?: unknown } };
      if (apiError.error?.message) {
        const validationDetails = extractValidationErrors(apiError.error.details);
        return `${apiError.error.message}${validationDetails}`;
      }
    }
    return 'Failed to create task. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const input: CreateTaskInput = {
        ...formData,
        description: formData.description || undefined,
        extendedDescription: formData.extendedDescription || undefined,
        notes: formData.notes || undefined,
        dueDate: formData.dueDate || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        size: formData.size || undefined,
        pointValue: formData.pointValue || undefined,
      };
      await onSubmit(input);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSubCategories = SUBCATEGORIES_BY_AREA[formData.area];

  const handleApplyParsed = (task: Partial<CreateTaskInput>) => {
    setFormData({
      ...formData,
      title: task.title || formData.title,
      description: task.description || formData.description,
      area: task.area || formData.area,
      subCategory: task.subCategory || formData.subCategory,
      priority: task.priority || formData.priority,
      dueDate: task.dueDate || formData.dueDate,
      scheduledDate: task.scheduledDate || formData.scheduledDate,
      size: task.size ?? formData.size,
    });
  };

  const handleApplyCategory = (area: string, subCategory?: string) => {
    setFormData({
      ...formData,
      area: area as Area,
      subCategory: subCategory as SubCategory | undefined,
    });
  };

  const handleApplyEffort = (size: number) => {
    setFormData({ ...formData, size });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error</p>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isAIConfigured && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAIAssist(!showAIAssist)}
            className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            <Sparkles size={16} />
            <span>AI Assist</span>
            {showAIAssist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAIAssist && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAIMode('parse')}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    aiMode === 'parse'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Smart Parse
                </button>
                <button
                  type="button"
                  onClick={() => setAIMode('categorize')}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    aiMode === 'categorize'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Auto-Category
                </button>
                <button
                  type="button"
                  onClick={() => setAIMode('estimate')}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    aiMode === 'estimate'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Estimate story points
                </button>
              </div>

              <AITaskAssistPanel
                mode={aiMode}
                onClose={() => setShowAIAssist(false)}
                onApplyParsed={handleApplyParsed}
                onApplyCategory={handleApplyCategory}
                onApplyEffort={handleApplyEffort}
                title={formData.title}
                description={formData.description}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description"
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
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scheduled Date
          </label>
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Story points (Fibonacci)
        </label>
        <select
          value={formData.size ?? ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              size: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Not set</option>
          {TASK_STORY_POINTS_FIBONACCI.map((n) => (
            <option key={n} value={n}>
              {n} pts
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Planning scale only (not hours or minutes).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Point Value (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={formData.pointValue || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                pointValue: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="AI will calculate if left empty"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isAIConfigured && (
            <button
              type="button"
              onClick={() => setAIMode('estimate')}
              className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              title="Calculate with AI"
            >
              <Sparkles size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Reward points for completing this task
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes"
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
          {isLoading || isSubmitting ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
