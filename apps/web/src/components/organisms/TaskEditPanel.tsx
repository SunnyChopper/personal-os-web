import { useState, useEffect } from 'react';
import {
  X,
  Link2,
  GitBranch,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
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
import { RelationshipPicker } from '@/components/organisms/RelationshipPicker';
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
  onProjectLink: (taskId: string, projectId: string) => Promise<void>;
  onProjectUnlink: (taskId: string, projectId: string) => Promise<void>;
  onGoalLink: (taskId: string, goalId: string) => Promise<void>;
  onGoalUnlink: (taskId: string, goalId: string) => Promise<void>;
  onCreateSubtasks?: (subtasks: CreateTaskInput[]) => void;
}

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
  onProjectLink,
  onProjectUnlink,
  onGoalLink,
  onGoalUnlink,
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
    dueDate: task.dueDate || '',
    scheduledDate: task.scheduledDate || '',
    notes: task.notes || '',
    pointValue: task.pointValue || undefined,
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
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      extendedDescription: task.extendedDescription || '',
      area: task.area,
      subCategory: task.subCategory || undefined,
      priority: task.priority,
      status: task.status,
      size: task.size || undefined,
      dueDate: task.dueDate || '',
      scheduledDate: task.scheduledDate || '',
      notes: task.notes || '',
      pointValue: task.pointValue || undefined,
    });
    setSelectedDependencies(dependencies.map((d) => d.id));
    setSelectedProjects(linkedProjects.map((p) => p.id));
    setSelectedGoals(linkedGoals.map((g) => g.id));
  }, [task, dependencies, linkedProjects, linkedGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // First, save the task data
      const input: UpdateTaskInput = {
        ...formData,
        description: formData.description || undefined,
        extendedDescription: formData.extendedDescription || undefined,
        notes: formData.notes || undefined,
        dueDate: formData.dueDate || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        size: formData.size || undefined,
      };
      await onSave(task.id, input);

      // Then, apply pending dependency changes
      const currentDepIds = new Set(dependencies.map((d) => d.id));
      const newDepIds = new Set(selectedDependencies);

      const dependencyRemovals = Array.from(currentDepIds)
        .filter((id) => !newDepIds.has(id))
        .map((id) => onDependencyRemove(task.id, id));

      const dependencyAdditions = Array.from(newDepIds)
        .filter((id) => !currentDepIds.has(id))
        .map((id) => onDependencyAdd(task.id, id));

      // Apply pending project link changes
      const currentProjectIds = new Set(linkedProjects.map((p) => p.id));
      const newProjectIds = new Set(selectedProjects);

      const projectUnlinks = Array.from(currentProjectIds)
        .filter((id) => !newProjectIds.has(id))
        .map((id) => onProjectUnlink(task.id, id));

      const projectLinks = Array.from(newProjectIds)
        .filter((id) => !currentProjectIds.has(id))
        .map((id) => onProjectLink(task.id, id));

      // Apply pending goal link changes
      const currentGoalIds = new Set(linkedGoals.map((g) => g.id));
      const newGoalIds = new Set(selectedGoals);

      const goalUnlinks = Array.from(currentGoalIds)
        .filter((id) => !newGoalIds.has(id))
        .map((id) => onGoalUnlink(task.id, id));

      const goalLinks = Array.from(newGoalIds)
        .filter((id) => !currentGoalIds.has(id))
        .map((id) => onGoalLink(task.id, id));

      // Wait for all linking operations to complete
      await Promise.all([
        ...dependencyRemovals,
        ...dependencyAdditions,
        ...projectUnlinks,
        ...projectLinks,
        ...goalUnlinks,
        ...goalLinks,
      ]);

      // Success: show toast and close modal
      showToast({
        type: 'success',
        title: 'Task updated',
        message: 'Your changes have been saved successfully.',
      });
      onClose();
    } catch (err) {
      // Error: show error message and keep modal open
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
      const size = ext.size ?? ext.storyPoints;
      return { ...ext, size } as CreateTaskInput;
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add dependencies.';
      showToast({
        type: 'error',
        title: 'Failed to add dependencies',
        message: errorMessage,
      });
    }
  };

  const availableSubCategories = SUBCATEGORIES_BY_AREA[formData.area || task.area];

  const taskEntities: EntitySummary[] = availableTasks
    .filter((t) => t.id !== task.id)
    .map((t) => ({
      id: t.id,
      title: t.title,
      type: 'task',
      area: t.area,
      status: t.status,
    }));

  // Get entities to display based on pending selections
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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close task edit panel"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none overflow-y-auto">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl rounded-lg pointer-events-auto relative flex flex-col max-h-[90vh] overflow-hidden">
          {/* Loading Overlay */}
          {(isLoading || isSaving) && (
            <div
              className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto"
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

          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Task</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Close task edit panel"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form
              onSubmit={handleSubmit}
              className={`p-6 space-y-6 ${isLoading || isSaving ? 'pointer-events-none opacity-60' : ''}`}
              aria-busy={isLoading || isSaving}
            >
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error</p>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
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
                      setFormData({
                        ...formData,
                        area: e.target.value as Area,
                        subCategory: undefined,
                      })
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
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as Priority })
                    }
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
                      setFormData({ ...formData, status: e.target.value as TaskStatus })
                    }
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
                    Not a time estimate — use 1, 2, 3, 5, 8, 13, or 21 only.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Point Value
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
                      placeholder="AI-calculated"
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
                    Reward points earned for completing this task
                  </p>
                </div>
              </div>

              {isAIConfigured && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAIAssist(!showAIAssist)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    <Sparkles size={18} />
                    <span>AI Tools</span>
                    {showAIAssist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showAIAssist && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAIMode('breakdown')}
                          className={`px-3 py-1.5 text-sm rounded-full transition ${
                            aiMode === 'breakdown'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Break Down
                        </button>
                        <button
                          type="button"
                          onClick={() => setAIMode('priority')}
                          className={`px-3 py-1.5 text-sm rounded-full transition ${
                            aiMode === 'priority'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Priority Advisor
                        </button>
                        <button
                          type="button"
                          onClick={() => setAIMode('estimate')}
                          className={`px-3 py-1.5 text-sm rounded-full transition ${
                            aiMode === 'estimate'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Estimate story points
                        </button>
                        <button
                          type="button"
                          onClick={() => setAIMode('dependencies')}
                          className={`px-3 py-1.5 text-sm rounded-full transition ${
                            aiMode === 'dependencies'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Find Dependencies
                        </button>
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
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Dependencies
                </h3>

                <div className="space-y-3">
                  {blockedBy.length > 0 && (
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
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
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
                    {displayDependencies.length > 0 && (
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
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Relationships
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                      <span>Projects ({displayProjects.length})</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsProjectPickerOpen(true)}
                      >
                        Link Projects
                      </Button>
                    </div>
                    {displayProjects.length > 0 && (
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
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                      <span>Goals ({displayGoals.length})</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsGoalPickerOpen(true)}
                      >
                        Link Goals
                      </Button>
                    </div>
                    {displayGoals.length > 0 && (
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
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading || isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading || isSaving}>
                  {isLoading || isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

      <ToastContainer />
    </>
  );
}
