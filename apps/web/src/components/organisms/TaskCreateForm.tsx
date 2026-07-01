import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, GitBranch, Link2 } from 'lucide-react';
import type {
  CreateTaskInput,
  Area,
  SubCategory,
  Priority,
  TaskStatus,
  EntitySummary,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { EntityLinkChip } from '@/components/atoms/EntityLinkChip';
import { RelationshipPicker } from '@/components/organisms/RelationshipPicker';
import { AITaskAssistPanel } from '@/components/molecules/AITaskAssistPanel';
import { TaskContextVibePills } from '@/components/molecules/TaskContextVibePills';
import { TaskCoreFormFields } from '@/components/molecules/TaskCoreFormFields';
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
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

interface TaskCreateFormProps {
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  /** Tasks that can be selected as "depends on" (excludes the draft task). */
  dependencyPickerEntities?: EntitySummary[];
  projectPickerEntities?: EntitySummary[];
  goalPickerEntities?: EntitySummary[];
}

export function TaskCreateForm({
  onSubmit,
  onCancel,
  isLoading,
  dependencyPickerEntities = [],
  projectPickerEntities = [],
  goalPickerEntities = [],
}: TaskCreateFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    extendedDescription: '',
    area: 'Operations',
    subCategory: undefined,
    priority: 'P3',
    status: 'Backlog',
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
  const [dependencyPickerOpen, setDependencyPickerOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [dependsOnTaskIds, setDependsOnTaskIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const isAIConfigured = llmConfig.isConfigured();

  const hasRelationshipSelections = selectedProjectIds.length > 0 || selectedGoalIds.length > 0;
  const isBusy = isLoading || isSubmitting;
  const submitLabel = isBusy
    ? hasRelationshipSelections
      ? 'Creating and linking...'
      : 'Creating...'
    : 'Create Task';

  const displayProjects = selectedProjectIds
    .map((id) => projectPickerEntities.find((p) => p.id === id))
    .filter((p): p is EntitySummary => p != null);
  const displayGoals = selectedGoalIds
    .map((id) => goalPickerEntities.find((g) => g.id === id))
    .filter((g): g is EntitySummary => g != null);

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
        ...(dependsOnTaskIds.length ? { dependsOnTaskIds } : {}),
        ...(selectedProjectIds.length ? { projectIds: selectedProjectIds } : {}),
        ...(selectedGoalIds.length ? { goalIds: selectedGoalIds } : {}),
        ...(formData.energyLevel ? { energyLevel: formData.energyLevel } : {}),
        ...(formData.executionWindow ? { executionWindow: formData.executionWindow } : {}),
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
    <>
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isLoading || isSubmitting}
          className="min-w-0 space-y-4 border-0 p-0 m-0 disabled:opacity-60"
        >
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

          <TaskCoreFormFields
            values={{ title: formData.title, description: formData.description }}
            onChange={(field, value) => setFormData({ ...formData, [field]: value })}
            disabled={isLoading}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Area *
              </label>
              <Select
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
              </Select>
            </div>

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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <TaskContextVibePills
            energyLevel={formData.energyLevel}
            executionWindow={formData.executionWindow}
            onEnergyChange={(value) =>
              setFormData({
                ...formData,
                energyLevel: value === null ? undefined : value,
              })
            }
            onExecutionWindowChange={(value) =>
              setFormData({
                ...formData,
                executionWindow: value === null ? undefined : value,
              })
            }
          />

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
            <Select
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
            </Select>
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
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes"
            />
          </div>

          {(projectPickerEntities.length > 0 || goalPickerEntities.length > 0) && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Relationships
              </p>
              {projectPickerEntities.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProjectIds.length
                        ? `${selectedProjectIds.length} project${selectedProjectIds.length === 1 ? '' : 's'} selected`
                        : 'Optional — link to projects'}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setProjectPickerOpen(true)}
                    >
                      Choose
                    </Button>
                  </div>
                  {displayProjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {displayProjects.map((project) => (
                        <EntityLinkChip
                          key={project.id}
                          id={project.id}
                          label={project.title}
                          type="project"
                          area={project.area}
                          onRemove={() =>
                            setSelectedProjectIds((ids) => ids.filter((id) => id !== project.id))
                          }
                          size="sm"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {goalPickerEntities.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedGoalIds.length
                        ? `${selectedGoalIds.length} goal${selectedGoalIds.length === 1 ? '' : 's'} selected`
                        : 'Optional — link to goals'}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setGoalPickerOpen(true)}
                    >
                      Choose
                    </Button>
                  </div>
                  {displayGoals.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {displayGoals.map((goal) => (
                        <EntityLinkChip
                          key={goal.id}
                          id={goal.id}
                          label={goal.title}
                          type="goal"
                          area={goal.area}
                          onRemove={() =>
                            setSelectedGoalIds((ids) => ids.filter((id) => id !== goal.id))
                          }
                          size="sm"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {dependencyPickerEntities.length > 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Depends on</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {dependsOnTaskIds.length
                      ? `${dependsOnTaskIds.length} predecessor task${dependsOnTaskIds.length === 1 ? '' : 's'} selected`
                      : 'Optional — link blocking tasks'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDependencyPickerOpen(true)}
                >
                  <GitBranch className="w-4 h-4 mr-2 inline" />
                  Choose
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isBusy}>
              {submitLabel}
            </Button>
          </div>
        </fieldset>
      </form>

      <RelationshipPicker
        isOpen={dependencyPickerOpen}
        onClose={() => setDependencyPickerOpen(false)}
        title="Task depends on"
        entities={dependencyPickerEntities}
        selectedIds={dependsOnTaskIds}
        onSelectionChange={setDependsOnTaskIds}
        entityType="task"
      />

      <RelationshipPicker
        isOpen={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        title="Link to Projects"
        entities={projectPickerEntities}
        selectedIds={selectedProjectIds}
        onSelectionChange={setSelectedProjectIds}
        entityType="project"
      />

      <RelationshipPicker
        isOpen={goalPickerOpen}
        onClose={() => setGoalPickerOpen(false)}
        title="Link to Goals"
        entities={goalPickerEntities}
        selectedIds={selectedGoalIds}
        onSelectionChange={setSelectedGoalIds}
        entityType="goal"
      />
    </>
  );
}
