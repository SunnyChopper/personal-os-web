import { useState, useEffect, useMemo, useRef, type ReactNode, type FormEvent } from 'react';
import { Link2, GitBranch, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  Task,
  UpdateTaskInput,
  Area,
  SubCategory,
  Priority,
  TaskStatus,
  EntitySummary,
  CreateTaskInput,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { EntityLinkChip } from '@/components/atoms/EntityLinkChip';
import { DependencyBadge } from '@/components/atoms/DependencyBadge';
import Dialog from '@/components/molecules/Dialog';
import { RelationshipPicker } from '@/components/organisms/RelationshipPicker';
import { AITaskAssistPanel } from '@/components/molecules/AITaskAssistPanel';
import { TaskContextVibePills } from '@/components/molecules/TaskContextVibePills';
import { llmConfig } from '@/lib/llm';
import { cn } from '@/lib/utils';
import { extractDateOnly } from '@/utils/date-formatters';
import {
  buildTaskEditFormSnapshot,
  taskEditFormSnapshotsEqual,
} from '@/lib/growth-system/task-edit-form-snapshot';
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

const TASK_EDIT_FORM_ID = 'task-edit-form';

interface TaskEditPanelProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateTaskInput) => Promise<void>;
  isLoading?: boolean;
  dependencies: Task[];
  blockedBy: Task[];
  linkedProjects: EntitySummary[];
  linkedGoals: EntitySummary[];
  availableTasks: Task[];
  availableProjects: EntitySummary[];
  availableGoals: EntitySummary[];
  onDependencyAdd: (taskId: string, dependsOnId: string) => Promise<void>;
  onDependencyRemove: (taskId: string, dependsOnId: string) => Promise<void>;
  onCreateSubtasks?: (subtasks: CreateTaskInput[]) => void;
}

function FormSection({
  title,
  description,
  first = false,
  children,
}: {
  title: string;
  description?: string;
  first?: boolean;
  children: ReactNode;
}) {
  const sectionId = `task-edit-section-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section
      className={cn('space-y-3', !first && 'border-t border-gray-200 dark:border-gray-700 pt-4')}
      aria-labelledby={sectionId}
    >
      <div>
        <h4 id={sectionId} className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const fieldClassName =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

export function TaskEditPanel({
  task,
  isOpen,
  onClose,
  onSave,
  isLoading,
  dependencies,
  blockedBy,
  linkedProjects,
  linkedGoals,
  availableTasks,
  availableProjects,
  availableGoals,
  onDependencyAdd,
  onDependencyRemove,
  onCreateSubtasks,
}: TaskEditPanelProps) {
  const [formData, setFormData] = useState<UpdateTaskInput>({
    title: task.title,
    description: task.description || '',
    extendedDescription: task.extendedDescription || '',
    area: task.area,
    subCategory: task.subCategory || undefined,
    priority: task.priority,
    status: task.status,
    size: task.size || undefined,
    dueDate: task.dueDate ? extractDateOnly(task.dueDate) : '',
    scheduledDate: task.scheduledDate ? extractDateOnly(task.scheduledDate) : '',
    notes: task.notes || '',
    pointValue: task.pointValue || undefined,
    energyLevel: task.energyLevel ?? undefined,
    executionWindow: task.executionWindow ?? undefined,
  });

  const [isDependencyPickerOpen, setIsDependencyPickerOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [isGoalPickerOpen, setIsGoalPickerOpen] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiMode, setAIMode] = useState<'breakdown' | 'priority' | 'estimate' | 'dependencies'>(
    'breakdown'
  );
  const isAIConfigured = llmConfig.isConfigured();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<ReturnType<typeof buildTaskEditFormSnapshot> | null>(
    null
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const nextFormData: UpdateTaskInput = {
      title: task.title,
      description: task.description || '',
      extendedDescription: task.extendedDescription || '',
      area: task.area,
      subCategory: task.subCategory || undefined,
      priority: task.priority,
      status: task.status,
      size: task.size || undefined,
      dueDate: task.dueDate ? extractDateOnly(task.dueDate) : '',
      scheduledDate: task.scheduledDate ? extractDateOnly(task.scheduledDate) : '',
      notes: task.notes || '',
      pointValue: task.pointValue || undefined,
      energyLevel: task.energyLevel ?? undefined,
      executionWindow: task.executionWindow ?? undefined,
    };
    const nextDeps = dependencies.map((d) => d.id);
    const nextProjects = linkedProjects.map((p) => p.id);
    const nextGoals = linkedGoals.map((g) => g.id);

    setFormData(nextFormData);
    setSelectedDependencies(nextDeps);
    setSelectedProjects(nextProjects);
    setSelectedGoals(nextGoals);
    setSubmitAttempted(false);
    setTitleTouched(false);
    setError(null);
    setBaseline(
      buildTaskEditFormSnapshot({
        title: nextFormData.title ?? '',
        description: nextFormData.description ?? '',
        notes: nextFormData.notes ?? '',
        area: nextFormData.area ?? task.area,
        subCategory: nextFormData.subCategory,
        priority: nextFormData.priority ?? task.priority,
        status: nextFormData.status ?? task.status,
        size: nextFormData.size,
        dueDate: nextFormData.dueDate ?? '',
        scheduledDate: nextFormData.scheduledDate ?? '',
        pointValue: nextFormData.pointValue,
        energyLevel: nextFormData.energyLevel,
        executionWindow: nextFormData.executionWindow,
        projectIds: nextProjects,
        goalIds: nextGoals,
        dependencyIds: nextDeps,
      })
    );
  }, [task, dependencies, linkedProjects, linkedGoals]);

  const currentSnapshot = useMemo(
    () =>
      buildTaskEditFormSnapshot({
        title: formData.title ?? '',
        description: formData.description ?? '',
        notes: formData.notes ?? '',
        area: formData.area ?? task.area,
        subCategory: formData.subCategory,
        priority: formData.priority ?? task.priority,
        status: formData.status ?? task.status,
        size: formData.size,
        dueDate: formData.dueDate ?? '',
        scheduledDate: formData.scheduledDate ?? '',
        pointValue: formData.pointValue,
        energyLevel: formData.energyLevel,
        executionWindow: formData.executionWindow,
        projectIds: selectedProjects,
        goalIds: selectedGoals,
        dependencyIds: selectedDependencies,
      }),
    [
      formData,
      task.area,
      task.priority,
      task.status,
      selectedProjects,
      selectedGoals,
      selectedDependencies,
    ]
  );

  const isDirty = baseline !== null && !taskEditFormSnapshotsEqual(currentSnapshot, baseline);

  const titleError =
    !(formData.title ?? '').trim() && (submitAttempted || titleTouched)
      ? 'Title is required.'
      : null;
  const hasBlockingValidation = Boolean(titleError);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);

    if (!(formData.title ?? '').trim()) {
      titleInputRef.current?.focus();
      return;
    }

    setIsSaving(true);

    try {
      const input: UpdateTaskInput = {
        ...formData,
        description: formData.description || undefined,
        extendedDescription: formData.extendedDescription || undefined,
        notes: formData.notes?.trim() ? formData.notes : null,
        dueDate: formData.dueDate || null,
        scheduledDate: formData.scheduledDate || null,
        size: formData.size || undefined,
        projectIds: selectedProjects,
        goalIds: selectedGoals,
        ...(formData.energyLevel !== undefined ? { energyLevel: formData.energyLevel } : {}),
        ...(formData.executionWindow !== undefined
          ? { executionWindow: formData.executionWindow }
          : {}),
      };
      await onSave(task.id, input);

      const currentDepIds = new Set(dependencies.map((d) => d.id));
      const newDepIds = new Set(selectedDependencies);

      const dependencyRemovals = Array.from(currentDepIds)
        .filter((id) => !newDepIds.has(id))
        .map((id) => onDependencyRemove(task.id, id));

      const dependencyAdditions = Array.from(newDepIds)
        .filter((id) => !currentDepIds.has(id))
        .map((id) => onDependencyAdd(task.id, id));

      await Promise.all([...dependencyRemovals, ...dependencyAdditions]);

      showToast({
        type: 'success',
        title: 'Task updated',
        message: 'Your changes have been saved successfully.',
      });
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update task. Please try again.';
      setError(errorMessage);
      showToast({
        type: 'error',
        title: 'Failed to update task',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPriority = (priority: string) => {
    setFormData({ ...formData, priority: priority as Priority });
  };

  const handleApplyEffort = (size: number) => {
    setFormData({ ...formData, size });
  };

  const handleApplyBreakdown = (subtasks: CreateTaskInput[]) => {
    const normalized = subtasks.map((st) => {
      const ext = st as CreateTaskInput & { storyPoints?: number };
      return {
        ...ext,
        size: 1,
        area: task.area,
        priority: task.priority,
        parentTaskId: task.id,
        projectIds: task.projectIds?.length ? [...task.projectIds] : undefined,
        goalIds: task.goalIds?.length ? [...task.goalIds] : undefined,
        status: 'Not Started' as const,
      } as CreateTaskInput;
    });
    onCreateSubtasks?.(normalized);
  };

  const handleApplyDependencies = async (taskIds: string[]) => {
    const additions = taskIds
      .filter((id) => !selectedDependencies.includes(id))
      .map((id) => onDependencyAdd(task.id, id));

    try {
      await Promise.all(additions);
      setSelectedDependencies([...new Set([...selectedDependencies, ...taskIds])]);
    } catch (applyError) {
      const errorMessage =
        applyError instanceof Error ? applyError.message : 'Failed to add dependencies.';
      showToast({
        type: 'error',
        title: 'Failed to add dependencies',
        message: errorMessage,
      });
    }
  };

  // TaskResponse.area is a free string; unknown/missing keys must not crash .map
  const availableSubCategories = SUBCATEGORIES_BY_AREA[formData.area || task.area] || [];

  const taskEntities: EntitySummary[] = availableTasks
    .filter((t) => t.id !== task.id)
    .map((t) => ({
      id: t.id,
      title: t.title,
      type: 'task',
      area: t.area,
      status: t.status,
    }));

  const displayDependencies = selectedDependencies
    .map((id) => availableTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined)
    .map((t) => ({
      id: t.id,
      title: t.title,
      type: 'task' as const,
      area: t.area,
      status: t.status,
    }));

  const displayProjects = selectedProjects
    .map((id) => availableProjects.find((p) => p.id === id))
    .filter((p): p is EntitySummary => p !== undefined);

  const displayGoals = selectedGoals
    .map((id) => availableGoals.find((g) => g.id === id))
    .filter((g): g is EntitySummary => g !== undefined);

  const busy = isLoading || isSaving;

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isDirty ? (
        <span role="status" className="mr-auto text-sm text-amber-700 dark:text-amber-300">
          Unsaved changes
        </span>
      ) : (
        <span className="mr-auto" aria-hidden />
      )}
      <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button
        type="submit"
        form={TASK_EDIT_FORM_ID}
        variant="primary"
        size="sm"
        disabled={busy || !isDirty || hasBlockingValidation}
      >
        {busy ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  );

  const body = (
    <form id={TASK_EDIT_FORM_ID} onSubmit={handleSubmit} className="min-w-0">
      <fieldset disabled={busy} className="min-w-0 space-y-4 border-0 m-0 p-0 disabled:opacity-60">
        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error</p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        <FormSection title="Identity" description="What this task is." first>
          <div>
            <label
              htmlFor="task-edit-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Title *
            </label>
            <input
              ref={titleInputRef}
              id="task-edit-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => setTitleTouched(true)}
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? 'task-edit-title-error' : undefined}
              className={cn(
                fieldClassName,
                titleError && 'border-red-500 dark:border-red-500 focus:ring-red-500'
              )}
            />
            {titleError ? (
              <p id="task-edit-title-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {titleError}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="task-edit-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <Textarea
              id="task-edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={cn(fieldClassName, 'max-h-40 overflow-y-auto resize-y')}
            />
          </div>

          <div>
            <label
              htmlFor="task-edit-notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes
            </label>
            <Textarea
              id="task-edit-notes"
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes"
              className={cn(fieldClassName, 'max-h-40 overflow-y-auto resize-y')}
            />
          </div>
        </FormSection>

        <FormSection title="Classification" description="Where this sits and how urgent it is.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-edit-area"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Area *
              </label>
              <Select
                id="task-edit-area"
                value={formData.area}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    area: e.target.value as Area,
                    subCategory: undefined,
                  })
                }
                className={fieldClassName}
              >
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {AREA_LABELS[area]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor="task-edit-subcategory"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Sub-Category
              </label>
              <Select
                id="task-edit-subcategory"
                value={formData.subCategory || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subCategory: (e.target.value as SubCategory) || undefined,
                  })
                }
                className={fieldClassName}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-edit-priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Priority
              </label>
              <Select
                id="task-edit-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className={fieldClassName}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor="task-edit-status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Status
              </label>
              <Select
                id="task-edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className={fieldClassName}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Context & Vibe"
          description="Energy and timing fit for when you work on this."
        >
          <TaskContextVibePills
            hideHeading
            energyLevel={formData.energyLevel}
            executionWindow={formData.executionWindow}
            onEnergyChange={(value) =>
              setFormData({
                ...formData,
                energyLevel: value === null ? null : value,
              })
            }
            onExecutionWindowChange={(value) =>
              setFormData({
                ...formData,
                executionWindow: value === null ? null : value,
              })
            }
          />
        </FormSection>

        <FormSection
          title="Scheduling & Points"
          description="Due date, scheduled date, effort estimate, and reward points."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label
                htmlFor="task-edit-due-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Due Date
              </label>
              <input
                id="task-edit-due-date"
                type="date"
                value={formData.dueDate ?? ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="task-edit-scheduled-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Scheduled Date
              </label>
              <input
                id="task-edit-scheduled-date"
                type="date"
                value={formData.scheduledDate ?? ''}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="task-edit-story-points"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Story points (Fibonacci)
            </label>
            <Select
              id="task-edit-story-points"
              value={formData.size ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  size: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                })
              }
              className={fieldClassName}
            >
              <option value="">Not set</option>
              {TASK_STORY_POINTS_FIBONACCI.map((n) => (
                <option key={n} value={n}>
                  {n} pts
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Story points are not a time estimate — use 1, 2, 3, 5, 8, 13, or 21 only.
          </p>

          <div>
            <label
              htmlFor="task-edit-point-value"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Point Value
            </label>
            <div className="flex gap-2">
              <input
                id="task-edit-point-value"
                type="number"
                min="0"
                value={formData.pointValue || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointValue: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="AI-calculated"
                className={cn(fieldClassName, 'flex-1')}
              />
              {isAIConfigured ? (
                <button
                  type="button"
                  onClick={() => {
                    setAIMode('estimate');
                    setShowAIAssist(true);
                  }}
                  className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  title="Calculate with AI"
                  aria-label="Calculate point value with AI"
                >
                  <Sparkles size={18} />
                </button>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reward points earned for completing this task
            </p>
          </div>
        </FormSection>

        {isAIConfigured ? (
          <FormSection
            title="AI Tools"
            description="Assist with breakdown, priority, and estimates."
          >
            <button
              type="button"
              onClick={() => setShowAIAssist(!showAIAssist)}
              className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-expanded={showAIAssist}
            >
              <Sparkles size={18} />
              <span>{showAIAssist ? 'Hide AI tools' : 'Show AI tools'}</span>
              {showAIAssist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAIAssist ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['breakdown', 'Break Down'],
                      ['priority', 'Priority Advisor'],
                      ['estimate', 'Estimate story points'],
                      ['dependencies', 'Find Dependencies'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAIMode(mode)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                        aiMode === mode
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <AITaskAssistPanel
                  mode={aiMode}
                  onClose={() => setShowAIAssist(false)}
                  onApplyPriority={handleApplyPriority}
                  onApplyEffort={handleApplyEffort}
                  onApplyBreakdown={handleApplyBreakdown}
                  onApplyDependencies={handleApplyDependencies}
                  currentTask={task}
                  allTasks={availableTasks}
                />
              </div>
            ) : null}
          </FormSection>
        ) : null}

        <FormSection title="Dependencies" description="What blocks or enables this task.">
          <div className="space-y-3">
            {blockedBy.length > 0 ? (
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blocked By ({blockedBy.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {blockedBy.map((dep) => (
                    <DependencyBadge key={dep.id} type="blocked" count={1} />
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between gap-2">
                <span>Depends On ({displayDependencies.length})</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDependencyPickerOpen(true)}
                >
                  Manage Dependencies
                </Button>
              </div>
              {displayDependencies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {displayDependencies.map((dep) => (
                    <EntityLinkChip
                      key={dep.id}
                      id={dep.id}
                      label={dep.title}
                      type="task"
                      area={dep.area}
                      size="sm"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </FormSection>

        <FormSection title="Relationships" description="Linked projects and goals.">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" aria-hidden />
                  Projects ({displayProjects.length})
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsProjectPickerOpen(true)}
                >
                  Link Projects
                </Button>
              </div>
              {displayProjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {displayProjects.map((project) => (
                    <EntityLinkChip
                      key={project.id}
                      id={project.id}
                      label={project.title}
                      type="project"
                      area={project.area}
                      size="sm"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" aria-hidden />
                  Goals ({displayGoals.length})
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsGoalPickerOpen(true)}
                >
                  Link Goals
                </Button>
              </div>
              {displayGoals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {displayGoals.map((goal) => (
                    <EntityLinkChip
                      key={goal.id}
                      id={goal.id}
                      label={goal.title}
                      type="goal"
                      area={goal.area}
                      size="sm"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </FormSection>
      </fieldset>
    </form>
  );

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Task"
        size="xl"
        className="max-w-3xl"
        footer={footer}
        trapFocus
      >
        {body}
      </Dialog>

      <RelationshipPicker
        isOpen={isDependencyPickerOpen}
        onClose={() => setIsDependencyPickerOpen(false)}
        title="Manage Dependencies"
        entities={taskEntities}
        selectedIds={selectedDependencies}
        onSelectionChange={setSelectedDependencies}
        entityType="task"
      />

      <RelationshipPicker
        isOpen={isProjectPickerOpen}
        onClose={() => setIsProjectPickerOpen(false)}
        title="Link to Projects"
        entities={availableProjects}
        selectedIds={selectedProjects}
        onSelectionChange={setSelectedProjects}
        entityType="project"
      />

      <RelationshipPicker
        isOpen={isGoalPickerOpen}
        onClose={() => setIsGoalPickerOpen(false)}
        title="Link to Goals"
        entities={availableGoals}
        selectedIds={selectedGoals}
        onSelectionChange={setSelectedGoals}
        entityType="goal"
      />
    </>
  );
}
