import { useState } from 'react';
import { Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import type {
  CreateGoalInput,
  Area,
  SubCategory,
  TimeHorizon,
  SuccessCriterion,
  Goal,
} from '@/types/growth-system';
import type { ApiError } from '@/types/api-contracts';
import Button from '@/components/atoms/Button';
import {
  AREAS,
  AREA_LABELS,
  SUBCATEGORIES_BY_AREA,
  SUBCATEGORY_LABELS,
} from '@/constants/growth-system';

interface GoalCreateFormProps {
  onSubmit: (input: CreateGoalInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  parentGoal?: Goal | null;
  error?: string | ApiError | null;
  allGoals?: Goal[]; // For parent goal selector
}

export function GoalCreateForm({
  onSubmit,
  onCancel,
  isLoading,
  parentGoal,
  error: externalError,
  allGoals = [],
}: GoalCreateFormProps) {
  // Time horizon hierarchy: Yearly > Quarterly > Monthly > Weekly > Daily
  const TIME_HORIZON_HIERARCHY: TimeHorizon[] = [
    'Yearly',
    'Quarterly',
    'Monthly',
    'Weekly',
    'Daily',
  ];

  /** Creatable horizons: nothing smaller than Weekly (Daily is excluded everywhere). */
  const CREATABLE_TIME_HORIZONS = TIME_HORIZON_HIERARCHY.filter((h) => h !== 'Daily');

  // Determine the next time horizon if creating a subgoal
  const getNextTimeHorizon = (parentHorizon: string): TimeHorizon => {
    const currentIndex = TIME_HORIZON_HIERARCHY.indexOf(parentHorizon as TimeHorizon);
    if (currentIndex < 0 || currentIndex >= TIME_HORIZON_HIERARCHY.length - 1) {
      return 'Quarterly';
    }
    const next = TIME_HORIZON_HIERARCHY[currentIndex + 1];
    // Daily goals are not creatable; smallest subgoal under Monthly is Weekly
    if (next === 'Daily') {
      return 'Weekly';
    }
    return next;
  };

  // Get the valid parent time horizon for a given time horizon
  // A goal can only have a parent that is exactly one level above
  const getValidParentTimeHorizon = (timeHorizon: TimeHorizon): TimeHorizon | null => {
    const currentIndex = TIME_HORIZON_HIERARCHY.indexOf(timeHorizon);
    if (currentIndex <= 0) return null; // Yearly has no parent, invalid horizons return null
    return TIME_HORIZON_HIERARCHY[currentIndex - 1];
  };

  // Check if a goal is a valid parent for the current time horizon
  const isValidParent = (goal: Goal, currentTimeHorizon: TimeHorizon): boolean => {
    const validParentHorizon = getValidParentTimeHorizon(currentTimeHorizon);
    if (!validParentHorizon) return false; // Yearly goals can't have parents
    return goal.timeHorizon === validParentHorizon;
  };

  const [formData, setFormData] = useState<CreateGoalInput>({
    title: '',
    description: '',
    area: parentGoal?.area || 'Health',
    timeHorizon: parentGoal ? getNextTimeHorizon(parentGoal.timeHorizon) : 'Yearly',
    successCriteria: [] as string[],
    parentGoalId: parentGoal?.id,
  });

  const [criterionInput, setCriterionInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = (field: string, value: unknown): string => {
    switch (field) {
      case 'title':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          return 'Title is required';
        }
        if (typeof value === 'string' && value.trim().length < 2) {
          return 'Title must be at least 2 characters';
        }
        if (typeof value === 'string' && value.trim().length > 200) {
          return 'Title must be no more than 200 characters';
        }
        break;
      case 'area':
        if (!value) {
          return 'Area is required';
        }
        break;
      case 'timeHorizon':
        if (!value) {
          return 'Time horizon is required';
        }
        break;
    }
    return '';
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const titleError = validateField('title', formData.title);
    if (titleError) errors.title = titleError;

    const areaError = validateField('area', formData.area);
    if (areaError) errors.area = areaError;

    const timeHorizonError = validateField('timeHorizon', formData.timeHorizon);
    if (timeHorizonError) errors.timeHorizon = timeHorizonError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof CreateGoalInput]);
    if (error) {
      setFieldErrors({ ...fieldErrors, [field]: error });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  };

  const handleChange = <K extends keyof CreateGoalInput>(field: K, value: CreateGoalInput[K]) => {
    const updatedFormData = { ...formData, [field]: value };

    // When time horizon changes, validate and clear invalid parent goal selection
    if (field === 'timeHorizon') {
      const newTimeHorizon = value as TimeHorizon;

      // If a parent goal is selected, check if it's still valid
      if (updatedFormData.parentGoalId) {
        const selectedParent = allGoals.find((g) => g.id === updatedFormData.parentGoalId);
        if (selectedParent && !isValidParent(selectedParent, newTimeHorizon)) {
          // Clear invalid parent selection
          updatedFormData.parentGoalId = undefined;
        }
      }

      // If there's a suggested parent goal, check if it's still valid
      if (parentGoal && !isValidParent(parentGoal, newTimeHorizon)) {
        // The suggested parent is no longer valid, but we'll handle this in the UI
        // by not showing the "Use This" button
      }
    }

    setFormData(updatedFormData);
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      title: true,
      area: true,
      timeHorizon: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare clean submit data - only include fields that are in CreateGoalInput
    const submitData: CreateGoalInput = {
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      area: formData.area,
      subCategory: formData.subCategory || undefined,
      timeHorizon: formData.timeHorizon,
      targetDate: formData.targetDate || undefined,
      successCriteria: formData.successCriteria || undefined,
      parentGoalId: formData.parentGoalId || undefined,
      notes: formData.notes?.trim() || undefined,
      progressConfig: formData.progressConfig || undefined,
      // Explicitly exclude fields not in CreateGoalInput
      // priority and status are not supported by backend
      // dailyTarget and weeklyTarget are for habits, not goals
    };

    onSubmit(submitData);
  };

  const addCriterion = () => {
    if (criterionInput.trim()) {
      const currentCriteria = Array.isArray(formData.successCriteria)
        ? typeof formData.successCriteria[0] === 'string'
          ? (formData.successCriteria as string[])
          : (formData.successCriteria as SuccessCriterion[]).map((c) => c.description)
        : [];
      setFormData({
        ...formData,
        successCriteria: [...currentCriteria, criterionInput.trim()] as string[],
      });
      setCriterionInput('');
    }
  };

  const removeCriterion = (index: number) => {
    const currentCriteria = Array.isArray(formData.successCriteria)
      ? typeof formData.successCriteria[0] === 'string'
        ? (formData.successCriteria as string[])
        : (formData.successCriteria as SuccessCriterion[]).map((c) => c.description)
      : [];
    setFormData({
      ...formData,
      successCriteria: currentCriteria.filter((_, i) => i !== index) as string[],
    });
  };

  // Parse error to extract message and validation details
  const parseError = (
    error: string | ApiError | null | undefined
  ): { message: string; details: Array<{ field: string; message: string }> } | null => {
    if (!error) return null;

    // If it's a string, return it as the message
    if (typeof error === 'string') {
      return { message: error, details: [] };
    }

    // If it's an ApiError object, parse it
    const message = error.message || 'An error occurred';
    const details: Array<{ field: string; message: string }> = [];

    // Check if details is an array (validation errors)
    if (error.details && Array.isArray(error.details)) {
      const validationDetails = error.details as Array<{
        type?: string;
        loc?: unknown[];
        msg?: string;
        input?: unknown;
      }>;

      validationDetails.forEach((detail) => {
        // Extract field name from location array (e.g., ["body", "parentGoalId"] -> "parentGoalId")
        const field =
          detail.loc && Array.isArray(detail.loc) && detail.loc.length > 0
            ? String(detail.loc[detail.loc.length - 1])
            : 'field';

        // Capitalize first letter and format field name
        const fieldName =
          field.charAt(0).toUpperCase() +
          field
            .slice(1)
            .replace(/([A-Z])/g, ' $1')
            .trim();
        const detailMessage = detail.msg || 'Invalid value';

        details.push({
          field: fieldName,
          message: detailMessage,
        });
      });
    }

    return { message, details };
  };

  const parsedError = parseError(externalError);

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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Creating goal...</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={isLoading}
      >
        {parsedError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  {parsedError.details.length > 0 ? 'Validation Error' : 'Error'}
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{parsedError.message}</p>
                {parsedError.details.length > 0 && (
                  <ul className="mt-3 space-y-1.5 list-disc list-inside">
                    {parsedError.details.map((detail, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300">
                        <span className="font-medium">{detail.field}:</span> {detail.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {parentGoal && isValidParent(parentGoal, formData.timeHorizon) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Parent goal:
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                {parentGoal.timeHorizon}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {parentGoal.title}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Time horizon is set to <span className="font-medium">{formData.timeHorizon}</span>{' '}
              (next level down). The link below is pre-filled; change it only if you need a
              different parent.
            </p>
          </div>
        )}
        {parentGoal && !isValidParent(parentGoal, formData.timeHorizon) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                The suggested parent goal ({parentGoal.timeHorizon} - {parentGoal.title}) is not
                compatible with the selected time horizon ({formData.timeHorizon}). A{' '}
                {formData.timeHorizon} goal can only have a{' '}
                {getValidParentTimeHorizon(formData.timeHorizon) || 'none'} parent.
              </p>
            </div>
          </div>
        )}

        {/* Parent Goal Selector - Explicit linking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link to Parent Goal (Optional)
          </label>
          <select
            value={formData.parentGoalId || ''}
            onChange={(e) =>
              handleChange('parentGoalId', (e.target.value || undefined) as string | undefined)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No parent goal (standalone goal)</option>
            {(() => {
              const validParentGoals = allGoals.filter((goal) =>
                isValidParent(goal, formData.timeHorizon)
              );

              // Show suggested parent if it's valid
              if (parentGoal && isValidParent(parentGoal, formData.timeHorizon)) {
                return (
                  <>
                    <option value={parentGoal.id}>
                      [{parentGoal.timeHorizon}] {parentGoal.title} (suggested)
                    </option>
                    {validParentGoals
                      .filter((g) => g.id !== parentGoal.id)
                      .map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          [{goal.timeHorizon}] {goal.title}
                        </option>
                      ))}
                  </>
                );
              }

              // Show all valid parent goals
              return validParentGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  [{goal.timeHorizon}] {goal.title}
                </option>
              ));
            })()}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(() => {
              const validParentHorizon = getValidParentTimeHorizon(formData.timeHorizon);
              if (!validParentHorizon) {
                return 'Yearly goals cannot have parent goals.';
              }
              return `Explicitly link this goal to a parent goal to create a hierarchy. Only ${validParentHorizon} goals can be parents for ${formData.timeHorizon} goals.`;
            })()}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.title && touched.title
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., Run a marathon"
            required
            aria-invalid={!!(fieldErrors.title && touched.title)}
            aria-describedby={fieldErrors.title && touched.title ? 'title-error' : undefined}
          />
          {fieldErrors.title && touched.title && (
            <p
              id="title-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value || undefined)}
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
              onChange={(e) => handleChange('area', e.target.value as Area)}
              onBlur={() => handleBlur('area')}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.area && touched.area
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              required
              aria-invalid={!!(fieldErrors.area && touched.area)}
              aria-describedby={fieldErrors.area && touched.area ? 'area-error' : undefined}
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {AREA_LABELS[area]}
                </option>
              ))}
            </select>
            {fieldErrors.area && touched.area && (
              <p
                id="area-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {fieldErrors.area}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sub-Category
            </label>
            <select
              value={formData.subCategory || ''}
              onChange={(e) =>
                handleChange(
                  'subCategory',
                  (e.target.value || undefined) as SubCategory | undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Optional</option>
              {SUBCATEGORIES_BY_AREA[formData.area].map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {SUBCATEGORY_LABELS[subCategory]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Horizon *
          </label>
          <select
            value={formData.timeHorizon}
            onChange={(e) => handleChange('timeHorizon', e.target.value as TimeHorizon)}
            onBlur={() => handleBlur('timeHorizon')}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.timeHorizon && touched.timeHorizon
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            required
            aria-invalid={!!(fieldErrors.timeHorizon && touched.timeHorizon)}
            aria-describedby={
              fieldErrors.timeHorizon && touched.timeHorizon ? 'timeHorizon-error' : undefined
            }
          >
            {CREATABLE_TIME_HORIZONS.map((horizon) => (
              <option key={horizon} value={horizon}>
                {horizon}
              </option>
            ))}
          </select>
          {fieldErrors.timeHorizon && touched.timeHorizon && (
            <p
              id="timeHorizon-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.timeHorizon}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Date
          </label>
          <input
            type="date"
            value={formData.targetDate || ''}
            onChange={(e) => handleChange('targetDate', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          {formData.successCriteria && formData.successCriteria.length > 0 && (
            <div className="space-y-2">
              {formData.successCriteria.map((criterion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-900 dark:text-white">
                    {typeof criterion === 'string' ? criterion : criterion.description}
                  </span>
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
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value || undefined)}
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
            {isLoading ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
