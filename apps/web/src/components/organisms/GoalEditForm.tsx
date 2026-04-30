import { useState, useMemo, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import type {
  Goal,
  UpdateGoalInput,
  Area,
  SubCategory,
  TimeHorizon,
  Priority,
  GoalStatus,
  SuccessCriterion,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import {
  AREAS,
  AREA_LABELS,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  GOAL_TIME_HORIZONS,
  PRIORITIES,
  SUBCATEGORIES_BY_AREA,
  SUBCATEGORY_LABELS,
} from '@/constants/growth-system';
import { getValidParentGoals } from '@/utils/growth-system-filters';
import { extractDateOnly } from '@/utils/date-formatters';

interface GoalEditFormProps {
  goal: Goal;
  onSubmit: (id: string, input: UpdateGoalInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  allGoals?: Goal[]; // For parent goal selector
}

export function GoalEditForm({
  goal,
  onSubmit,
  onCancel,
  isLoading,
  allGoals = [],
}: GoalEditFormProps) {
  const [formData, setFormData] = useState<UpdateGoalInput>({
    title: goal.title,
    description: goal.description || '',
    area: goal.area,
    subCategory: goal.subCategory || undefined,
    timeHorizon: goal.timeHorizon,
    priority: goal.priority,
    status: goal.status,
    targetDate: goal.targetDate ? extractDateOnly(goal.targetDate) : '',
    successCriteria:
      goal.successCriteria && goal.successCriteria.length > 0
        ? typeof goal.successCriteria[0] === 'string'
          ? (goal.successCriteria as unknown as string[])
          : (goal.successCriteria as SuccessCriterion[]).map((c) => c.description)
        : [],
    notes: goal.notes || '',
    parentGoalId: goal.parentGoalId || undefined,
  });

  // Get valid parent goals based on current time horizon
  const validParentGoals = useMemo(() => {
    return getValidParentGoals(allGoals, formData.timeHorizon || goal.timeHorizon, goal.id);
  }, [allGoals, formData.timeHorizon, goal.id, goal.timeHorizon]);

  // Get the selected parent goal for preview
  const selectedParentGoal = useMemo(() => {
    if (!formData.parentGoalId) return null;
    return allGoals.find((g) => g.id === formData.parentGoalId) || null;
  }, [allGoals, formData.parentGoalId]);

  // Check if parent selection should be disabled (Yearly goals)
  const isParentSelectionDisabled = useMemo(() => {
    const currentHorizon = formData.timeHorizon || goal.timeHorizon;
    return currentHorizon === 'Yearly';
  }, [formData.timeHorizon, goal.timeHorizon]);

  // Get available sub-categories based on selected area
  const availableSubCategories = useMemo(() => {
    const area = formData.area || goal.area;
    return SUBCATEGORIES_BY_AREA[area] || [];
  }, [formData.area, goal.area]);

  const [criterionInput, setCriterionInput] = useState('');

  // Memoize success criteria as strings for form state
  const successCriteriaStrings = useMemo(() => {
    if (!formData.successCriteria || formData.successCriteria.length === 0) return [];
    return typeof formData.successCriteria[0] === 'string'
      ? (formData.successCriteria as string[])
      : (formData.successCriteria as SuccessCriterion[]).map((c) => c.description);
  }, [formData.successCriteria]);

  // Map original criteria to preserve IDs when updating
  const originalCriteriaMap = useMemo(() => {
    if (!goal.successCriteria || goal.successCriteria.length === 0)
      return new Map<string, SuccessCriterion>();
    const map = new Map<string, SuccessCriterion>();
    goal.successCriteria.forEach((criterion) => {
      if (typeof criterion !== 'string') {
        map.set(criterion.description, criterion);
      }
    });
    return map;
  }, [goal.successCriteria]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Transform success criteria: preserve existing IDs, create new ones for new criteria
      const transformedCriteria: SuccessCriterion[] = successCriteriaStrings.map((text, index) => {
        const existing = originalCriteriaMap.get(text);
        if (existing) {
          // Preserve existing criterion with its ID and all properties
          return existing;
        }
        // Create new criterion without ID (backend will assign ID)
        return {
          id: '', // Empty ID for new criteria, backend will assign
          description: text,
          isCompleted: false,
          completedAt: null,
          linkedMetricId: null,
          linkedTaskId: null,
          targetDate: null,
          order: index,
        };
      });

      const submitData: UpdateGoalInput = {
        ...formData,
        successCriteria: transformedCriteria,
      };

      onSubmit(goal.id, submitData);
    },
    [goal.id, formData, successCriteriaStrings, originalCriteriaMap, onSubmit]
  );

  const addCriterion = useCallback(() => {
    if (criterionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        successCriteria: [...successCriteriaStrings, criterionInput.trim()] as string[],
      }));
      setCriterionInput('');
    }
  }, [criterionInput, successCriteriaStrings]);

  const removeCriterion = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        successCriteria: successCriteriaStrings.filter((_, i) => i !== index) as string[],
      }));
    },
    [successCriteriaStrings]
  );

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && (
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
        className={`space-y-6 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={isLoading}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Run a marathon"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your goal..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Area *
            </label>
            <select
              value={formData.area}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  area: e.target.value as Area,
                  subCategory: undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {AREA_LABELS[area]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sub-Category
            </label>
            <select
              value={formData.subCategory || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subCategory: (e.target.value as SubCategory) || undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {availableSubCategories.map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {SUBCATEGORY_LABELS[subCategory]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parent Goal
          </label>
          {isParentSelectionDisabled ? (
            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
              Yearly goals are top-level and cannot have parent goals
            </div>
          ) : (
            <>
              <select
                value={formData.parentGoalId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parentGoalId: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">No parent goal (standalone goal)</option>
                {validParentGoals.map((parentGoal) => (
                  <option key={parentGoal.id} value={parentGoal.id}>
                    [{parentGoal.timeHorizon}] {parentGoal.title}
                  </option>
                ))}
              </select>
              {validParentGoals.length === 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  No valid parent goals available. Only goals one timeframe higher can be parents.
                </p>
              )}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Parent Goal Preview
                    </div>
                    {selectedParentGoal ? (
                      <>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">{selectedParentGoal.title}</span>
                          {selectedParentGoal.description && (
                            <span className="text-gray-600 dark:text-gray-400">
                              {' '}
                              — {selectedParentGoal.description}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            {selectedParentGoal.timeHorizon}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            {selectedParentGoal.area}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            {selectedParentGoal.priority}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                        None (standalone goal)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!formData.parentGoalId && validParentGoals.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select a parent goal to create a hierarchy. Only goals one timeframe higher are
                  available.
                </p>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Horizon *
            </label>
            <select
              value={formData.timeHorizon}
              onChange={(e) => {
                const newTimeHorizon = e.target.value as TimeHorizon;
                // Clear parent goal if it becomes invalid after time horizon change
                const newValidParents = getValidParentGoals(allGoals, newTimeHorizon, goal.id);

                setFormData((prev) => {
                  const currentParentId = prev.parentGoalId;
                  const isCurrentParentStillValid =
                    currentParentId && newValidParents.some((g) => g.id === currentParentId);

                  return {
                    ...prev,
                    timeHorizon: newTimeHorizon,
                    parentGoalId: isCurrentParentStillValid ? currentParentId : undefined,
                  };
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {GOAL_TIME_HORIZONS.map((horizon) => (
                <option key={horizon} value={horizon}>
                  {horizon}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority *
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, priority: e.target.value as Priority }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value as GoalStatus }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GOAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {GOAL_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Date
            </label>
            <input
              type="date"
              value={formData.targetDate || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Success Criteria
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={criterionInput}
              onChange={(e) => setCriterionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriterion())}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a success criterion..."
            />
            <Button type="button" variant="secondary" size="sm" onClick={addCriterion}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {successCriteriaStrings.length > 0 && (
            <div className="space-y-2">
              {successCriteriaStrings.map((criterion, index) => (
                <div
                  key={`${criterion}-${index}`}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-900 dark:text-white">{criterion}</span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
