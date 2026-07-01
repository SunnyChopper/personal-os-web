import type { ReactNode } from 'react';
import { Pencil, Calendar, Clock, FileText, Tag, Coins } from 'lucide-react';
import { formatTaskStoryPointsLabel } from '@/constants/growth-system';
import type { Task } from '@/types/growth-system';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { PointBadge } from '@/components/atoms/PointBadge';
import { pointBadgeStatusFromTask, pointBadgeStatusHint } from '@/lib/point-badge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TaskContextVibePills } from '@/components/molecules/TaskContextVibePills';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { SUBCATEGORIES_BY_AREA } from '@/constants/growth-system';
import { parseDateInput, formatDateString } from '@/utils/date-formatters';
import { JitKnowledgePanel } from '@/components/organisms/JitKnowledgePanel';
import { VelocityDragInterventionCard } from '@/components/molecules/VelocityDragInterventionCard';
import { CookedTaskButton } from '@/components/organisms/planner/CookedTaskButton';
import { TaskFieldMarkdown } from '@/components/molecules/TaskFieldMarkdown';

function TaskDetailStatCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{children}</div>
    </div>
  );
}

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onSplitDraggedTask?: (task: Task) => void | Promise<void>;
  isSplittingDraggedTask?: boolean;
  splitDragError?: string | null;
}

export function TaskDetailDialog({
  task,
  isOpen,
  onClose,
  onEdit,
  onSplitDraggedTask,
  isSplittingDraggedTask,
  splitDragError,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const formatDate = (dateString: string | null) =>
    formatDateString(dateString, { year: 'numeric', month: 'long', day: 'numeric' });

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const parsed = parseDateInput(dateString);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const subCategoryLabel = task.subCategory
    ? SUBCATEGORIES_BY_AREA[task.area]?.find((sc) => sc === task.subCategory) || task.subCategory
    : null;

  const walletStatus = pointBadgeStatusFromTask(task);
  const walletHint = pointBadgeStatusHint(walletStatus);
  const hasStats =
    !!task.dueDate ||
    !!task.scheduledDate ||
    (task.size != null && task.size > 0) ||
    (task.pointValue != null && task.pointValue > 0);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      size="lg"
      className="max-h-[90vh]"
    >
      <div className="space-y-5">
        <div className="min-w-0 space-y-2">
          <h2 className="text-2xl font-bold leading-tight text-gray-900 break-words dark:text-white">
            {task.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityIndicator priority={task.priority} size="sm" variant="badge" />
            <StatusBadge status={task.status} size="sm" />
            <AreaBadge area={task.area} size="sm" />
            {subCategoryLabel ? (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {subCategoryLabel}
              </span>
            ) : null}
            <TaskContextVibePills
              readOnly
              compact
              energyLevel={task.energyLevel}
              executionWindow={task.executionWindow}
            />
          </div>
        </div>

        {hasStats ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {task.dueDate ? (
              <TaskDetailStatCard icon={Calendar} label="Due date">
                {formatDate(task.dueDate)}
              </TaskDetailStatCard>
            ) : null}
            {task.scheduledDate ? (
              <TaskDetailStatCard icon={Clock} label="Scheduled">
                {formatDate(task.scheduledDate)}
              </TaskDetailStatCard>
            ) : null}
            {task.size != null && task.size > 0 ? (
              <TaskDetailStatCard icon={Tag} label="Story points">
                {formatTaskStoryPointsLabel(task.size)}
              </TaskDetailStatCard>
            ) : null}
            {task.pointValue != null && task.pointValue > 0 ? (
              <TaskDetailStatCard icon={Coins} label="Wallet reward">
                <div className="flex flex-wrap items-center gap-2">
                  <PointBadge value={task.pointValue} status={walletStatus} size="md" />
                  {walletHint ? (
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                      {walletHint}
                    </span>
                  ) : null}
                </div>
              </TaskDetailStatCard>
            ) : null}
          </div>
        ) : null}

        {(task.description || task.extendedDescription) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" aria-hidden />
              <span>Description</span>
            </div>
            <div className="space-y-2">
              {task.description ? (
                <TaskFieldMarkdown
                  taskId={task.id}
                  field="description"
                  value={task.description}
                  className="text-gray-700 dark:text-gray-300"
                />
              ) : null}
              {task.extendedDescription ? (
                <TaskFieldMarkdown
                  taskId={task.id}
                  field="extendedDescription"
                  value={task.extendedDescription}
                  className="text-gray-600 dark:text-gray-400"
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {task.notes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </div>
            <div>
              <TaskFieldMarkdown
                taskId={task.id}
                field="notes"
                value={task.notes}
                className="text-gray-600 dark:text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Metadata Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {task.status === 'Done' && task.completedDate && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Completed:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDateTime(task.completedDate)}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>{' '}
              <span className="text-gray-700 dark:text-gray-300">
                {formatDateTime(task.createdAt)}
              </span>
            </div>
            {task.updatedAt !== task.createdAt && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDateTime(task.updatedAt)}
                </span>
              </div>
            )}
            {task.isRecurring && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Recurring:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">Yes</span>
              </div>
            )}
          </div>
        </div>

        <JitKnowledgePanel
          query={[task.title, task.description, task.extendedDescription]
            .filter(Boolean)
            .join('\n')}
          contextId={task.id}
        />

        <VelocityDragInterventionCard
          task={task}
          onSplit={onSplitDraggedTask ? () => onSplitDraggedTask(task) : undefined}
          isSplitting={isSplittingDraggedTask}
          splitError={splitDragError}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <CookedTaskButton task={task} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                onEdit(task);
                onClose();
              }}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              Edit Task
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
