import { Pencil, Calendar, Clock, FileText, Tag, Award } from 'lucide-react';
import type { Task } from '@/types/growth-system';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { SUBCATEGORIES_BY_AREA } from '@/constants/growth-system';
import { JitKnowledgePanel } from '@/components/organisms/JitKnowledgePanel';
import { CookedTaskButton } from '@/components/organisms/planner/CookedTaskButton';

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailDialog({ task, isOpen, onClose, onEdit }: TaskDetailDialogProps) {
  if (!task) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', {
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      size="lg"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <PriorityIndicator priority={task.priority} size="md" />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                  {task.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} size="sm" />
                  <AreaBadge area={task.area} size="sm" />
                  {subCategoryLabel && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {subCategoryLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {(task.description || task.extendedDescription) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              <span>Description</span>
            </div>
            <div className="pl-6 space-y-2">
              {task.description && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
              {task.extendedDescription && (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {task.extendedDescription}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(task.dueDate)}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Date */}
          {task.scheduledDate && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scheduled Date
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(task.scheduledDate)}
                </div>
              </div>
            </div>
          )}

          {task.size && task.size > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Story points
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{task.size}pts</div>
              </div>
            </div>
          )}

          {/* Wallet reward (distinct from effort) */}
          {task.pointValue !== null && task.pointValue !== undefined && (
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wallet reward
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {task.pointValue} {task.pointValue === 1 ? 'point' : 'points'}
                  {task.rewardLedgerStatus === 'reversed'
                    ? ' · reward was clawed back after reopening (see wallet history)'
                    : task.pointsAwarded
                      ? ' · credited to wallet'
                      : ' · credited when marked Done'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {task.notes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </div>
            <div className="pl-6">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {task.notes}
              </p>
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

        {/* Action Buttons */}
        <div className="flex justify-end flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <CookedTaskButton task={task} />
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onEdit(task);
              onClose();
            }}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Task
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
